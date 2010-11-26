<?php

error_reporting(E_ALL);
set_time_limit(9999999);

die('Are you sure?');
/*********************
 * delcare variables *
 *********************/
$table       = "bible_english";
$html_verses = 'bible_english_html';
$searchable  = 'bible_english_verses';


$db = mysql_connect("localhost", "XXXXXXXXX", "XXXXXXXXXXXXXX");
mysql_select_db("bf", $db);

/// Not needed for English version.
//mysql_query("SET NAMES utf8");


$query  = "SELECT id, verseID, book, chapter, verse, word, divine, red, implied, paragraph FROM $table ORDER BY id";

$res    = mysql_query($query) or die(mysql_error() . "<br>" . $query);
$vID    = 0;
$b      = 0;
$c      = 0;
$v      = 0;
$str    = "";
$str2   = "";
$query  = "";
$query2 = "";


$sql_intro1 = "INSERT INTO $html_verses (id, book, chapter, verse, words, paragraph) VALUES ";
$sql_intro2 = "INSERT INTO $searchable  (id, book, chapter, verse, words)            VALUES ";

while ($row = mysql_fetch_assoc($res)) {
	if ($vID != $row['verseID']) {
		if ($vID > 0) {
			$query  .= "($vID, $b, $c, $v, '". addslashes(substr($str,  0, -1)) ."', $para),";
			$query2 .= "($vID, $b, $c, $v, '". addslashes(substr($str2, 0, -1)) ."'),";
			
			if (strlen($query) > 700000) {
				mysql_query($sql_intro1 . substr($query,  0, -1)) or die(__LINE__ . "<br>" . mysql_error() . "<br>". $sql_intro1 . substr($query,  0, -1));
				mysql_query($sql_intro2 . substr($query2, 0, -1)) or die(__LINE__ . "<br>" . mysql_error() . "<br>". $sql_intro2 . substr($query2, 0, -1));
				$query  = "";
				$query2 = "";
			}
		}
		$vID  = $row['verseID'];
		$b    = $row['book'];
		$c    = $row['chapter'];
		$v    = $row['verse'];
		$para = $row['paragraph'];
		$str  = "";
		$str2 = "";
	}
	
	if ($row['word'] === '') continue;
	
	$str .= "<a";
	if ($row['divine'] == 1 || $row['red'] == 1 || $row['implied'] == 1) {
		$class_str  = '';
		$str       .= " class=";
		if ($row['divine']  == 1)   $class_str .= " d";
		if ($row['red']     == 1)   $class_str .= " q";
		if ($row['implied'] == 1)   $class_str .= " a";
		
		$class_str = trim($class_str);
		if (strpos($class_str, ' ') !== false) $class_str = "'$class_str'";
		$str .= $class_str;
	}
	//$str  .= " id={$row["id"]}>" . str_replace("'", '’', $row["word"]) . '</a> ';
	$str  .= " id={$row["id"]}>" . $row["word"] . '</a> ';
	$str2 .= "{$row["word"]} ";
}

$query  .= "($vID, $b, $c, $v, '". addslashes(substr($str,  0, -1)) ."', $para)";
$query2 .= "($vID, $b, $c, $v, '". addslashes(substr($str2, 0, -1)) ."')";

mysql_query($sql_intro1 . $query)  or die(__LINE__ . "<br>" . mysql_error() . "<br>". $sql_intro1 . $query);
mysql_query($sql_intro2 . $query2) or die(__LINE__ . "<br>" . mysql_error() . "<br>". $sql_intro2 . $query2);


?>
done

