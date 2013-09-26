exports.clean = function clean(word, lang)
{
    if (lang === "en" || lang === "en_em") {
        /// Curly quotes.
        word = word.replace(/'/g, "’");
    } else if (lang === "zh_s" || lang === "zh_t") {
        /// Remove HTML and English notes (removes all printable ASCII characters).
        /// There are also curly apostrophes (\u2019).
        word = word.replace(/(?:<\/?HY>|（[\u0020-\u00ff\u2019]+）)/g, "");
    }
    
    return word;
}

exports.remove_punc = function remove_punc(word, lang)
{
    if (lang === "en" || lang === "en_em") {
        word = word.replace(/[.,;:?!—)(\[\]]|'\b/g, "");
    } else if (lang === "zh_s" || lang === "zh_t") {
        word = word.replace(/[…，。：？！；（）［］｛｝「」『』、丶]/g, "");
    }
    
    return word;
}
