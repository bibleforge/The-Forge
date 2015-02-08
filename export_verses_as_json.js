"use strict";

var ask    = require("./helpers/ask.js").ask,
    db     = require("./helpers/db.js").db,
    yes_no = require("./helpers/ask.js").yes_no,
    clean  = require("./helpers/clean_text_for_tables.js").clean,
    fs     = require("fs");

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

function hardcode(str)
{
    return str.replace(/<a id=\d+>([^<]*)<\/a>/g, "$1").replace(/\s+id=\d+/g, "").replace(/<a class=([^>]+)>([^<]*)<\/a>/g, function onreplace(str, classes, word, pos)
    {
        var str = "<span style=\"",
            styles = "";
        
        /// Classes:
        ///     a (added)
        ///     d (divine)
        ///     q (quotation)
        if (classes.indexOf("a") > -1) {
            styles += "font-style:italic;"
        }
        if (classes.indexOf("d") > -1) {
            styles += "font-variant:small-caps;"
        }
        if (classes.indexOf("q") > -1) {
            styles += "color:#D00;"
        }
        
        
        str += styles + "\">" + word + "</span>";
        
        return str;
    });
}


function expand_styles(str)
{
    return str.replace(/<a id=\d+>([^<]*)<\/a>/g, "$1").replace(/\s+id=\d+/g, "").replace(/<a class=([^>]+)>([^<]*)<\/a>/g, function onreplace(str, classes, word, pos)
    {
        var str = "<span class=\"",
            newclasses = [];
        
        /// Classes:
        ///     a (added)
        ///     d (divine)
        ///     q (quotation)
        if (classes.indexOf("a") > -1) {
            newclasses.push("BibleAdded");
        }
        if (classes.indexOf("d") > -1) {
            newclasses.push("BibleDivine");
        }
        if (classes.indexOf("q") > -1) {
            newclasses.push("BibleQuotation");
        }
        
        str += newclasses.join(" ") + "\">" + word + "</span>";
        
        return str;
    });
}


function export_verses(lang, type, callback)
{
    var sql_base,
        sql_plain = "SELECT `bible_" + lang + "_html`.id, `bible_" + lang + "_verses`.words, `bible_" + lang + "_html`.paragraph FROM  `bible_" + lang + "_html` , `bible_" + lang + "_verses` WHERE `bible_" + lang + "_html`.id = `bible_" + lang + "_verses`.id",
        sql_html  = "SELECT `bible_" + lang + "_html`.id, `bible_" + lang + "_html`.words, `bible_" + lang + "_html`.paragraph FROM  `bible_" + lang + "_html`  WHERE 1",
        filename = "exported_" + lang + ".json";
    
    if (type === 1) {
        sql_base = sql_plain;
    } else {
        sql_base = sql_html;
    }
    
    function add_rows(rows)
    {
        var str = "";
        
        if (!rows || !rows.length) {
            return;
        }
        
        rows.forEach(function oneach(row)
        {
            if (String(row.id) !== "1001001") {
                str += ",\n";
            }
            if (type === 3) {
                row.words = hardcode(row.words);
            } else if (type === 4) {
                row.words = expand_styles(row.words);
            }
            ///NOTE: JSON.stringify() wraps strings in quotes.
            str += "\"" + row.id + "\": {\"p\":" + row.paragraph + ",\"t\":" + JSON.stringify(row.words) + "}";
        });
        fs.appendFileSync(filename, str);
    }
    
    fs.writeFileSync(filename, "{");
    
    (function get_rows(pos, how_many)
    {
        var sql = sql_base + " AND `bible_" + lang + "_html`.id >= " + pos + " ORDER BY `bible_" + lang + "_html`.id LIMIT " + how_many;
        
        db.query(sql, function (data, err)
        {
            if (err) {
                console.log(data);
                console.log(sql);
                throw err;
            }
            
            add_rows(data);
            
            /// Is it done?
            if (data.length < how_many) {
                fs.appendFileSync(filename, "}");
                console.log("written to " + filename);
                done();
            } else {
                get_rows(Number(data[data.length - 1].id) + 1, how_many);
            }
        });
    }(0, 5000));
}

function check_lang(lang)
{
    does_bible_table_exist(lang, function (exists)
    {
        if (exists) {
            console.log("Which type?");
            console.log("(1) Plain text");
            console.log("(2) HTML");
            console.log("(3) HTML with hardcoded styles");
            console.log("(4) HTML with expanded class names");
            ask("Type :", 1, function (type)
            {
                type = parseInt(type);
                if (type !== 1 && type !== 2 && type !== 3 && type !== 4) {
                    console.error("Bad type");
                    process.exit();
                }
                export_verses(lang, type)
            });
        } else {
            console.error("Sorry, the SQL data for \"" + lang + "\" does not exist.");
            process.exit();
        }
    });
}

/// Was this run directly?
if (require.main === module) {
    ask("Enter language:", "en", check_lang);
} else {
    exports.run = export_verses;
}
