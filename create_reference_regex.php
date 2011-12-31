<?php

echo "Enter language: ";
$lang = trim(fgets(STDIN));

$file = 'data/ref_array_' . $lang . '.php';

if (!file_exists($file)) {
    echo "Sorry, but '" . $file . "' does not exist.\n";
    die(1);
}

require_once $file;
require_once 'helpers/array2regex.php';

$comment = "///NOTE: Created in the Forge via " . basename(__FILE__) . " on " . date('m-d-Y') . " from " . basename($file) . ".\n"; 

$a2r = new array2regex();

echo "<pre>";
echo "$comment";
echo 'var books_re = /^'.$a2r->convert($arr_all).'[\s0-9:.;,\-]*$/i,'."\n";

$str = '    book_arr_re = [0,';
foreach ($arr as $value) {
	$regex = $a2r->convert($value);
	$str .= ' /^' . $regex . '[\s0-9:.;,\-]*$/i,';
}

echo substr($str, 0, -1);
echo '];';
