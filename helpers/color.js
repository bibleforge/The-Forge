/*jslint node: true, white: true */

/*properties
    bg_black, bg_blue, bg_cyan, bg_default, bg_green, bg_magenta, bg_purple, 
    bg_red, bg_white, bg_yellow, black, blink, blue, bold, color, cyan, default, 
    forEach, gray, green, grey, invert, invisible, isArray, italics, magenta, 
    purple, red, strikethrough, toLowerCase, underline, white, yellow
*/

"use strict";

this.color = (function ()
{
    var all_codes = {
        bold:          1,
        italics:       3,
        underline:     4,
        blink:         5,
        invert:        7,
        invisible:     8,
        strikethrough: 9,
        black:         30,
        gray:          30,
        grey:          30,
        red:           31,
        green:         32,
        yellow:        33,
        blue:          34,
        magenta:       35,
        purple:        35,
        cyan:          36,
        white:         37,
        "default":     39,
        bg_black:      40,
        bg_red:        41,
        bg_green:      42,
        bg_yellow:     43,
        bg_blue:       44,
        bg_magenta:    45,
        bg_purple:     45,
        bg_cyan:       46,
        bg_white:      47,
        bg_default:    49
    };
    
    return function color(str, codes)
    {
        var code_str = "";
        
        if (!Array.isArray(codes)) {
            codes = [codes];
        }
        
        codes.forEach(function (code)
        {
            if (typeof code === "string") {
                code = code.toLowerCase();
                if (all_codes[code]) {
                    code_str += "\u001B[" + all_codes[code] + "m";
                }
            }
        });
        
        return code_str + str + "\u001B[0m";
    };
}());