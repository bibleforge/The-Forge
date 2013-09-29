var config = require("./config.js").config,
    forge = require("./helpers/forge.js").forge,
    lines = [];

require("fs").readdirSync(config.static_path + "js/lang/").forEach(function (filename)
{
    var path = require("path"),
        lang,
        lang_obj;
    
    /// en.js is loaded by default, so the stub does not need to be added to main.js.
    if (filename !== "en.js") {
        lang = path.basename(filename, path.extname(filename));
        lang_obj = require(config.static_path + "js/lang/" + filename).BF.langs[lang];
        
        lines[lines.length] = "if (!BF.lang." + lang + ") {";
        lines[lines.length] = "    BF.langs." + lang + " = {";
        lines[lines.length] = "        full_name: \"" + lang_obj.full_name + "\",";
        lines[lines.length] = "        hash: \"0\","; ///NOTE: We don't need to set "modified" here since it will be set by cache_buster.js.
        lines[lines.length] = "        match_lang: " + lang_obj.match_lang + ",";
        lines[lines.length] = "    };";
        lines[lines.length] = "}";
    }
});

forge(config.static_path + "/js/main.js", "Language Loading Info", lines);
