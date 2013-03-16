var corpus = require("fs").readFileSync(process.argv[3], "utf8"),
    dict = require(process.argv[2]).dict,
    analysis = {};

/**
 * Function count the occurrences of needle in a string;
 *
 * @param str    (string) The string to examine
 * @param needle (string) The string to search for
 */
function occurrences(str, needle)
{
    var count = 0,
        pos   = 0,
        step  = needle.length;
    
    if (needle.length === 0) {
        return false;
    }

    for (;;) {
        pos = str.indexOf(needle, pos);
        if (pos > -1) {
            count += 1;
            pos += step;
        } else {
            break;
        }
    }
    
    return count;
}


function add(char, pos, weight)
{
    if (!analysis[char]) {
        analysis[char] = {}
    }
    if (!analysis[char][pos]) {
        analysis[char][pos] = weight;
    } else {
        analysis[char][pos] += weight;
    }
}


process.stdout.write("this.weight={");

dict.forEach(function (entry)
{
    var weight;
    
    ///NOTE: Just doing a pass/fail weight does not really to make it faster.
    weight = occurrences(corpus, entry);
    
    if (weight === 0) {
        return;
    }
    
    process.stdout.write("\"" + entry + "\":" + weight + ",");
});

process.stdout.write("};");

