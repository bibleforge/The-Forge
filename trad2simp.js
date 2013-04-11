var trad2simp_map,
    special = {};

if (typeof trad2simp_map === "undefined" && typeof require !== "undefined") {
    trad2simp_map = require("./trad2simp_map.js").trad2simp_map;
}

/// Convert the array into an object with each property containing the first character of each word.
/// E.g., {"甚": [{find: "甚麽", replace: "什么"}, {find: "甚麼", replace: "什么"}],
///        "白": [{find: "白乾兒", replace: "白乾儿"}],
///        ...}
[
    /// Convert 甚.
    {find: "甚麽", replace: "什么"},
    {find: "甚麼", replace: "什么"},
    
    /// Preserve 乾
    {find: "白乾兒", replace: "白乾儿"},
    {find: "大便乾燥", replace: "大便乾燥"},
    {find: "烘乾", replace: "烘乾"},
    {find: "烘乾機", replace: "烘乾机"},
    {find: "葡萄乾兒", replace: "葡萄乾儿"},
    /// Could also do 乾安 => 乾安 (a place in Jilin) and 乾縣 => 乾县 (a county in Shaanxi)
    
    /// Preserve 瞭
    {find: "瞭望", replace: "瞭望"},
    {find: "瞭哨", replace: "瞭哨"},
    {find: "明瞭", replace: "明瞭"},
    
    /// Preserve 著
    {find: "著称", replace: "著称"},
    {find: "著名", replace: "著名"},
    {find: "著作", replace: "著作"},
    {find: "著书", replace: "著书"},
    {find: "著述", replace: "著述"},
    {find: "著录", replace: "著录"},
    {find: "著文", replace: "著文"},
    {find: "土著", replace: "土著"},
    {find: "昭著", replace: "昭著"},
    {find: "合著", replace: "合著"},
    {find: "巨著", replace: "巨著"},
    {find: "显著", replace: "显著"},
    {find: "卓著", replace: "卓著"},
    {find: "名著", replace: "名著"},
    {find: "译著", replace: "译著"},
    {find: "新著", replace: "新著"},
    {find: "编著", replace: "编著"},
    {find: "要著", replace: "要著"},
    {find: "拙著", replace: "拙著"},
    {find: "原著", replace: "原著"},
    {find: "执著", replace: "执著"},
    {find: "论著", replace: "论著"},
    {find: "专著", replace: "专著"},
    {find: "景著", replace: "景著"},
].forEach(function (el)
{
    var first = el.find[0];
    
    if (!special[first]) {
        special[first] = [];
    }
    special[first].push(el);
});

///NOTE: 鹼 always goes to 碱 since 硷 is supposedly an obsolete variant of 碱.

///NOTE: Could preserve this name 彷徨.
///NOTE: Possbily 於 can be preserved in 伊於胡底 (but not always). It is also a surname.
///NOTE: 馀 is a variant for 余 (both from the traditional 餘.

this.trad2simp = function (str)
{
    var found_special,
        i,
        len,
        simp_str = "",
        skip_len;
    
    function check_special(match)
    {
        var len = match.find.length;
        
        if (str.substr(i, len) === match.find) {
            /// If it matches, add the new string and move on.
            simp_str += match.replace;
            /// -1 is because it will already skip the current character.
            skip_len = len - 1;
            return true;
        }
    }
    
    if (typeof str !== "string") {
        return str;
    }
    
    len = str.length;
    
    for (i = 0; i < len; i += 1) {
        /// First check for special words.
        if (special[str[i]]) {
            ///NOTE: .some() stops once it finds an element that returns TRUE; then it returns TRUE.
            found_special = special[str[i]].some(check_special);
        }
        
        if (!found_special) {
            simp_str += trad2simp_map[str[i]] || str[i];
        } else {
            found_special = false;
            i += skip_len;
        }
    }
    
    return simp_str;
};
