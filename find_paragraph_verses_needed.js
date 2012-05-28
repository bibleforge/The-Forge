var ask = require("./helpers/ask.js").ask,
    db = require("./helpers/db.js").db;

ask("Enter language: ", function(lang)
{
    ask("Enter minumum verses required: ", function(min)
    {
        db.query("SELECT id, id2 FROM bible_" + lang + "_html WHERE paragraph = 1", function (data)
        {
            var cur_len,
                i,
                j,
                info,
                len,
                max = 0,
                total = 0;
            
            if (!data) {
                console.log("No results found.");
                return;
            }
            
            len = data.length;
            
            for (i = 0; i < len; i += 1) {
                j = i + 1;
                cur_len = 0;
                
                while (data[j] && cur_len < min) {
                    cur_len = data[j].id2 - data[i].id2;
                    j += 1;
                }
                
                if (cur_len > max) {
                    max = cur_len;
                    info = {start: data[i].id, end: data[j - 1].id};
                }
                
                total += cur_len;
            }
            
            
            console.log(info);
            console.log("ave: " + (total / len));
            console.log("max: " + max);
        });
    });
});