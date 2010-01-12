<?php

error_reporting(E_ALL);
set_time_limit(9999999);

$table = "bible_english";
$table_suggest = "suggestions_english";

$db = mysql_connect("localhost", "XXXXXXXXX", "XXXXXXXXXXXXXX");
mysql_select_db("bf", $db);

/// Uncomment for other languages.
//mysql_query("SET NAMES utf8");


/// Configure Sphinx
require_once "../../dev/functions/sphinxapi_cli.php";

define('SPHINX_SERVER', 'C:\srv\www\bf\win-sphinx\search.exe');
define('SPHINX_PORT', 'C:\srv\www\bf\win-sphinx\sphinx_bf.conf');

$sphinx = new SphinxClient();
$sphinx->SetServer(SPHINX_SERVER, SPHINX_PORT); /// SetServer(sphinx_server_address, sphinx_server_port)

$sphinx->SetLimits(0,0);
$sphinx->SetRankingMode(SPH_RANK_NONE); /// No ranking, fastest

$query = "SELECT word FROM $table WHERE word != ''";
$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);

$words = array();
$punc = array(",",".","?","!",";",":",")","(");


while ($row = mysql_fetch_assoc($res)) {
	$this_word = str_replace($punc, "", $row['word']);
	if (isset($words[$this_word])) {
		++$words[$this_word];
	} else {
		$words[$this_word] = 1;
	}
}
echo "<pre>";print_r($words);
$i = 0;

foreach ($words as $query => $hits) {
	$alternate_hits = get_hits($query);
	if ($hits > $alternate_hits) {
		$sphinx_res = $sphinx->Query($query, 'verse_text');
		echo '<pre>';print_r($sphinx_res);
		if ($i++ == 4) die;
	}
}

function get_hits($text)
{
	global $table_suggest;
	$query = "SELECT hits FROM $table_suggest WHERE text = \"" . addslashes($query) . "\"";
	$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
	if (mysql_num_rows($res) == 0) return 0;
	$row = mysql_fetch_assoc($res);
	return $row['hits'];
}