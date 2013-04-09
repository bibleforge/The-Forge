var config = require("./config.js").config,
    fs = require("fs");

console.log("    /// Created in the Forge by create_load_languages.js.");
fs.readdirSync(config.static_path + "js/lang/").forEach(function (filename)
{
    var path = require("path"),
        lang,
        lang_obj;
    
    /// en.js is loaded by default, so the stub does not need to be added to main.js.
    if (filename !== "en.js") {
        lang = path.basename(filename, path.extname(filename));
        lang_obj = require(config.static_path + "js/lang/" + filename).BF.langs[lang];
        
        console.log("    if (!BF.lang." + lang + ") {");
        console.log("        BF.langs." + lang + " = {");
        console.log("            full_name: \"" + lang_obj.full_name + "\",");
        console.log("            modified: 0,"); ///NOTE: We don't need to set "modified" here since it will be set by cache_buster.js.
        console.log("            match_lang: " + lang_obj.match_lang + ",");
        console.log("        };");
        console.log("    }");
    }
});
