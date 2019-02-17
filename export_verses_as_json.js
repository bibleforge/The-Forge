"use strict";

var ask = require("./helpers/ask.js").ask;
var yes_no = require("./helpers/ask.js").yes_no;
var fs = require("fs");
var p = require("path");
var execFileSync = require("child_process").execFileSync;
var zeros = ["", "00", "0", ""];

function done()
{
    process.stdout.write("\u0007");
    ///NOTE: Since the database connection does not close, we need to stop the program manually.
    process.exit();
}

function does_bible_table_exist(lang)
{
    return fs.existsSync(p.join(__dirname, "..", "db", "bible_" + lang + "_all.sql.gz"));
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


function export_verses_old(lang, type, callback)
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

function getVerseID(b, c, v)
{
    return b + zeros[String(c).length] + c + zeros[String(v).length] + v;
}

function export_verses(lang, type, cb)
{
    var gzipPath = p.join(__dirname, "..", "db", "bible_" + lang + "_all.sql.gz");
    var sql = execFileSync("gzip", ["-d", "-c", gzipPath], {encoding: "utf8"});
    var table;
    var inserts;
    var json = "{";
    
    /*
    if (type === 1) {
        table = "html";
    } else {
        table = "html";
    }
    */
    table = "html";
    
    inserts = sql.match(new RegExp("INSERT INTO `bible_" + lang + "_" + table + "` VALUES ([^\\n]+);", "g"))
    
    if (!inserts) {
        throw new Error("Cannot parse lines");
    }
    
    inserts.forEach(function oneach(insert)
    {
        var rows = insert.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),'(.*?)',(\d+)\)/g);
        rows.forEach(function oneach(rowStr)
        {
            var row = rowStr.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),'(.*?)',(\d+)\)/);
            var data = {
                id2: row[1],
                id: row[2],
                book: row[3],
                chapter: row[4],
                verse: row[5],
                words: row[6],
                paragraph: row[7],
            };
            if (data.book != 1 || data.chapter != 1 || data.verse != 1) {
                json += ",\n";
            }
            
            if (type === 3) {
                data.words = hardcode(data.words);
            } else if (type === 4) {
                data.words = expand_styles(data.words);
            }
            
            json += "\"" + getVerseID(data.book, data.chapter, data.verse) + "\":" + JSON.stringify({
                p: data.paragraph,
                t: data.words
            });
            
        });
    });
    
    json += "}";
    
    fs.writeFileSync(lang + ".json", json);
    
    cb();
}

function check_lang(lang)
{
    if (does_bible_table_exist(lang)) {
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
        process.exit(1);
    }
}

/// Was this run directly?
if (require.main === module) {
    if (process.argv[2] && does_bible_table_exist(process.argv[2])) {
        if (process.argv[3] && process.argv[3] >= 1 && process.argv[3] <= 4) {
            export_verses(process.argv[2], Number(process.argv[3]), done)
        } else {
            check_lang(process.argv[2]);
        }
    } else {
        ask("Enter language:", "en", check_lang);
    }
} else {
    exports.run = export_verses;
}
