var ask = require("./helpers/ask.js").ask,
    config = require("./config.js").config,
    db = require("./helpers/db.js").db
    forge = require("./helpers/forge.js").forge;

function update(lang)
{
    db.query("SELECT id FROM bible_" + lang + " WHERE verseID = 40001001 ORDER BY id LIMIT 1", function (data, err)
    {
        if (!data) {
            console.log(err);
            console.log("No results found.");
            return;
        }
        forge(config.static_path + "/js/lang/" + lang + ".js", "New Testament Division", "nt: " + data[0].id + ",");
        console.log("Updated " + lang + ".js");
        console.log(data[0].id);
        process.exit();
    });
}

if (process.argv.length === 3) {
    update(process.argv[2]);
} else {
    ask("Enter language: ", update);
}
