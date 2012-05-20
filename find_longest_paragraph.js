var input,
    rl = require('readline'),
    query = require("./helpers/db.js").query;


input = rl.createInterface(process.stdin, process.stdout, null);

input.question("Enter language: ", function(lang) {
    
    query("SELECT id, id2 FROM bible_" + lang + "_html WHERE paragraph = 1", function (data)
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
        
        input.close();
        process.stdin.destroy();
    });
});