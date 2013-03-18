var config = require("./config.js").config,
    fs = require("fs");

console.log("    /// Created in the Forge by create_load_languages.js.");
fs.readdirSync(config.static_path + "js/lang/").forEach(function (filename)
{
    var path = require("path"),
        lang;
    
    if (filename !== "en.js") {
        lang = path.basename(filename, path.extname(filename));
        
        console.log("    if (!BF.lang." + lang + ") {");
        console.log("        BF.langs." + lang + " = {");
        console.log("            full_name: \"" + require(config.static_path + "js/lang/" + filename).BF.langs[lang].full_name + "\",");
        console.log("            modified: 0,");
        console.log("        };");
        console.log("    }");
    }
});
