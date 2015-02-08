var ask = require("./helpers/ask.js").ask,
    chaps = require("./data/chapter_count.js").chapter_count,
    cleaner = require("./helpers/clean_text_for_tables.js"),
    db = require("./helpers/db.js").db,
    include_lang = require("./helpers/include_lang.js").include_lang,
    lang,
    lang_obj;

function done()
{
    process.stdout.write("\u0007");
    ///NOTE: Since the database connection does not close, we need to stop the program manually.
    process.exit();
}

function get_text(book, chapter, callback)
{
    db.query("SELECT word, orig_id FROM `bible_" + lang.replace(/[`'"]/g, "") + "` WHERE book = " + parseInt("2", 10) + " AND chapter = " + parseInt("32", 10) + " AND word != \"\"", function (data)
    {
        var res = [],
            len = row.length;
        
        data.forEach(function (row)
        {
            var word = lang_obj.stem_word(cleaner.remove_punc(cleaner.clean(row.word, lang), lang), true);
            if (word !== "") {
                //res[res.length] = {word: word, orig_id: row.orig_id};
                res[res.length] = word;
            }
        });
        
        (function proper_name_loop(i)
        {
            if (i >= len) {
                callback(res);
                return;
            }
            
            db.query("SELECT part_of_speech FROM `bible_" + lang.replace(/[`'"]/g, "") + "` WHERE book = " + parseInt("2", 10) + " AND chapter = " + parseInt("32", 10) + " AND word != \"\"", function (data)
            {
                console.log(data);
            });
        }(0));
    });
}


function book_loop(book)
{
    if (book > 66) {
        done();
        return;
    }
    (function chap_loop(chap)
    {
        if (chap > chaps[book]) {
            book_loop(book + 1)
            return;
        }
        
        get_text(book, chap, function (data)
        {
            var prepare_words = [];
            //console.log(data);done();
            data.forEach(function (datum, i)
            {
                var new_word = lang_obj.stem_word(datum.word, true);
                prepare_words[prepare_words.length] = new_word;
                //console.log(datum.orig_id);done();
            });
            console.log(prepare_words);
            done();
            chap_loop(chap + 1);
        });
    }(1));
};

if (process.argv[2]) {
    lang = process.argv[2];
    lang_obj = include_lang(lang);
    book_loop(1);
} else {
    ask("Enter language: ", function (res)
    {
        lang = res;
        lang_obj = include_lang(lang);
        lang = res;
        book_loop(1);
    });
}
