var config = require("../config.js").config;

exports.include_lang = function include_lang(lang_id)
{
    var lang = require(process.cwd() + "/" + config.static_path + "/js/lang/" + lang_id + ".js").BF.langs,
        id;
    
    id = Object.keys(lang)[0];
    return lang[id];
};
