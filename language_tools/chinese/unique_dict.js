var dict = require(process.argv[2]).dict,
    unqiue = [];

unqiue = [
    /// Add words here to add to the dictionary.
];

dict.forEach(function (el)
{
    if (unqiue.indexOf(el) === -1) {
        unqiue[unqiue.length] = el;
    }
});

process.stdout.write("this.dict=\n");

unqiue.forEach(function (el, i)
{
    if (i === 0) {
        process.stdout.write("[\"" + el + "\"\n");
    } else {
        process.stdout.write(",\"" + el + "\"\n");
    }
});

process.stdout.write("];");
