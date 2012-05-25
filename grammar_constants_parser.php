<?php

$debug = false;

$file = 'data/Grammar Constants.txt';

$comment = "        ///NOTE: Created in the Forge via " . basename(__FILE__) . " on " . date('m-d-Y') . " from " . basename($file) . ".\n"; 

$text = file_get_contents($file);

$arr = explode("\n", $text);

/// A value of value means the constants have not begun yet (it is just the heading)
$begin = false;

$data = array();

foreach ($arr as $line) {
	if ($line == 'Begin Constants') { /// This marks the beginning of the constants.
		$begin = true;
		continue;
	} elseif (!$begin || trim($line) == '') { /// The constants have not begun yet or the line is blank.
		continue;
	} elseif ($line == 'End Constants') { /// Stop looking for more constants.
		break;
	}
	
	/// Found a constant
	
	preg_match('/(\s)?([A-Z\d_]+)\s+(\d+)/', $line, $match);
	
	/// Was a new category found?
	if ($match[1] == "") {
		$cat_num = $match[3];
		$cat_word = $match[2];
		$data[$cat_num][$cat_word] = array();
	} else {
		$data[$cat_num][$cat_word][$match[3]] = $match[2];
	}
	
	if ($debug) print_r($match);
}

ksort($data);

if ($debug) print_r($data);

/*

data format:
    [4] => Array
        (
            [PART_OF_SPEECH] => Array
                (
                    [1] => NOUN
                    [2] => VERB


PHP format:
case 1:
	$attr = 'implied';
	break;
	...

PHP format (old):
define('PART_OF_SPEECH', 1);
...

JS format:
var morph_grammar = {'NOUN':'[1,1]','VERB':'[1,2]',...};

*/

$js_str  = '        grammar_keywords:   {';
$js_str2 = '        grammar_categories: [""';

foreach ($data as $key => $category) {
	$cat_const = key($category);
	/// Old PHP format
	//$php_str .= "define('" . addslashes($cat_const) . "', " . (int)$key . ");\n";
	//$php_str .= "case " . (int)$key . ":\n\t\$attr = '" . addslashes(strtolower($cat_const)) . "';\n\tbreak;\n";
	$js_str2 .= ', "' . addslashes(strtolower($cat_const)) . '"';
	foreach ($category[$cat_const] as $subcat_num => $subcat_const) {
		$js_str .= $subcat_const . ': "[' . (int)$key . ',' . (int)$subcat_num . ']", '; 
	}
}

$js_str2 .= '],';
$js_str   = substr($js_str, 0, -2) . '},';

echo $comment;
echo $js_str;
echo "\n";
echo $js_str2;
