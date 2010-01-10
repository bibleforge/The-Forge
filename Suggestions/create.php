<?php

error_reporting(E_ALL);
set_time_limit(9999999);

$table = "bible_english";

$db = mysql_connect("localhost", "XXXXXXXXX", "XXXXXXXXXXXXXX");
mysql_select_db("bf", $db);

/// Uncomment for other languages.
//mysql_query("SET NAMES utf8");


$query = "SELECT DISTINCT word FROM $table WHERE word != ''";
$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);

$words = array();
$punc = array(",",".","?","!",";",":",")","(");

while ($row = mysql_fetch_assoc($res)) {
	$words[str_replace($punc, "", $row['word'])] = "";
}
echo "<pre>";print_r($words);