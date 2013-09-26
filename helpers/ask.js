"use strict";

var color = require("./color.js").color;

var ask = (function ()
{
    var callback;
    
    process.stdin.on("data", function (chunk)
    {
        process.stdin.pause();
        /// substr() is to remove the trailing new line.
        callback(chunk.substr(0, chunk.length - 1));
    });
    
    /**
     * Ask the user for input.
     *
     * @param str   (string)                     The text to output to the user.
     * @param def   (string) (optional)          The default input if nothing is entered.
     * @param cb    (function)                   The function to call when data is returned.
     * @param style (string || array) (optional) The color or style for the text (e.g., "red", "bold", ["blink", "blue", "bg_green"]).
     */
    return function (str, def, cb, style)
    {
        /// Is there no default answer?
        if (typeof def === "function") {
            callback = def;
            style = cb;
        /// There is a default answer variable, but it is undefined.
        } else if (typeof def !== "undefined") {
            /// Add the default text to the end of the string.
            if (def) {
                str += " (" + def + ") ";
            }
            /// Wrap the callback to add the default answer if necessary.
            callback = function (res)
            {
                if (res.trim() === "") {
                    res = def;
                }
                cb(res);
            };
        } else {
            callback = cb;
        }
        
        if (style) {
            str = color(str, style);
        }
        
        process.stdout.write(str);
        
        process.stdin.setEncoding("utf8");
        process.stdin.resume();
    };
}());

this.yes_no = function (str, def, cb, style)
{
    var real_def;
    
    /// Is there no default answer?
    if (typeof def === "function") {
        style = cb;
        cb = def;
    } else {
        real_def = def;
    }
    
    ask(str, real_def, function (ans)
    {
        ans = String(ans).trim().toLowerCase();
        
        cb((ans === "y" || ans === "yes" || ans === "yeah" || ans === "yep" || ans === "1" || ans === "true"));
    }, style);
};

this.ask = ask;