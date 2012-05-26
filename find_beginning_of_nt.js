var ask = require("./helpers/ask.js").ask,
    db = require("./helpers/db.js").db;

ask("Enter language: ", function(lang)
{
    db.query("SELECT id FROM bible_" + lang + " WHERE verseID = 40001001 ORDER BY id LIMIT 1", function (data, err)
    {
        if (!data) {
            console.log(err);
            console.log("No results found.");
            return;
        }
        console.log(data[0].id);
    });
});