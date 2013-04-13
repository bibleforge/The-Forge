"use strict";

///NOTE: Since node reuses the same module, segment.js cannot be required twice.
var auto_convert = require("../language_tools/chinese/0-auto_convert.js").run,
    create_verse_tables = require("../create_verse_tables.js").run,
    download_file = require("../helpers/download.js").download,
    fs = require("fs"),
    random_numbers = require("../helpers/random.js").random_numbers,
    segmentor = require("../language_tools/chinese/segment.js"),
    segment_simp,
    segment_trad;

segment_simp = segmentor.segment_init("./analysis_simp.js", "./language_tools/chinese/dict_raw_simp");
segment_trad = segmentor.segment_init("./analysis_trad.js", "./language_tools/chinese/dict_raw_trad", true);

function psalm_has_title(c)
{
    return !(c <= 2 || c === 10 || c === 33 || c === 43 || c === 71 || c === 91 || (c >= 93 && c <= 97) || c === 99 || (c >= 104 && c <= 107) || (c >= 111 && c <= 119) || (c >= 135 && c <= 137) || c >= 146);
}

function split_into_text_verse(data)
{
    var book = 0,
        last_book,
        res = [];
    
    data.forEach(function (row)
    {
        /// Format: BC:V TEXT
        /// Example: 
        ///     创1:1 起初，　上帝创造天地。
        ///     創1:3 　上帝說：「要有光」，就有了光。 (NOTE: Sometimes there is intentional whitespace before a word/line).
        var split = row.match(/(\D+)([\d]+):([\d]+) *(.*)/),
            title;
        
        if (split[1] !== last_book) {
            last_book = split[1];
            book += 1;
        }
        
        /// Get Psalm titles.
        if (book === 19 && psalm_has_title(Number(split[2])) && Number(split[3]) === 1) {
            ///NOTE: Psalm titles are placed on verse 1 inside Chinese parentheses (（）).
            ///      But because notes can be in parentheses too, check to make sure we don't match that with a negative lookahead.
            ///      The two dots (..) are to get the last two characters not matched because of the negative lookahead.
            title = split[4].match(/^（((.(?![^\u0020-\u00ff]）))+..)/);
            
            res[res.length] = {
                b: book,
                c: split[2],
                v: 0,
                text: title[1]
            };
            
            /// Remove the title from the verse.
            split[4] = split[4].substr(title[1].length + 2)
        }
        
        res[res.length] = {
            b: book,
            c: split[2],
            v: split[3],
            text: split[4]
        };
    });
    
    return res;
}

