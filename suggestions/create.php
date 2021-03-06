<?php

error_reporting(E_ALL);
set_time_limit(9999999);
ini_set("memory_limit","600M");

$min_word_len = 3;
$min_phrase_len = 2;
$do_phase1 = false;
$do_phase2 = false;
$do_phase2_fix = true;
$give_feedback = true;
$min_hits_to_continue = 11;

$phase2_start_at_verse = 3027027;

$upper_limit = 1000;

$language = "en";
$index = "verse_text";

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

$sphinx = new SphinxClient();
$sphinx->SetServer(SPHINX_SERVER, SPHINX_PORT); /// SetServer(sphinx_server_address, sphinx_server_port)

$sphinx->SetLimits(0,$upper_limit);
$sphinx->SetRankingMode(SPH_RANK_NONE); /// No ranking, fastest

/// This is needed for single words because it breaks hyphenated words (currently).
$sphinx->SetMatchMode(SPH_MATCH_EXTENDED); /// Most complex (and slowest?).

$sphinx->SetConnectTimeout(5);

		
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
		///NOTE: The quotes are to keep hyphenated words together.
		$info = get_info('"'. $query . '"');
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
	if ($give_feedback) {
		echo "<div><b>Phase 2</b></div>";
		@ob_flush();flush();
	}
	
	/// First, gather all of the words so that we can create the phrases of different lengths.
	
	$query = "SELECT word, verse FROM $table WHERE word != ''";
	if (isset($phase2_start_at_verse) && $phase2_start_at_verse > 1) {
		if ($give_feedback) {
			echo "<div>Starting at <b>$phase2_start_at_verse</b></div>";
			@ob_flush();flush();
		}	
		$query .= " AND verseID >= $phase2_start_at_verse"; 
	}
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
					continue 3;
				}
				
				/// Does the verse change?  (only verses that don't end in a period, question mark, or exclemation point)
				if ($cur_verse != $verses[$word_num + $j]) {
					continue 3;
				}
				
				/// Does the phrase come to an end?
				///TODO: Determine if other punctuation be looked for like parentheses, semicolon.
				if (strpos($words[$word_num + $j], ".") !== false || strpos($words[$word_num + $j], "?") !== false || strpos($words[$word_num + $j], "!") !== false) {
					/// Is this the last word?
					if ($j == $phrase_length -1) {
						$end_of_entire_phrase = true;
					} else {
						/// This phrase is split.
						continue 3;
					}
				}
				$phrase .= str_replace($punc, "", $words[$word_num + $j]) . " ";
			}
			$phrase = trim($phrase);
			
			/// Check to see if we already got this phrase and if so, should we keep checking for a longer phrase?
			if (($total = get_hits($phrase)) != 0) {
				if ($total < $min_hits_to_continue) {
					$end_of_entire_phrase = true;
				}
				if ($give_feedback) {
					echo "Skipping $phrase<br>";
					@ob_flush();flush();
				}
				continue;
			}
			
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


if ($do_phase2_fix) {
	/// Fix phase 2 (rare two word phrases)

	if ($give_feedback) {
		echo "<div><b>Fix Phase 2</b></div>";
		@ob_flush();flush();
	}

	$query = "SELECT text FROM `$table_suggest` WHERE hits < $min_hits_to_continue AND length(text) - length(replace(text, ' ', '')) = 1";
	$res = mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);
	
	while ($row = mysql_fetch_assoc($res)) {
		$phrase = $row['text'];
		$first_word = substr($phrase, 0, strpos($phrase, ' '));
		
		if (strlen($first_word) < $min_word_len) {
			if ($give_feedback) {
				echo "Skipping $phrase<br>";
				@ob_flush();flush();
			}
			continue;
		}
		//$delete_it = false;
		//die ($first_word);
		
		/// Is the sigle word rare?
		///NOTE: If the result is 0 that means that the word was not found, so we need to find the base form.
		$hits = get_hits($first_word);
		if ($hits >= $min_hits_to_continue) {
			$delete_it = false;
		} elseif ($hits < $min_hits_to_continue && $hits != 0) {
			$delete_it = true;
		} else {
			$info = get_info('"'. $first_word . '"');
			$base_word = choose_common_form($info);
			
			if (strlen($base_word) < $min_word_len) {
				if ($give_feedback) {
					echo "Skipping $phrase<br>";
					@ob_flush();flush();
				}
				continue;
			}
			
			$hits = get_hits($base_word);
			if ($hits == 0) {
				//die ("Could not find the following: $first_word or $base_word from \"$phrase\"");
				echo "Could not find the following: $first_word or $base_word from \"$phrase\"<br>";
			} elseif ($hits < $min_hits_to_continue) {
				$delete_it = true;
			}
		}
		
		if ($delete_it) {
			if ($give_feedback) {
				echo "Deleting $phrase<br>";
				@ob_flush();flush();
			}
			$query = "DELETE FROM $table_suggest WHERE text = \"" . addslashes($phrase) . "\"";
			mysql_query($query) or die(mysql_error() . "<br>$query<br>" . __LINE__);		
		} else {
			if ($give_feedback) {
				echo "Skipping $phrase<br>";
				@ob_flush();flush();
			}
		}
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
	$matches = array();
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
		//echo '<pre>';print_r($sphinx_res);//die;
		if (!isset($sphinx_res['matches'])) break; /// No results found (e.g., if there were exactly 1000 words found last time)
		$matches = array_keys($sphinx_res['matches']);
		if (count($matches) == 0) break;
		$matches_string = implode(',', $matches);
		$start_id = end($matches) + 1;
		
		$text_arr = get_text($matches_string);
		
		find_words_and_hits($cur_words, $text_arr, $word);
		//echo '<pre>';print_r($cur_words);//die;
		
		//$all_matches = array_merge($all_matches, $simple_matches);
	} while (count($matches) == $upper_limit || $loop_again);
	//echo "<pre>";print_r($cur_words);die;
	return $cur_words;
}


