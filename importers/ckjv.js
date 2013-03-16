"use strict";

///NOTE: Since node reuses the same module, segment.js cannot be required twice.
var segmentor = require("../language_tools/chinese/segment.js"),
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
        var split = row.match(/(\D+)([\d]+):([\d]+)\s*(.*)/),
            title;
        
        if (split[1] !== last_book) {
            last_book = split[1];
            book += 1;
        }
        
        /// Get Psalm titles.
        if (book === 19 && psalm_has_title(Number(split[2])) && Number(split[3]) === 1) {
            ///NOTE: Psalm titles are placed on verse 1 inside Chinese parentheses (（）).
            title = split[4].match(/^（([^）]+)/);
            
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

function get_data(file)
{
    //var matches = require("fs").readFileSync(file, "utf8").trim().replace(/Ｈ/g, "h").replace("<HY>愿他们的腰时常弯下（and bow down their back alway）。」", "<HY>愿他们的腰时常弯下（and bow down their back alway）</HY>。」").replace(/(<HY>[^<]*<)[^/]/g, "$1/HY>").match(/"(\D+?\d+:\d+)[^\n]+?(<HY>[^<]*<[^/])/g);
    
    /*
    matches.forEach(function (match)
    {
        var match2;
        match = match.trim() + "Y>";
        match2 = match.match(/\s*"\s*([^\s\d]+\d+:\d+).*(<HY>[^<]+<HY>)/);
        
        console.log(match2[1] + "\n\"" + match2[2] + "\" should be:\n\"" + match2[2].slice(0, -3) + "/HY>\"\n")
    });
    
    process.exit();
    */
    //eval("var " + require("fs").readFileSync(file, "utf8"));
    //console.log(require("fs").readFileSync(file, "utf8").substr(0, 100))
    //console.log(JSON.parse(require("fs").readFileSync(file, "utf8").trim().replace("profiles = new Array(", "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim()));
    //console.log(require("fs").readFileSync(file, "utf8").trim().replace(".*profiles\s*=\s*new\s*Array\s*\(\s*", "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim()));
    //return profiles;
    ///NOTE: There is some junk data before "profiles" at the beginning of the file, so we use ".*" to get rid of it.
    //console.log(JSON.parse(require("fs").readFileSync(file, "utf8").trim().replace(/.*profiles\s*=\s*new\s*Array\s*\(\s*/, "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim()));
    ///NOTE: Applying a (temporary) fix due to the tag "<ＨY>".
    //replace(/(「)(",\s"\D+\d+:\d+\s)/g, "$2$1").replace(/.*profiles\s*=\s*new\s*Array\s*\(\s*/, "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim());
    //return JSON.parse(require("fs").readFileSync(file, "utf8").trim().replace(/Ｈ/g, "h").replace(/(「)(",\s"\D+\d+:\d+\s)/g, "$2$1").replace(/.*profiles\s*=\s*new\s*Array\s*\(\s*/, "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim());
    //var a = JSON.parse(require("fs").readFileSync(file, "utf8").trim().replace(/Ｈ/g, "h").replace("<HY>愿他们的腰时常弯下（and bow down their back alway）。」", "<HY>愿他们的腰时常弯下（and bow down their back alway）</HY>。」").replace(/(<HY>[^<]*<)[^/]/g, "$1/H").replace(/.*profiles\s*=\s*new\s*Array\s*\(\s*/, "[").replace(/^\);$/m, "]").replace("loaded_ckjv = true;", "").trim())
    //console.log(a[652]);process.exit();
    // "[^>]*（[^）]*[a-zA-Z][^）]*）
    
    return JSON.parse(require("fs").readFileSync(file, "utf8").trim()
        .replace(/Ｈ/g, "h")
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

exports.start = function (context)
{
    context.ask("Where are the CKJV files located?", "../languages/Chinese/", function (dir)
    {
        var check_simp,
            check_trad,
            dir_simp = "/ckjv_shangdi_sc/script/",
            dir_trad = "/ckjv_shangdi_tc/script/",
            import_simp = true,
            import_trad = true,
            name_simp = "Simplified Chinese (简体中文)",
            name_trad = "Traditional Chinese (繁體中文)",
            lang_simp = "zh_s",
            lang_trad = "zh_t",
            word_len  = 255,
            notes_len = 1;
        
        function get_simp()
        {
            if (import_simp) {
                console.log("Importing " + name_simp + "...");
                import_text(context, dir + dir_simp + "ckjv.js", name_simp, lang_simp, segment_simp, word_len, notes_len, get_trad);
            } else {
                get_trad();
            }
        }
        
        function get_trad()
        {
            if (import_trad) {
                console.log("Importing " + name_trad + "...");
                import_text(context, dir + dir_trad + "ckjv.js", name_trad, lang_trad, segment_trad, word_len, notes_len, context.done);
            } else {
                context.done();
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
    });
};
