<?php

error_reporting(E_ALL);
set_time_limit(9999999);

$min_word_len = 3;
$min_phrase_len = 2;
$do_phase1 = false;
$do_phase2 = true;
$give_feedback = true;
$min_hits_to_continue = 11;

$language = "english";

$table = "bible_" . $language;
$table_suggest = "suggestions_" . $language;

$db = mysql_connect("localhost", "XXXXXXXXX", "XXXXXXXXXXXXXX");
mysql_select_db("bf", $db);

/// Uncomment for other languages.
//mysql_query("SET NAMES utf8");

$punc = array(",",".","?","!",";",":",")","(");

/// Configure Sphinx
require_once "../../dev/functions/sphinxapi.php";

define('SPHINX_SERVER', '127.0.0.1');
define('SPHINX_PORT', 9312);
$upper_limit = 1000;

$sphinx = new SphinxClient();
$sphinx->SetServer(SPHINX_SERVER, SPHINX_PORT); /// SetServer(sphinx_server_address, sphinx_server_port)

$sphinx->SetLimits(0,$upper_limit);
$sphinx->SetRankingMode(SPH_RANK_NONE); /// No ranking, fastest


/// Phase 1 (single words)
if ($do_phase1) {
	if ($give_feedback) {
		echo "<b>Phase 1</b><br>";
		@ob_flush();flush();
	}
	$query = "SELECT DISTINCT word FROM $table WHERE word != ''";
	$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
	
	$words = array();
	while ($row = mysql_fetch_assoc($res)) {
		$words[str_replace($punc, "", $row['word'])] = "";
	}
	//echo "<pre>";print_r($words);
	
	foreach ($words as $query => $empty) {
		if (strlen($query) < $min_word_len || get_hits($query) != 0) {
			if ($give_feedback) {
				echo "Skipping $query<br>";
				@ob_flush();flush();
			}
			continue;
		}
		
		/// List all of the different forms of the word and how many times each occurs.
		$info = get_info($query);
		$base_word = choose_common_form($info);
		
		if ($base_word == "") {
			die("<b>Error: $query == blank? (line: " . __LINE__ . ")");
		}
		
		/// Recheck to see if the base word was added already.
		if (strlen($base_word) < $min_word_len || get_hits($base_word) != 0) {
			if ($give_feedback) {
				echo "Skipping $query<br>";
				@ob_flush();flush();
			}
			continue;
		}
		$total = array_sum($info);
		
		$query = "INSERT INTO $table_suggest VALUES (\"" . addslashes($base_word) . "\", $total)";
		mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
		
		if ($give_feedback) {
			echo "$base_word: $total<br>";
			@ob_flush();flush();
		}
	}
}

/// Phase 2 (multiple words)
if ($do_phase2) {
	$sphinx->SetMatchMode(SPH_MATCH_EXTENDED); /// Most complex (and slowest?).
	if ($give_feedback) {
		echo "<b>Phase 2</b><br>";
		@ob_flush();flush();
	}
	
	/// First, gather all of the words so that we can create the phrases of different lengths.
	
	$query = "SELECT word, verse FROM $table WHERE word != ''";
	$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);

	$words = array();
	$verses = array();
	while ($row = mysql_fetch_assoc($res)) {
		//$words[] = str_replace($punc, "", $row['word']);
		$words[] = $row['word'];
		$verses[] = $row['verse'];
	}
	
	$word_count = count($words);
	
	for ($word_num = 0; $word_num < $word_count - $min_phrase_len + 1; ++$word_num) {
		$phrase_length = $min_phrase_len - 1;
		$end_of_entire_phrase = false;
		
		do {
			++$phrase_length;
			/// Create the phrase
			$phrase = "";
			$cur_verse = $verses[$word_num];
			for ($j = 0; $j < $phrase_length; ++$j) {
				/// The end has been found!
				if (!isset($verses[$word_num + $j])) {
					continue 2;
				}
				
				/// Does the verse change?
				if ($cur_verse != $verses[$word_num + $j]) {
					continue 2;
				}
				
				/// Does the phrase come to an end?
				///TODO: Determine if other punctuation be looked for like parentheses.
				if (strpos($words[$word_num + $j], ".") !== false || strpos($words[$word_num + $j], "?") !== false || strpos($words[$word_num + $j], "!") !== false) {
					/// Is this the last word?
					if ($j == $phrase_length -1) {
						$end_of_entire_phrase = true;
					} else {
						/// This phrase is split.
						continue 2;
					}
				}
				$phrase .= str_replace($punc, "", $words[$word_num + $j]) . " ";
			}
			$phrase = trim($phrase);
			
			/*
			if (get_hits($phrase) != 0) {
				if ($give_feedback) {
					echo "Skipping $phrase<br>";
					@ob_flush();flush();
				}
				continue;
			}
			*/
			/// We must get info about the phrase so that we know if we need to abandon the phrase because it is too rare.
			$info = get_info('"' . $phrase . '"');
			
			$total = array_sum($info);
			
			/// The phrase is now quite rare, so no more suggestions are needed because the actual verse should be found.
			if ($total < $min_hits_to_continue) {
				$end_of_entire_phrase = true;
			}
			
			$base_phrase = choose_common_form($info);
			
			if ($base_phrase == "") {
				die("<b>Error: $phrase == blank? (line: " . __LINE__ . ")");
			}
			
			/// Recheck to see if the base word was added already.
			if (get_hits($base_phrase) != 0) {
				if ($give_feedback) {
					echo "Skipping $phrase<br>";
					@ob_flush();flush();
				}
				continue;
			}
			
			$query = "INSERT INTO $table_suggest VALUES (\"" . addslashes($base_phrase) . "\", $total)";
			mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
			
			if ($give_feedback) {
				echo "$base_phrase: $total<br>";
				@ob_flush();flush();
			}
			
		} while (!$end_of_entire_phrase);
	}
}


