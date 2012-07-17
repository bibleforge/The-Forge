"use strict";

var ask = require("./helpers/ask.js").ask;

ask("Enter Language: (en) ", function (lang)
{
    var config,
        db,
        fs,
        lang_obj;
    
    if (!lang) {
        lang = "en";
    }
    
    ask("Enter file to use: (../paragraph changes)", function (filename)
    {
        var book     = -1,
            new_file = "";
        
        if (!filename) {
            filename = "../paragraph changes";
        }
        
        fs.readFileSync(filename, "utf8").split(/\r?\n/g).forEach(function (el)
        {
            var possible_book = el.match(/^(\S+)/),
                verseID;
            
            /// Is it a book reference?
            if (possible_book !== null) {
                book = possible_book.input.trim();
                /// Add it to the new file.
                new_file += el + "\n";
            /// Is it a verese reference with nothing after it (e.g., no question mark at the end)?
            } else if (book !== -1 && /\d$/.test(el)) {
                verseID = Number(lang_obj.determine_reference(book + " " + el.trim()));
                if (verseID > 1) {
                    db.query_sync("UPDATE `bible_" + lang + "` SET paragraph = (!paragraph) WHERE verseID = " + verseID + " ORDER BY id LIMIT 1");
                } else {
                    /// This was not a valid verse reference, so don't remove it.
                    new_file += el + "\n";
                }
            } else {
                new_file += el + "\n";
            }
        });
        
        /// Backup old file.
        fs.renameSync(filename, filename + "_" + Date.now())
        /// Create new paragraph file.
        fs.writeFileSync(filename, new_file, "utf8");
    });
    
    /// Load the modules while the user is typing.
    config   = require("./config.js").config;
    db       = require("./helpers/db.js").db;
    fs       = require("fs");
    lang_obj = require(config.static_path + "js/lang/" + lang + ".js").BF.langs[lang];
});
