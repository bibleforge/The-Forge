"use strict";

var ask    = require("./helpers/ask.js").ask,
    db     = require("./helpers/db.js").db,
    fs     = require("fs"),
    zlib   = require("zlib");

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
            
            if (typeof obj.word !== "string") {
                obj.word = obj.word.toString();
            }
            
            if (obj.word === "") {
                return;
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
                        ///NOTE: Some connectors do not convert types to numbers.
                        datum.divine    = Number(datum.divine);
                        datum.red       = Number(datum.red);
                        datum.implied   = Number(datum.implied);
                        datum.paragraph = Number(datum.paragraph);
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

function import_stream(stream)
{
    
}

/**
 * Check the magic number (1f 8b)
 */
function is_gz(path, callback)
{
    fs.open(path, "r", function cb(err, fd)
    {
        var b = new Buffer(2);
        
        fs.read(fd, b, 0, 2, 0, function onread(err, bytesRead, buffer)
        {
            fs.close(fd);
            callback(buffer[0] === 31 && buffer[1] === 139);
        });
    });
}

function stream_gzip(path)
{
    var in_stream = fs.createReadStream(path),
        pipe = {on: function (command, func)
        {
            console.log(command);
            if (command === "drain") {
            //    func();
            }
            //console.log(arguments);
            //console.log(unpipe);
            //done();
        }};
    
    //in_stream.pipe(zlib.createGunzip()).pipe(pipe);
    console.log(typeof in_stream.pipe(zlib.createGunzip()));
}

function import_file(path, callback)
{
    is_gz(path, function next(compressed)
    {
        if (compressed) {
            //console.log(path, "yes");
            stream_gzip(path)
        } else {
            //console.log(path, "no");
        }
        //callback();
    });
}

function looks_like_SQL(filename)
{
    return /\.sql(?:.gz)?$/.test(filename);
}

function import_db(path, callback)
{
    fs.stat(path, function cb(err, stats)
    {
        if (err) {
            console.log("Something didn't work.");
            console.log(err);
            done();
        }
        if (stats.isDirectory()) {
            fs.readdir(path, function onread(err, files)
            {
                var len = files.length;
                
                (function loop(i)
                {
                    if (i < len) {
                        if (looks_like_SQL(files[i])) {
                            import_file(path + "/" + files[i], function cb()
                            {
                                loop(i + 1);
                            });
                        } else {
                            loop(i + 1);
                        }
                    } else {
                        done();
                    }
                }(0));
            });
        } else {
            import_file(path, function cb()
            {
                done();
            });
        }
    });
}

/// Was this run directly?
if (require.main === module) {
    ask("Enter a file or directory to import:", "../db", import_db);
} else {
    exports.import = import_db;
}
