var ask = require("./helpers/ask.js").ask,
    db = require("./helpers/db.js").db;

ask("Enter language: ", function(lang)
{
    db.query("SELECT id, id2 FROM bible_" + lang + "_html WHERE paragraph = 1", function (data)
    {
        var i,
            info,
            len,
            max = 0;
        
        if (!data) {
            console.log("No results found.");
            return;
        }
        
        len = data.length;
        
        for (i = 1; i < len; i += 1) {
            if (data[i].id2 - data[i - 1].id2 > max) {
                max = data[i].id2 - data[i - 1].id2;
                info = {start: data[i - 1].id, end: data[i].id};
            }
        }
        
        console.log(info);
        console.log(max);
    });
});