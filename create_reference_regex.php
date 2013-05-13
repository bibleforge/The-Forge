<?php

$data = "";

if (isset($argv[1])) {
    $lang = $argv[1];
} else {
    echo "Enter language: ";
    $lang = trim(fgets(STDIN));
}


$file = 'data/ref_array_' . $lang . '.php';

if (!file_exists($file)) {
    echo "Sorry, but '" . $file . "' does not exist.\n";
    die(1);
}

require_once $file;
require_once 'helpers/array2regex.php';

$a2r = new array2regex();

$data .= "            ///NOTE: Created in the Forge via " . basename(__FILE__) . " on " . date('m-d-Y') . " from " . basename($file) . ".\n";
$data .= '            var books_re = /^'.$a2r->convert($arr_all).'[\d:.;,\-\s]*$/i,'."\n";

$str = '                book_arr_re = [0,';
foreach ($arr as $value) {
	$regex = $a2r->convert($value);
	$str .= ' /^' . $regex . '[\d:.;,\-\s]*$/i,';
}

$data .= substr($str, 0, -1);
$data .= '];';

if (isset($argv[2])) {
    file_put_contents($argv[2], $data);
} else {
    echo $data;
}
