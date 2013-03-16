var dict = require(process.argv[2]).dict,
    analysis = {};

function add(char, pos)
{
    if (!analysis[char]) {
        analysis[char] = {}
    }
    if (!analysis[char][pos]) {
        analysis[char][pos] = 1;
    } else {
        analysis[char][pos] += 1;
    }
}

dict.forEach(function (entry)
{
    if (entry.length === 1) {
        /// There actually shouldn't be any single characters.
        add(entry[0], "A");
    } else {
        add(entry[0], "L");
        if (entry.length === 2) {
            add(entry[1], "R");
        } else {
            add(entry[1], "M");
            if (entry.length === 3) {
                add(entry[2], "R");
            } else {
                add(entry[2], "M");
                if (entry.length === 4) {
                    add(entry[3], "R");
                } else {
                    add(entry[3], "M");
                    /// 5 is the max
                    add(entry[4], "R");
                }
            }
        }
    }
});

Object.keys(analysis).forEach(function (char)
{
    /// Just compare left to right, not middle.
    var total = (analysis[char].L || 0) + (analysis[char].R || 0);
    
    if (analysis[char].L) {
        analysis[char].L = Math.round(analysis[char].L / total * 100);
    }
    if (analysis[char].R) {
        analysis[char].R = Math.round(analysis[char].R / total * 100);
    }
    
    /// Use a shorthand for 100%.
    if (analysis[char].L === 100) {
        analysis[char].L = 1;
    }
    if (analysis[char].R === 100) {
        analysis[char].R = 1;
    }
    
    /// Just set middle as yes or no.
    if (analysis[char].M) {
        analysis[char].M = 1;
    }
});

console.log("this.analysis =", JSON.stringify(analysis));
