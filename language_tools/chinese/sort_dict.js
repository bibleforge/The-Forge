var dict = require(process.argv[2]).dict,
    new_dict = {};

dict.forEach(function (entry)
{
    if (!new_dict[entry.length]) {
        new_dict[entry.length] = [];
    }
    new_dict[entry.length].push(entry);
});

console.log("this.dict=");

for (var i = 2; i <= 5; i += 1) {
    new_dict[i].sort();
    new_dict[i].forEach(function (entry, j)
    {
        if (i === 2 && j === 0) {
            console.log("[\"" + entry + "\"");
        } else {
            console.log(",\"" + entry + "\"");
        }
    });
}

console.log("];");
