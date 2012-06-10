var ask   = require("./helpers/ask.js").ask,
    color = require("./helpers/color.js").color,
    db    = require("./helpers/db.js").db,
    
    lang = "en",
    word_ids = [];

ask("Enter language: ", function (lang)
{
    ask("Enter a comma separated list of IDs: ", function (ids)
    {
        try {
            word_ids = JSON.parse("[" + ids + "]");
        } catch (e) {}
        
        if (word_ids.length) {
            ask(color("Do you really want to delete " + word_ids.length + " word" + (word_ids.length === 1 ? "" : "s") + " from bible_" + lang + "?", ["red", "bold"]) + " (y/n) ", function(sure)
            {
                var table_name = "`bible_" + lang + "`";
                
                sure = sure.toLowerCase();
                
                if (sure === "y" || sure === "yes") {
                    word_ids.sort();
                    word_ids.forEach(function (id, i)
                    {
                        var paragraph;
                        
                        /// Since it deletes one word each time, we must also move the ID back one each time.
                        id = Number(id) - i;
                        
                        console.log("Deleting " + id);
                        /// Get paragraph info
                        paragraph = db.query_sync("SELECT paragraph FROM " + table_name + " WHERE id = " + id);
                        
                        db.query_sync("DELETE FROM " + table_name + " WHERE id = " + id);
                        db.query_sync("UPDATE " + table_name + " SET lang_order = (lang_order - 1) WHERE id > " + id + " AND lang_order > 0");
                        db.query_sync("UPDATE " + table_name + " SET paragraph = " + Number(paragraph[0].paragraph) + " WHERE id = (" + id + " + 1)");
                        db.query_sync("UPDATE " + table_name + " SET id = (id - 1) WHERE id > " + id);
                    });
                    
                    console.log("Deleted " + color(word_ids.length, "underline") + " words. Don't forget to edit the file.");
                } else {
                    console.log("I didn't think so.");
                }
            });
        } else {
            console.log("Nothing to do.");
        }
    });
});