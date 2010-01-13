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
require_once "../../dev/functions/sphinxapi.php";

define('SPHINX_SERVER', '127.0.0.1');
define('SPHINX_PORT', 9312);
$upper_limit = 1000;

$sphinx = new SphinxClient();
$sphinx->SetServer(SPHINX_SERVER, SPHINX_PORT); /// SetServer(sphinx_server_address, sphinx_server_port)

$sphinx->SetLimits(0,$upper_limit);
$sphinx->SetRankingMode(SPH_RANK_NONE); /// No ranking, fastest

$query = "SELECT DISTINCT word FROM $table WHERE word != ''";
$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);

$words = array();
$punc = array(",",".","?","!",";",":",")","(");

//$exerpts = $sphinx->BuildExcerpts(array('God created the heaven and the earth', 'Lets create stuff more more more more more more more more.'), "verse_text", "created", array());
//echo "<pre>";print_r($exerpts);die;

while ($row = mysql_fetch_assoc($res)) {
	$words[str_replace($punc, "", $row['word'])] = "";
}
//echo "<pre>";print_r($words);
$i = 0;

foreach ($words as $query => $empty) {
	if (get_hits($query) != 0) {
		echo "Skipping $query<br>";
		@ob_flush();flush();
		continue;
	}
	$info = get_info($query);
	$base_word = choose_common_form($info);
	/// Recheck to see if the base word was added already.
	if (get_hits($base_word) != 0) {
		echo "Skipping $query<br>";
		@ob_flush();flush();
		continue;
	}
	$total = array_sum($info);
	
	$query = "INSERT INTO $table_suggest VALUES (\"" . addslashes($base_word) . "\", $total)";
	mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
	
	echo "$base_word: $total<br>";
	@ob_flush();flush();
}

die("<b>done!");

function get_info($word)
{
	global $sphinx, $upper_limit;
	
	$start_id = 0;
	//$all_matches = array();
	$cur_words = array();
	do {
		$sphinx->SetIDRange($start_id, 99999999); /// SetIDRange(start_id, stop_id (0 means no limit))
		$sphinx_res = $sphinx->Query($word, 'verse_text');
		
		/// Did Sphinx mess up?
		if (!is_array($sphinx_res)) {
			echo "Mistake at line " . __line__ . " ($word)<br>";
			@ob_flush();flush();
			sleep(2);
			/// Try again.
			continue;
		}
		
		$matches = array_keys($sphinx_res['matches']);
		if (count($matches) == 0) break;
		$matches_string = implode(',', $matches);
		$start_id = end($matches) + 1;
		
		$text_arr = get_text($matches_string);
		
		find_words_and_hits($cur_words, $text_arr, $word);
		//$all_matches = array_merge($all_matches, $simple_matches);
	} while (count($matches) == $upper_limit);
	//echo "<pre>";print_r($cur_words);die;
	//echo '<pre>';print_r($sphinx_res);die;
	return $cur_words;
}


function find_words_and_hits(&$cur_words, $text_arr, $word)
{
	global $sphinx, $punc;
	/// This is just a wrapper in case Sphinx messes up.
	do {
		/// Set a high limit to make sure that all of the words are matched.
		$exerpts = $sphinx->BuildExcerpts($text_arr, "verse_text", $word, array('limit' => 99999));
		/// Did Sphinx mess up?
		if (!is_array($exerpts)) {
			echo "Mistake at line " . __line__ . " ($word)<br>";
			@ob_flush();flush();
			sleep(2);
			/// Try again.
			continue;
		}
	} while (false);
	
	//echo "<pre>";print_r($exerpts);die;
	foreach ($exerpts as $exerpt) {
		$matches = array();
		preg_match_all("/\<b\>([^<]+)\</", $exerpt, $matches);
		foreach ($matches[1] as $value) {
			$value = str_replace($punc, "", $value);
			if (isset($cur_words[$value])) {
				++$cur_words[$value];
			} else {
				$cur_words[$value] = 1;
			}
		}
	}
}

function get_text($in)
{
	$query = "SELECT words FROM bible_english_verses WHERE id IN ($in)";
	$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
	$array = array();
	while ($row = mysql_fetch_assoc($res)) {
		$array[] = $row['words'];
	}
	return $array;
}
function get_hits($text)
{
	global $table_suggest;
	$query = "SELECT hits FROM $table_suggest WHERE text = \"" . addslashes($text) . "\"";
	$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
	if (mysql_num_rows($res) == 0) return 0;
	$row = mysql_fetch_assoc($res);
	return $row['hits'];
}

function choose_common_form($info)
{
	arsort($info);
	$first_time = true;
	foreach ($info as $word => $hits) {
		if ($first_time) {
			/// If the most common word is lowercase, then that is the one to use.
			if ($word == strtolower($word)) return $word;
			$first_time = false;
			$first_word = $word;
		} else {
			/// Check to see if the word is ever found in the lower case (if not, it is probably a proper noun.)
			if ($word == strtolower($word)) return $word;
		}
	}
	return $first_word;
}