var translit = require("./language_tools/originals/translit.js").translit,
    dbmysql = require("./helpers/node_modules/db-mysql"),
    db = require("./helpers/db.js").db,
    res;

function update_lexicon(type)
{
    var amt = 200,
        i = 0,
        j,
        json;
    
    for (;;) {
        res = db.query_sync("SELECT id, base_word, data FROM lexicon_" + type + " WHERE id >= " + i + " AND id < " + (i + amt));
        
        if (!res || !res.length) {
            break;
        }
        
        for (j = res.length - 1; j >= 0; j -= 1) {
            json = JSON.parse(res[j].data);
            ///NOTE: Since these are all base forms, there is no need to look up another form.
            json.pronun = translit(res[j].base_word.replace(/[\-\(\)]/g, ""));
            json = JSON.stringify(json);
            
            if (json !== res[j].data) {
                console.log(res[j].id);
                db.query_sync("UPDATE lexicon_" + type + " SET data = \"" + json.replace(/[\?\\"']/g, '\\$&') + "\" WHERE id = " + res[j].id);
            }
        }
        
        i += amt;
    }
}

console.log("Updating the Hebrew Lexicon");
update_lexicon("hebrew");
console.log("Updating the Greek Lexicon");
update_lexicon("greek");

console.log("Updating the Original Languages");
(function ()
{
    var amt = 200,
        i = 0,
        j,
        json;
    
    for (;;) {
        res = db.query_sync("SELECT id, word, pronun, strongs FROM bible_original WHERE id >= " + i + " AND id < " + (i + amt));
        
        if (!res || !res.length) {
            break;
        }
        
        for (j = res.length - 1; j >= 0; j -= 1) {
            json = res[j].pronun === "" ? "" : JSON.parse(res[j].pronun);
            json = translit(res[j].word, function ()
            {
                var base_res = db.query_sync("SELECT base_word FROM lexicon_greek WHERE strongs = " + res[j].strongs);
                
                if (base_res && base_res[0].base_word) {
                    return base_res[0].base_word;
                }
                
                console.log("Could not find base form.");
                return res[j].word;
            });
            json = JSON.stringify(json);
            
            if (json !== res[j].pronun) {
                console.log(res[j].id);
                db.query_sync("UPDATE bible_original SET pronun = \"" + json.replace(/[\?\\"']/g, '\\$&') + "\" WHERE id = " + res[j].id);
            }
        }
        
        i += amt;
    }
}());
