var ask = require("./helpers/ask.js").ask,
    fs = require("fs");

ask("Path to file: ", function(path)
{
    console.log(new Buffer(fs.readFileSync(path, "utf8")).toString("base64"));
});