/// If there are any manual commands, run them.
if (file_exists('manual_' . $language . '.php')) include 'manual_' . $language . '.php';

die("<b>done!");




function get_info($word)
{
	global $sphinx, $upper_limit;
	
	$start_id = 0;
	//$all_matches = array();
	$cur_words = array();
	do {
		$loop_again = false;
		$sphinx->SetIDRange($start_id, 99999999); /// SetIDRange(start_id, stop_id (0 means no limit))
		$sphinx_res = $sphinx->Query($word, 'verse_text');
		
		/// Did Sphinx mess up?
		if (!is_array($sphinx_res)) {
			echo "Mistake at line " . __line__ . " ($word)<br>";
			@ob_flush();flush();
			$loop_again = true;
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
	} while (count($matches) == $upper_limit || $loop_again);
	//echo "<pre>";print_r($cur_words);die;
	//echo '<pre>';print_r($sphinx_res);die;
	return $cur_words;
}


function find_words_and_hits(&$cur_words, $text_arr, $word)
{
	global $sphinx, $punc;
	/// This is just a wrapper in case Sphinx messes up.
	do {
		$loop_again = false;
		/// Set a high limit to make sure that all of the words are matched.
		$exerpts = $sphinx->BuildExcerpts($text_arr, "verse_text", $word, array('limit' => 99999, 'exact_phrase' => true));
		/// Did Sphinx mess up?
		if (!is_array($exerpts)) {
			echo "Mistake at line " . __line__ . " ($word)<br>";
			@ob_flush();flush();
			$loop_again = true;
			sleep(2);
			/// Try again.
			continue;
		}
	} while (false || $loop_again);
	
	echo "<pre>";print_r($exerpts);//die;
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
	if (!isset($first_word)) return false;
	return $first_word;
}


/*******************************
 * Language specific functions *
 *******************************/


function change_words($change_words)
{
	global $table_suggest;
	foreach ($change_words as $old => $new) {
		if (get_hits($new) != 0) {
			echo "Skipping $new<br>";
			@ob_flush();flush();
			continue;
		}
		$query = "UPDATE $table_suggest SET text = \"" . addslashes($new) . "\" WHERE text = \"" . addslashes($old) . "\"";
		mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
		echo "Changed $old to $new<br>";
		@ob_flush();flush();
	}
}
 
function add_proper_nouns($proper_nouns)
{
	global $table_suggest;
	foreach ($proper_nouns as $common => $proper) {
		if (get_hits($proper) != 0) {
			echo "Skipping $proper<br>";
			@ob_flush();flush();
			continue;
		}
		$query = "SELECT hits FROM $table_suggest WHERE text = \"" . addslashes($common) . "\"";
		$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
		$row = mysql_fetch_assoc($res);
		$query = "INSERT INTO $table_suggest VALUES (\"" . addslashes($proper) . "\", {$row['hits']})";
		mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
		echo "Added proper noun $proper from $common: {$row['hits']}<br>";
		@ob_flush();flush();
	}
}