"use strict";

var ask,
    asker= require("./helpers/ask.js"),
    db   = require("./helpers/db.js").db,
    fs   = require("fs"),
    path = require("path"),
    importers,
    importers_dir = "./importers/",
    yes_no;

function generate_table_structure(lang, word_len, notes_len, callback)
{
    var sql = [];
    
    /// Drop old table (if any)
    sql[sql.length] = "DROP TABLE IF EXISTS `bible_" + lang + "`;";
    
    /// Table structure
    sql[sql.length]      = "CREATE TABLE `bible_" + lang + "` (";
    sql[sql.length - 1] += "`id` mediumint(6) unsigned NOT NULL AUTO_INCREMENT,";
    sql[sql.length - 1] += "`verseID` int(8) unsigned NOT NULL,";
    sql[sql.length - 1] += "`book` tinyint(2) unsigned NOT NULL,";
    sql[sql.length - 1] += "`chapter` tinyint(3) unsigned NOT NULL,";
    sql[sql.length - 1] += "`verse` tinyint(3) unsigned NOT NULL,";
    sql[sql.length - 1] += "`word` char(" + word_len + ") NOT NULL,";
    sql[sql.length - 1] += "`head` tinyint(1) NOT NULL,";
    sql[sql.length - 1] += "`clusterID` tinyint(2) unsigned NOT NULL,";
    sql[sql.length - 1] += "`divine` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`red` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`implied` tinyint(1) unsigned NOT NULL DEFAULT '0',";
    sql[sql.length - 1] += "`lang_order` mediumint(6) unsigned NOT NULL,";
    sql[sql.length - 1] += "`orig_id` mediumint(6) unsigned NOT NULL,";
    sql[sql.length - 1] += "`paragraph` tinyint(1) NOT NULL,";
    sql[sql.length - 1] += "`notes` char(" + notes_len + ") NOT NULL,";
    sql[sql.length - 1] += "PRIMARY KEY (`id`),";
    sql[sql.length - 1] += "KEY `verseID` (`verseID`),";
    sql[sql.length - 1] += "KEY `book` (`book`),";
    sql[sql.length - 1] += "KEY `orig_id` (`orig_id`)";
    sql[sql.length - 1] += ") ENGINE=MyISAM AUTO_INCREMENT=791445 DEFAULT CHARSET=utf8";
    
    db.query_arr(sql, function (data, err)
    {
        callback();
    });
}

function add_row(lang, data, callback)
{
    var str = "INSERT INTO `bible_" + lang + "` VALUES (",
        verseID,
        zeros = ["", "00", "0", ""];
    
    if (data.id) {
        data.id += 1;
    } else {
        data.id = 1;
    }
    
    verseID = data.b + zeros[String(data.c).length] + data.c + zeros[String(data.v).length] + data.v;
    
    /// Is it a new verse?
    if (data.b !== data.last_b || data.c !== data.last_c || data.v !== data.last_v) {
        data.lang_order = 1;
    } else {
        data.lang_order += 1;
    }
    
    if (!data.notes) {
        /// Make sure data.notes is a string so that it has the .replace() property.
        data.notes = "";
    }
    
    str += data.id + "," + verseID + "," + data.b + "," + data.c + "," + data.v + ",'" + data.word.replace(/'/g, "\\'") + "'," + (data.head || 0) + "," + (data.clusterID || 0) + "," + (data.divine || 0) + "," + (data.red || 0) + "," + (data.implied || 0) + "," + data.lang_order + "," + (data.orig_id || 0) + "," + (data.paragraph || 0) + ",'" + data.notes.replace(/'/g, "\\'") + "')"
    
    db.query(str, callback);
    
    /// Set the last book, chapter, and verse to be able to automate lang_order.
    data.last_b = data.b;
    data.last_c = data.c;
    data.last_v = data.v;
}

function does_bible_table_exist(name, callback)
{
    db.query("SHOW TABLES LIKE 'bible_" + name.replace(/'/g, "\\'") + "'", function (res)
    {
        callback(res.length > 0);
    });
}

function done()
{
    process.stdout.write("\u0007");
    ///NOTE: Since the database connection does not close, we need to stop the program manually.
    process.exit();
}

ask    = asker.ask;
yes_no = asker.yes_no;

importers = fs.readdirSync(importers_dir);

process.stdout.write("Available importers:\n");
importers.forEach(function (importer, i)
{
    process.stdout.write(path.basename((i + 1) + ". " + importer, path.extname(importer)) + "\n");
});

ask("Which text do you want to import? ", function (which)
{
    var importer,
        importer_file;
    
    if (Number(which) > 0) {
        importer_file = importers[Number(which) - 1];
    } else {
        importer_file = which + ".js";
    }
    
    if (importers.indexOf(importer_file) !== -1) {
        importer = require(importers_dir + importer_file);
        if (importer && importer.start) {
            importer.start({add_row: add_row, ask: ask, does_bible_table_exist: does_bible_table_exist, done: done, generate_table_structure: generate_table_structure, yes_no: yes_no});
        }
    } else {
        console.warn("Sorry, \"" + importer_file + "\" does not exist.");
    }
});
