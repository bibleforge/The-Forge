"use strict";

var ask    = require("./helpers/ask.js").ask,
    db     = require("./helpers/db.js").db,
    yes_no = require("./helpers/ask.js").yes_no,
    clean  = require("./helpers/clean_text_for_tables.js").clean;

function done()
{
    process.stdout.write("\u0007");
    ///NOTE: Since the database connection does not close, we need to stop the program manually.
    process.exit();
}

function does_bible_table_exist(name, callback)
{
    db.query("SHOW TABLES LIKE 'bible_" + name.replace(/'/g, "\\'") + "'", function (res)
    {
        callback(res.length > 0);
    });
}

function create_table_structures(lang, callback)
{
    var sql = [];
    
    /// Drop HTML
    sql[sql.length] = "DROP TABLE IF EXISTS `bible_" + lang + "_html`";
    
    /// Create HTML
    sql[sql.length]      = "CREATE TABLE `bible_" + lang + "_html` (";
    sql[sql.length - 1] += "`id2` mediumint(3) unsigned NOT NULL AUTO_INCREMENT,";
    sql[sql.length - 1] += "`id` int(4) unsigned NOT NULL,";
    sql[sql.length - 1] += "`book` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`chapter` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`verse` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`words` text NOT NULL,";
    sql[sql.length - 1] += "`paragraph` tinyint(1) unsigned NOT NULL,";
    sql[sql.length - 1] += "PRIMARY KEY (`id2`),";
    sql[sql.length - 1] += "KEY `verseID` (`id`),";
    sql[sql.length - 1] += "KEY `book` (`book`)";
    sql[sql.length - 1] += ") ENGINE=MyISAM DEFAULT CHARSET=utf8;";
    
    /// Drop Verses
    sql[sql.length] = "DROP TABLE IF EXISTS `bible_" + lang + "_verses`";
    
    /// Create Verses
    sql[sql.length]      = "CREATE TABLE `bible_" + lang + "_verses` (";
    sql[sql.length - 1] += "`id2` mediumint(3) unsigned NOT NULL AUTO_INCREMENT,";
    sql[sql.length - 1] += "`id` int(4) unsigned NOT NULL,";
    sql[sql.length - 1] += "`book` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`chapter` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`verse` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`words` text NOT NULL,";
    sql[sql.length - 1] += "PRIMARY KEY (`id2`),";
    sql[sql.length - 1] += "KEY `verseID` (`id`),";
    sql[sql.length - 1] += "KEY `book` (`book`),";
    sql[sql.length - 1] += "FULLTEXT KEY `words` (`words`)";
    sql[sql.length - 1] += ") ENGINE=MyISAM DEFAULT CHARSET=utf8;";
    
    db.query_arr(sql, function (data, err)
    {
        if (err.length) {
            console.log(err);
            throw "Error creating tables";
        }
        callback();
    });
}


function create_verses(lang, force, callback)
{
    /// Get the space symbol for that language (if any).
    var space = require(require("./config.js").config.static_path + "js/lang/" + lang + ".js").BF.langs[lang].space;
    
    function check_for_tables(callback)
    {
        does_bible_table_exist(lang + "_html", function (html_exists)
        {
            does_bible_table_exist(lang + "_verses", function (verses_exists)
            {
                callback(html_exists, verses_exists);
            });
        });
    }
    
    
    function start_creating_tables()
    {
        var first = true,
            last_verseID,
            last_b,
            last_c,
            last_v,
            has_para,
            intro_html   = "INSERT INTO `bible_" + lang +   "_html` (id, book, chapter, verse, words, paragraph) VALUES ",
            intro_verses = "INSERT INTO `bible_" + lang + "_verses` (id, book, chapter, verse, words) VALUES ",
            phrase_html,
            phrase_verses,
            sql_html = "",
            sql_verses = "",
            queries_html = [],
            queries_verses = [];
        
        function add_word(obj)
        {
            var class_str;
            
            if (last_verseID !== obj.verseID) {
                /// Is there any data?
                if (last_verseID) {
                    if (!first) {
                        sql_html += ",";
                        sql_verses += ",";
                    }
                    sql_html   += "(" + last_verseID + ", " + last_b + ", " + last_c + ", " + last_v + ", '" + phrase_html.trim().replace(/'/g, "\\'") + "', " + has_para + ")";
                    sql_verses += "(" + last_verseID + ", " + last_b + ", " + last_c + ", " + last_v + ", '" + phrase_verses.trim().replace(/'/g, "\\'") + "')";
                    first = false;
                    
                    if (sql_html.length > 70000 || obj.end) {
                        queries_html[queries_html.length] = intro_html + sql_html;
                        queries_verses[queries_verses.length] = intro_verses + sql_verses;
                        sql_html = "";
                        sql_verses = "";
                        first = true;
                        
                        if (obj.end) {
                            return;
                        }
                    }
                }
                last_verseID = obj.verseID;
                last_b = obj.book;
                last_c = obj.chapter;
                last_v = obj.verse;
                has_para = obj.paragraph;
                phrase_html = "";
                phrase_verses = "";
            }
            
            if (obj.word === "") {
                return;
            }
            
            if (typeof obj.word !== "string") {
                obj.word = obj.word.toString();
            }
            
            phrase_html += "<a";
            if (obj.divine || obj.red || obj.implied) {
                class_str = "";
                phrase_html += " class=";
                if (obj.divine) {
                    class_str += " d";
                }
                if (obj.red) {
                    class_str += " q";
                }
                if (obj.implied) {
                    class_str += " a";
                }
                
                class_str = class_str.trim();
                if (class_str.indexOf(" ") > -1) {
                    class_str = "'" + class_str + "'";
                }
                phrase_html += class_str;
            }
            
            /// Clean up the word (e.g., convert straight quotes to curly quotes, remove unneeded characters).
            obj.word = clean(obj.word, lang);
            
            phrase_html += " id=" + obj.id + ">" + obj.word + "</a>" + space;
            ///NOTE: Because the verses text must be machine searchable, it always gets a space between words.
            phrase_verses += obj.word + " ";
        }
        
        create_table_structures(lang, function ()
        {
            (function get_rows(pos, how_many)
            {
                db.query("SELECT id, verseID, book, chapter, verse, word, divine, red, implied, paragraph FROM `bible_" + lang + "` WHERE id >= " + pos + " ORDER BY id LIMIT " + how_many, function (data, err)
                {
                    if (err) {
                        console.log(data);
                        console.log(err);
                        throw "Error";
                    }
                    
                    data.forEach(function (datum)
                    {
                        add_word(datum);
                    });
                    
                    if (data.length < how_many) {
                        /// Send a special signal to make it create the last piece of SQL.
                        add_word({end: true});
                        
                        db.query_arr(queries_html, function (data, err)
                        {
                            if (err.length) {
                                console.log(err);
                                throw "Error adding html";
                            }
                            ///NOTE: It should expect 31,232 verses with Pauline subscriptions and 31,218 without (both figures include Psalm titles).
                            db.query_arr(queries_verses, function (data, err)
                            {
                                if (err.length) {
                                    console.log(err);
                                    throw "Error adding verses";
                                }
                                if (callback) {
                                    callback();
                                } else {
                                    done();
                                }
                            });
                        });
                    } else {
                        get_rows(Number(data[data.length - 1].id) + 1, how_many);
                    }
                });
            }(0, 5000));
        });
    }
    
    check_for_tables(function (html_exists, verses_exists)
    {
        if ((html_exists || verses_exists) && !force) {
            yes_no("Do you really want to overwrite the existing table(s)? ", function (overwrite)
            {
                if (overwrite) {
                    start_creating_tables();
                }
            }, ["red", "bold"]);
        } else {
            start_creating_tables();
        }
    });
}

function check_lang(lang, force, callback)
{
    does_bible_table_exist(lang, function (exists)
    {
        if (exists) {
            create_verses(lang, force, callback);
        } else {
            console.warn("Sorry, the SQL data for \"" + lang + "\" does not exist.");
        }
    });
}

/// Was this run directly?
if (require.main === module) {
    ask("Enter language:", "en", check_lang);
} else {
    exports.run = function (lang, callback)
    {
        /// Set force to TRUE so that it does not try to ask for input.
        check_lang(lang, true, callback);
    };
}
