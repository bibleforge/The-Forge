<?php

require_once 'data/ref_array.php';
require_once 'helpers/array2regex.php';

$a2r = new array2regex();

echo "<pre>";
echo 'var books_re = /^'.$a2r->convert($arr_all).'[\s0-9:.;,-]*$/i;'."\n";

$str = 'var book_arr_re = ["",';
foreach ($arr as $value) {
	$regex = $a2r->convert($value);
	$str .= '/^' . $regex . '[\s0-9:.;,-]*$/i,';
}
echo substr($str, 0, -1);
echo '];';