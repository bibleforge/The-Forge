<?php

error_reporting(E_ALL);
set_time_limit(9999999);

die('Are you sure?');
// ********************
// delcare variables
// ********************
$table = "bible_english";
$searchable = 'bible_english_verses';
$simple = 'bible_english_html';

$db = mysql_connect("localhost", "XXXXXXXXX", "XXXXXXXXXXXXXX");
mysql_select_db("Bible", $db);

mysql_query("SET NAMES utf8");


$query = "SELECT id, verseID, book, chapter, verse, word, divine, quotation, added FROM $table WHERE word != '' ORDER BY id";

$res = mysql_query($query) or die(mysql_error() . "<br>". $query);
$vID = 0;
$b = 0;
$c = 0;
$v = 0;
$str = "";
while ($row = mysql_fetch_assoc($res)) {
	if ($vID != $row['verseID']) {
		if ($vID > 0) {
			$query = "INSERT INTO $simple (id, book, chapter, verse, words) VALUES
			($vID, $b, $c, $v, '". addslashes(addslashes(substr($str, 0, -1))) ."')";
			mysql_query($query) or die(mysql_error() . "<br>". $query);
		}
		$vID = $row['verseID'];
		$b = $row['book'];
		$c = $row['chapter'];
		$v = $row['verse'];
		$str = "";
	}
	$str .= "<a";
	if ($row['divine'] == 1 || $row['quotation'] == 1 || $row['added'] == 1) {
		$class_str = '';
		$str .= " class=";
		if ($row['divine'] == 1) $class_str .= " d";
		if ($row['quotation'] == 1) $class_str .= " q";
		if ($row['added'] == 1) $class_str .= " a";
		$class_str = trim($class_str);
		if (strpos($class_str, ' ') !== false) $class_str = "'$class_str'";
		$str .= $class_str;
	}
	$str .= " id={$row["id"]}>{$row["word"]}</a> ";
}

$query = "INSERT INTO $simple (id, book, chapter, verse, words) VALUES
		  ($vID, $b, $c, $v, '". addslashes(addslashes(substr($str, 0, -1))) ."')";
mysql_query($query) or die(mysql_error() . "<br>". $query);

echo 'done';