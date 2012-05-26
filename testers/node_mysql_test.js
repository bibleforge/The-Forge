var translit = require("../helpers/translit.js").translit,
    db = require("../helpers/db.js").db;

function do_translit(word, dont_check_base_form)
{
    return translit(word, dont_check_base_form ? undefined : function (word)
    {
        var data = db.query_sync("SELECT `lexicon_greek`.base_word FROM `bible_original`, `lexicon_greek` WHERE `bible_original`.word like  \"" + word + "\" AND `lexicon_greek`.strongs = `bible_original`.strongs LIMIT 1");
        
        if (data && data[0] && data[0].word) {
            return data[0].word;
        }
        
        return word;
    });
}

///TODO: Confirm correct results.

console.log(do_translit("Α", true));
console.log(do_translit("Ω", true));
//process.exit();
console.log(do_translit("אֵלִיָּהוּ׃", true));
console.log(do_translit("אֵֽלִיָּֽהוּ׃", true));
console.log(do_translit("אֵֽלִיָּֽהוּפַּ֥", true));
console.log(do_translit("בְּרֵאשִׁ֖ית", true));
console.log(do_translit("תִּרְצָה", true));
console.log(do_translit("Ἑλληνιστί", true));
console.log(do_translit("ἐπυνθάνετο", true));
console.log(do_translit("ἐπυνθάνετο")); /// Should split after the Epsilon.
console.log(do_translit("ἐπαγγελλομέναις")); /// Should split after the Pi.
console.log(do_translit("תִּרְצָה ἐπυνθάνετο", true));
console.log(do_translit("תִּרְצָה ἐπυνθάνετο"));