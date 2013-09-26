var created_str = "Created in the Forge",
    fs = require("fs");

function forge(file, key, lines)
{
    var code = "",
        data = fs.readFileSync(file, "utf8"),
        find,
        spacing;
    
    if (typeof lines === "string") {
        lines = [lines];
    }
    
    /// Find out how much spacing needs to be before each line.
    spacing = data.match(new RegExp("([^\\S\\n]*?)/// " + created_str + "[^\\n]*\\n\\s*/// " + key + "\n"))[1];
    
    if (typeof spacing === "undefined") {
        /// Make sure it found something.
        return;
    }
    
    /// Add prefix.
    code = spacing + "/// " + created_str + " on " + (new Date()).toGMTString() + ".\n" + spacing + "/// " + key + "\n";
    
    /// Add spacing to each line and combine.
    lines.forEach(function (line)
    {
        code += spacing + line + "\n";
    });
    /// Add suffix.
    code += spacing + "/// End of " + key + "\n";
    
    fs.writeFileSync(file, data.replace(new RegExp("[^\\S\\n]*?/// " + created_str + "[^\\n]*\\n\\s*/// " + key + "\n[\\s\\S]*/// End of " + key + "\n"), code));
}

exports.forge = forge;
