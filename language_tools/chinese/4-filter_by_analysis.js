var dict = require(process.argv[2]).dict,
    analysis = require(process.argv[3]).analysis,
    dict_text = require("fs").readFileSync(process.argv[2], "utf8");

function find_all_words_with(char)
{
    var words = [];
    
    dict.forEach(function (entry)
    {
        if (entry.indexOf(char) > -1) {
            words[words.length] = entry;
        }
    });
    
    return words;
}

/**
 * Check to see if all of the characters in this word always occur in the same spot (i.e., always right, left, or in the middle).
 *
 * @param word (string) The word whose characters to examine.
 */
function do_all_just_have_one_pos(word)
{
    var i;
    
    for (i = word.length - 1; i >= 0; i -= 1) {
        if (Object.keys(analysis[word[i]]).length > 1) {
            return false;
        }
    }
    return true;
}

Object.keys(analysis).forEach(function (char)
{
    var can_remove = true,
        i,
        keys = Object.keys(analysis[char]),
        dictionary_words;
    
    /// Is it always in the same spot?
    if (keys.length === 1) {
        dictionary_words = find_all_words_with(char);
        for (i = dictionary_words.length - 1; i >= 0; i -= 1) {
            if (!do_all_just_have_one_pos(dictionary_words[i])) {
                can_remove = false;
                break;
            }
        }
        
        if (can_remove) {
            dictionary_words.forEach(function (word)
            {
                dict_text = dict_text.replace("\"" + word + "\",", "");
            });
            
            /// Uncomment the following to see what it is removing.
            /// console.log(char, keys[0], dictionary_words);
        }
    }
});

console.log(dict_text);
