/// Usage: node base64_encode.js [in_file [out_file]]
///NOTE: Use "" for the second parameter to output directly to STD_OUT.
///NOTE: On Linux, just use "base64 -w file > file.b64".

"use strict";

var ask = require("./helpers/ask.js").ask,
    fs = require("fs");

function file_to_base64(path)
{
    return new Buffer(fs.readFileSync(path, "utf8")).toString("base64");
}

function write_file(path, data)
{
    if (path) {
        fs.writeFileSync(path, data, "utf8");
    } else {
        console.log(data);
    }
}

function step2(b64)
{
    ask("To file: (leave blank for direct output) ", function(path2)
    {
        write_file(path2, b64);
    });
}

if (process.argv.length === 4) {
    write_file(process.argv[3], file_to_base64(process.argv[2]));
} else if (process.argv.length === 3) {
    step2(file_to_base64(process.argv[2]));
} else {
    ask("Path to file: ", function(path)
    {
        step2(file_to_base64(path));
    });
}