function get_data(data)
{
    ///NOTE: There is some junk data before "profiles" at the beginning of the file, so we use ".*" to get rid of it.
    ///NOTE: Applying various (temporary) fixes.
    return JSON.parse(data
        .replace(/Ｈ/g, "H")
        .replace(/fromthe/g, "from the")
        
        /// Simp
        .replace("<HY>愿他们的腰时常弯下（and bow down their back alway）。」", "<HY>愿他们的腰时常弯下（and bow down their back alway）</HY>。」")
        .replace("滑土（slime）和沥青（pitch）", "<HY>滑土（slime）</HY><HY>和沥青（pitch）</HY>")
        .replace("<HY>诸天之上（in the heavens）<HY></HY>，大地之下（in the earth）</HY>", "<HY>诸天之上（in the heavens）</HY><HY>，大地之下（in the earth）</HY>")
        .replace("，厌恶（hate）", "，<HY>厌恶（hate）</HY>")
        .replace("　上帝（God）警戒（warned）", "<HY>　上帝（God）</HY><HY>警戒（warned）</HY>")
        .replace("<HY>我们（our）<HY></HY>看为（think）</HY>", "<HY>我们（our）</HY><HY>看为（think）</HY>")
        .replace("「看哪（Behold）", "「<HY>看哪（Behold）</HY>")
        .replace("可恶（wicked）", "<HY>可恶（wicked）</HY>")
        .replace("只走王的大道（king's high way）", "只走<HY>王的大道（king's high way）</HY>")
        .replace("你的军长彷佛成群的蚱蜢（grasshoppers）", "你的军长彷佛成群的<HY>蚱蜢（grasshoppers）</HY>")
        .replace("众人听见这些（these）", "众人听见<HY>这些（these）</HY>")
        .replace("。不料（behold），", "。<HY>不料（behold）</HY>，")
        .replace("<HY>并有一人必然来到（and one shall certainly come），并且泛滥经过（and overflow, and pass through）<HY>", "<HY>并有一人必然来到（and one shall certainly come）</HY>，<HY>并且泛滥经过（and overflow, and pass through）</HY>")
        .replace("<HY>正如经上所写的：「（as it is written）</HY>", "<HY>正如经上所写的：（as it is written）</HY>「")
        .replace("众女daughters）", "众女（daughters）") /// 结26:8
        .replace("<HY>已经（have）</HY> known", "<HY>已经（have known）</HY>认识") /// 约一2:14
        
        
        /// Trad
        .replace("<HY>願他們的腰時常彎下（and bow down their back alway）。」", "<HY>願他們的腰時常彎下（and bow down their back alway）</HY>。 」")
        .replace("滑土（slime）和瀝青（pitch）", "<HY>滑土（slime）</HY><HY>和瀝青（pitch）</HY>")
        .replace("<HY>諸天之上（in the heavens）<HY></HY>，大地之下（in the earth）</HY>", "<HY>諸天之上（in the heavens ）</HY><HY>，大地之下（in the earth）</HY>")
        .replace("，厭惡（hate）", "，<HY>厭惡（hate）</HY>")
        .replace("　上帝（God）警戒（warned）", "<HY>　上帝（God）</HY><HY>警戒（warned）</HY>")
        .replace("<HY>我們（our）<HY></HY>看為（think）</HY>", "<HY>我們（our）</HY><HY>看為（think）< /HY>")
        .replace("「看哪（Behold）", "「<HY>看哪（Behold）</HY>")
        .replace("可惡（wicked）", "<HY>可惡（wicked）</HY>")
        .replace("只走王的大道（king's high way）", "只走<HY>王的大道（king's high way）</HY>")
        .replace("你的軍長彷彿成群的蚱蜢（grasshoppers）", "你的軍長彷彿成群的<HY>蚱蜢（grasshoppers）</HY>")
        .replace("眾人聽見這些（these）", "眾人聽見<HY>這些（these）</HY>")
        .replace("。不料（behold），", "。<HY>不料（behold）</HY>，")
        .replace("<HY>並有一人必然來到（and one shall certainly come），並且氾濫經過（and overflow, and pass through）<HY>", "<HY>並有一人必然來到（and one shall certainly come）</HY>，<HY>並且氾濫經過（and overflow, and pass through）</HY>")
        .replace("<HY>正如經上所寫的：「（as it is written）</HY>", "<HY>正如經上所寫的：（as it is written）</HY>「")
        .replace("眾女daughters）", "眾女（daughters）")
        .replace("<HY>已經（have）</HY> known", "<HY>已經（have known）</HY>認識")
        
        .replace(/(<HY>[^<]*<)[^/]/g, "$1/H")
        .replace(/.*profiles\s*=\s*new\s*Array\s*\(\s*/, "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim());
}

function compile_arr(arr)
{
    var prefix = "",
        res = [],
        split_pos;
    
    arr.forEach(function (phrase, i)
    {
        if (typeof phrase === "string") {
            if (i === 0) {
                prefix = phrase;
            } else {
                /// Find where the first right sided puncutation occurs.
                ///NOTE: If none is found, null is returned, which is then converted to {index: -1}.
                ///NOTE: Since "（" can occor before English characters(which should not be right-sided), check for non-English (i.e., punctaution) or the end of the string.
                split_pos = (/(?:<HY>|\u3000|「|『|（(?:[^a-zA-Z]|$))/.exec(phrase) || {index: -1}).index;
                if (split_pos > -1) {
                    /// Put the first part of the string on the last word (if any).
                    res[res.length - 1] += phrase.substr(0, split_pos);
                    /// Save the rest for the next word.
                    prefix = phrase.substr(split_pos);
                } else {
                    res[res.length - 1] += phrase;
                }
            }
        } else {
            phrase.forEach(function (word)
            {
                res[res.length] = prefix + word;
                prefix = "";
            });
        }
    });
    
    if (prefix) {
        console.log(arr);
        console.log(res);
        console.log(prefix);
        throw "Something when wrong";
    }
    
    return res;
}

function import_text(context, data_file, name, lang, segment, word_len, notes_len, callback)
{
    var data = split_into_text_verse(get_data(data_file)),
        obj = {};
    
    context.generate_table_structure(lang, word_len, notes_len, function ()
    {
        var len = data.length;
        
        (function loop(i)
        {
            var last_char,
                words,
                words_len;
            
            if (i >= len) {
                if (callback) {
                    callback();
                }
                return;
            }
            
            /// If the line ends with a quotation mark, add it to the beginning of the next line.
            last_char = data[i].text.slice(-1);
            if (last_char === "「" || last_char === "『" ) {
                data[i + 1].text = last_char + data[i + 1].text;
                data[i].text = data[i].text.slice(0, -1);
            }
            
            words = compile_arr(segment(data[i].text));
            words_len = words.length;
            
            ///NOTE: We need to resuse the same object because add_row() adds properties to it.
            obj.b = data[i].b;
            obj.c = data[i].c;
            obj.v = data[i].v;
            
            (function loop2(j)
            {
                if (j >= words_len) {
                    setTimeout(function ()
                    {
                        loop(i + 1);
                    }, 0);
                    return;
                }
                
                obj.word = words[j];
                
                context.add_row(lang, obj, function (data, err)
                {
                    if (err) {
                        console.warn(err);
                        throw "Error";
                    }
                    loop2(j + 1);
                });
            }(0));
        }(0));
        
    });
}

function create_simplified_version(trad)
{
    return require("../language_tools/chinese/trad2simp.js").trad2simp(trad);
}

function run_auto_convert(type, text, callback)
{
    var tmpfile = process.cwd() + "/tmp_ckjv_" + type + "_" + random_numbers();
    fs.writeFileSync(tmpfile, text);
    
    auto_convert(process.cwd() + "/language_tools/chinese/dict_" + type + ".js", tmpfile, function ()
    {
        fs.unlinkSync(tmpfile);
        callback();
    });
}

function start_importaing(trad_file, context, callback)
{
    var check_simp,
        check_trad,
        import_simp = true,
        import_trad = true,
        name_simp = "Simplified Chinese (简体中文)",
        name_trad = "Traditional Chinese (繁體中文)",
        lang_simp = "zh_s",
        lang_trad = "zh_t",
        word_len  = 255,
        notes_len = 1,
        trad_text = fs.readFileSync(trad_file, "utf8");
    
    function get_simp()
    {
        if (import_simp) {
            console.log("Importing " + name_simp + "...");
            run_auto_convert("simp", create_simplified_version(trad_text), function ()
            {
                console.log("Importing into database...");
                import_text(context, create_simplified_version(trad_text), name_simp, lang_simp, segment_simp, word_len, notes_len, function ()
                {
                    console.log("Creating verse tables...");
                    create_verse_tables(lang_simp, get_trad);
                });
            });
        } else {
            get_trad();
        }
    }
    
    function get_trad()
    {
        if (import_trad) {
            console.log("Importing " + name_trad + "...");
            //import_text(context, trad_text, name_trad, lang_trad, segment_trad, word_len, notes_len, context.done);
            run_auto_convert("trad", trad_text, function ()
            {
                console.log("Importing into database...");
                import_text(context, trad_text, name_trad, lang_trad, segment_trad, word_len, notes_len, function ()
                {
                    console.log("Creating verse tables...");
                    create_verse_tables(lang_trad, callback || context.done);
                });
            });
        } else {
            if (callback) {
                callback();
            } else {
                context.done();
            }
        }
    }
    
    check_simp = function ()
    {
        context.does_bible_table_exist(lang_simp, function (exists)
        {
            if (!exists) {
                check_trad();
            } else {
                context.yes_no("Do you want to overwrite bible_" + lang_simp + "? ", function (overwrite)
                {
                    if (!overwrite) {
                        import_simp = false;
                    }
                    check_trad();
                }, ["red", "bold"]);
            }
        });
    };
    
    check_trad = function ()
    {
        context.does_bible_table_exist(lang_trad, function (exists)
        {
            if (!exists) {
                get_simp();
            } else {
                context.yes_no("Do you want to overwrite bible_" + lang_trad + "? ", function (overwrite)
                {
                    if (!overwrite) {
                        import_trad = false;
                    }
                    get_simp();
                }, ["red", "bold"]);
            }
        });
    };
    
    /// Start by checking if the tables already exist.
    check_simp();
}

exports.start = function (context)
{
    context.yes_no("Download from the internet?", "yes", function (download)
    {
        if (download) {
            context.ask("What is the Traditional Shangdi (上帝) URL?", "http://ckjv.asia/ckjv_shangdi_tc/script/ckjv.js", function (trad_turl)
            {
                var download_filename = "tmp_trad_ckjv_download_" + random_numbers();
                download_file(trad_turl, function ()
                {
                    start_importaing(download_filename, context, function ()
                    {
                        fs.unlinkSync(download_filename);
                        context.done();
                    })
                }, {progress: true, save_as: download_filename});
            });
        } else {
            context.ask("Where is the Traditional Shangdi (上帝) file located?", "../languages/Chinese/ckjv_shangdi_tc/script/ckjv.js", function (trad_file)
            {
                start_importaing(trad_file, context, function ()
                {
                    context.done();
                });
            });
        }
    });
};
