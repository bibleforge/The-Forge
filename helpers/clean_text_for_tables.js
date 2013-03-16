exports.clean = function (word, lang)
{
    if (lang === "en" || lang === "en_em") {
        /// Curly quotes.
        word = word.replace(/'/g, "’");
    } else if (lang === "zh_s" || lang === "zh_t") {
        /// Remove HTML and English notes (removes all printable ASCII characters).
        word = word.replace(/(?:<\/?HY>|（[\u0020-\u00ff]+）)/g, "");
    }
    
    return word;
}

exports.no_spacing = {"zh_s": 1, "zh_t": 1};
