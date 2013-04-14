var fs = require("fs");

function forge(file, key, lines)
{
    var code,
        data = fs.readFileSync(file, "utf8"),
        find;
    
    if (lines.length === 1) {
        find = new RegExp("(\n\\s*/// Created in the Forge)[^\n]*(\n\\s*/// " + key + "\n\\s*)[^\n]*");
        code = lines[0];
    } else {
        console.log("TODO: Need to find how much whitespace to add to each line.");
        process.exit();
    }
    fs.writeFileSync(file, data.replace(find, "$1 on " + (new Date()).toGMTString() + ".$2" + code));
}

exports.forge = forge;
