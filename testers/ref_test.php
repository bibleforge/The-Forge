<?php

include "ref_test_config.php";

?>
<style>
.worked {
    color: green;
}
.notworked {
    color: red;
}
</style>
<script>
    var BF = {};
    BF.langs = {};
</script>
<script src="<?php echo PATH_TO_LANG; ?>"></script>
<script>
var books_re = <?php preg_match("/books_re = (.*,)$/m", file_get_contents(PATH_TO_LANG), $match); echo $match[1] . "\n"; ?>
    re_other = new RegExp("<?php echo OTHER_REGEX; ?>", "i"),
    total = 0,
    wrong = [0,0,0];

<?php

require_once '../data/ref_array_en_em.php';
echo 'var refs = '. $array_str . ";\n";
?>
var i, books_re_worked, book_arr_re_worked, re_other_worked, book, v, c;

document.write("<table><tr><th>Reference</th><th>books_re</th><th>determine_reference</th><th>re_other</th></tr>");

for (j in refs) {
    for (i in refs[j]) {
        //if (refs[j][i].slice(-1) == ".") continue;
        //if (refs[j][i].length == 1) continue;
        //if (/^[1-3] [a-z]$/.test(refs[j][i])) continue;
        books_re_worked = books_re.test(refs[j][i]);
        book = BF.langs.en_em.determine_reference(refs[j][i]);
        if (book !== false) {
            v = book % 1000; /// Calculate the verse.
            c = ((book - v) % 1000000) / 1000; /// Calculate the chapter.
            book = (book - v - c * 1000) / 1000000; /// Calculate the book by number (e.g., Genesis == 1).
            if (book == parseInt(j) + 1) {
                book_arr_re_worked = true;
            } else {
                book_arr_re_worked = false;
            }
        } else {
            book_arr_re_worked = false;
            book = 0;
        }
        
        re_other_worked = re_other.test(refs[j][i] + " 1:1");

        document.write("<tr><td>" + refs[j][i] + "</td><td class=" + (books_re_worked ? "worked" : "notworked") + ">" + books_re_worked + "</td><td class=" + (book_arr_re_worked ? "worked" : "notworked") + ">" + book_arr_re_worked + " " + BF.langs.en_em.books_short[book] + "</td><td class=" + (re_other_worked ? "worked" : "notworked") + ">" + re_other_worked + "</td></tr>")
        
        if (!books_re_worked) --wrong[0];
        if (!book_arr_re_worked) --wrong[1];
        if (!re_other_worked) --wrong[2];
        ++total;
    }
}
document.write("<tr><td><b>Wrong: <small>(out of " + total + ")</small></b></td><td class=" + (wrong[0] == 0 ? "worked" : "notworked") + ">" + wrong[0] + "</td><td class=" + (wrong[1] == 0 ? "worked" : "notworked") + ">" + wrong[1] + "</td><td class=" + (wrong[2] == 0 ? "worked" : "notworked") + ">" + wrong[2] + "</td></tr>")
document.write("</table>");

</script>