function find_words_and_hits(&$cur_words, $text_arr, $word)
{
	global $sphinx, $punc, $index;
	/// This is just a wrapper in case Sphinx messes up.
	do {
		$loop_again = false;
		/// Set a high limit to make sure that all of the words are matched.
		$exerpts = $sphinx->BuildExcerpts($text_arr, $index, $word, array('limit' => 99999, 'exact_phrase' => true));
		/// Did Sphinx mess up?
		if (!is_array($exerpts)) {
			echo "Mistake at line " . __line__ . " ($word)<br>";
			@ob_flush();flush();
			$loop_again = true;
			sleep(2);
			/// Try again.
			continue;
		}
	} while ($loop_again);
	
	/// Debug to find out which verses were found and see the highlights, if any.
	//echo "<pre>";print_r($exerpts);//die;
	
	$found_matches = false;
	foreach ($exerpts as $exerpt) {
		$matches = array();
		preg_match_all("/\<b\>([^<]+)\</", $exerpt, $matches);
		foreach ($matches[1] as $value) {
			$value = str_replace($punc, "", $value);
			if (isset($cur_words[$value])) {
				++$cur_words[$value];
			} else {
				$cur_words[$value] = 1;
				$found_matches = true;
			}
		}
	}
	
	/// A workaround for the Sphinx bug where no matches are found for long phrases.
	if (!$found_matches) force_excerpts($text_arr, $index, $word, $cur_words);
}

function get_text($in)
{
    global $language;
	$query = "SELECT words FROM bible_" . $language . "_verses WHERE id IN ($in)";
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


function force_excerpts($text_arr, $this_index, $phrase, &$cur_words)
{
	global $sphinx, $punc;
	
	$words = explode(" ", $phrase);
	$phrase_count = count($words);
	$exerpt_matches = array();
	$remove = array('<b>', '</b>');
	foreach ($words as $phrase_word_num => $word) {
		do {
			$loop_again = false;
			/// Set a high limit to make sure that all of the words are matched.
			$exerpts = $sphinx->BuildExcerpts($text_arr, $this_index, $word, array('limit' => 99999, 'before_match' => '<b>', 'after_match' => '</b>'));
			/// Did Sphinx mess up?
			if (!is_array($exerpts)) {
				echo "Mistake at line " . __line__ . " ($word)<br>";
				@ob_flush();flush();
				$loop_again = true;
				sleep(2);
				/// Try again.
				continue;
			}
		} while ($loop_again);
		
		//echo "<pre>";print_r($exerpts);//die;
		
		foreach ($exerpts as $exerpt_number => $exerpt) {
			/// Convert a broken hyphenated word into one match.
			$exerpt = str_replace('</b>-<b>', '-', $exerpt);
			//echo "$exerpt<br>";
			$exerpt_words = explode(" ", $exerpt);
			foreach ($exerpt_words as $word_number => $exerpt_word) {
				$exerpt_word = trim($exerpt_word);
				if (strpos($exerpt_word, "<b>") !== false) {
					$exerpt_matches[$exerpt_number][$word_number]['word'] = str_replace($remove, '', $exerpt_word);
					$exerpt_matches[$exerpt_number][$word_number]['numbers'][$phrase_word_num] = "";
					///FIXME: Do this just once, later.
					uksort($exerpt_matches[$exerpt_number], 'correct_ksort');
				}
			}
		}
	}
	//echo "<pre>";print_r($exerpt_matches);//die;
	
	/// Compare the individual matches to find the phrases.
	
	$excerpt_text = array();
	foreach ($exerpt_matches as $exerpt_num => $exerpt_group) {
		$last_word_num = -1;
		$phrase = "";
		$word_count = 0;
		foreach ($exerpt_group as $word_num => $results) {
			/// Is the next word found right next to the last word? (I.e., are they a phrase?)
			/// And is this word the next in the phrase?
			if (($last_word_num != -1 && $word_num == $last_word_num + 1 || $phrase_count == 1) && isset($results['numbers'][$word_count])) {
				$phrase .= " ". $results['word'];
				++$word_count;
				$last_word_num = $word_num;
				/// Did we find the last word in the phrase?
				if ($word_count == $phrase_count) {
					/// This creates a fake highlighted results. (not used currently)
					//if (!isset($excerpt_text[$exerpt_num])) $excerpt_text[$exerpt_num] = "";
					//$excerpt_text[$exerpt_num] .= " <b>" . trim($phrase) . "</b>";
					
					$value = trim(str_replace($punc, "", $phrase));
					if (isset($cur_words[$value])) {
						++$cur_words[$value];
					} else {
						$cur_words[$value] = 1;
					}
				}
			} else {
				/// Reset
				$last_word_num = -1;
				$phrase = "";
				$word_count = 0;
				
				/// Look for the start of the phrase
				if ($last_word_num == -1 && isset($results['numbers'][$word_count])) {
					$last_word_num = $word_num;
					$phrase = $results['word'];
					++$word_count;
				}
			}
		}
	}
	//echo "<pre>";print_r($cur_words);//die;
	//return $excerpt_text;
}


function correct_ksort($a, $b) {
	return $a - $b;
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
