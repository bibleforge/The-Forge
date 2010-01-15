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
$upper_limit = 1000;

$sphinx = new SphinxClient();
$sphinx->SetServer(SPHINX_SERVER, SPHINX_PORT); /// SetServer(sphinx_server_address, sphinx_server_port)

$sphinx->SetLimits(0,$upper_limit);
$sphinx->SetRankingMode(SPH_RANK_NONE); /// No ranking, fastest


$t = Array
(
    0 => "In the beginning God created the heaven and the earth.",
    1 => "The heaven and the Thus the heavens and the earth were finished, and all the host of them.",
    2 => "Behold, the heaven and the heaven of heavens is the LORD's thy God, the earth also, with all that therein is.",
    3 => "And Absalom met the servants of David. And Absalom rode upon a mule, and the mule went under the thick boughs of a great oak, and his head caught hold of the oak, and he was taken up between the heaven and the earth; and the mule that was under him went away.",
    4 => "The LORD also thundered in the heavens, and the Highest gave his voice; hail stones and coals of fire.",
    5 => "Therefore I will shake the heavens, and the earth shall remove out of her place, in the wrath of the LORD of hosts, and in the day of his fierce anger.",
    6 => "For the mountains will I take up a weeping and wailing, and for the habitations of the wilderness a lamentation, because they are burned up, so that none can pass through them; neither can men hear the voice of the cattle; both the fowl of the heavens and the beast are fled; they are gone.",
    7 => "Thus shall ye say unto them, The gods that have not made the heavens and the earth, even they shall perish from the earth, and from under these heavens.",
    8 => "And I will appoint over them four kinds, saith the LORD: the sword to slay, and the dogs to tear, and the fowls of the heaven, and the beasts of the earth, to devour and destroy.",
    9 => "Ah Lord GOD! behold, thou hast made the heaven and the earth by thy great power and stretched out arm, and there is nothing too hard for thee:",
    10 => "Then the heaven and the earth, and all that is therein, shall sing for Babylon: for the spoilers shall come unto her from the north, saith the LORD.",
    11 => "So that the fishes of the sea, and the fowls of the heaven, and the beasts of the field, and all creeping things that creep upon the earth, and all the men that are upon the face of the earth, shall shake at my presence, and the mountains shall be thrown down, and the steep places shall fall, and every wall shall fall to the ground.",
    12 => "The tree that thou sawest, which grew, and was strong, whose height reached unto the heaven, and the sight thereof to all the earth;",
    13 => "The LORD also shall roar out of Zion, and utter his voice from Jerusalem; and the heavens and the earth shall shake: but the LORD will be the hope of his people, and the strength of the children of Israel.",
    14 => "God came from Teman, and the Holy One from mount Paran. Selah. His glory covered the heavens, and the earth was full of his praise.",
    15 => "I will consume man and beast; I will consume the fowls of the heaven, and the fishes of the sea, and the stumblingblocks with the wicked; and I will cut off man from off the land, saith the LORD.",
    16 => "For thus saith the LORD of hosts; Yet once, it is a little while, and I will shake the heavens, and the earth, and the sea, and the dry land;",
    17 => "Speak to Zerubbabel, governor of Judah, saying, I will shake the heavens and the earth;",
    18 => "But the heavens and the earth, which are now, by the same word are kept in store, reserved unto fire against the day of judgment and perdition of ungodly men."
);

$exerpts = force_excerpts($t, $index, "the heaven and the");

echo "<pre>";print_r($exerpts);die;

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
	
	if (count($cur_words) == 0) $cur_words = force_excerpts($text_arr, $index, $word)
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


function force_excerpts($text_arr, $this_index, $phrase)
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
		
		foreach ($exerpts as $exerpt_number => $exerpt) {
			$exerpt_words = explode(" ", $exerpt);
			foreach ($exerpt_words as $word_number => $exerpt_word) {
				$exerpt_word = trim($exerpt_word);
				if (substr($exerpt_word, 0, 3) == "<b>") {
					$exerpt_matches[$exerpt_number][$word_number]['word'] = str_replace($remove, '', $exerpt_word);
					$exerpt_matches[$exerpt_number][$word_number]['numbers'][$phrase_word_num] = "";
					///FIXME: Do this just once, later.
					uksort($exerpt_matches[$exerpt_number], 'correct_ksort');
				}
			}
		}
	}
	
	//echo "<pre>";print_r($exerpt_matches);die;
	
	/// Compare the individual matches to find the phrases.
	
	$excerpt_text = array();
	foreach ($exerpt_matches as $exerpt_num => $exerpt_group) {
		$last_word_num = -1;
		$phrase = "";
		$word_count = 0;
		foreach ($exerpt_group as $word_num => $results) {
			/// Is the next word found right next to the last word? (I.e., are they a phrase?)
			/// And is this word the next in the phrase?
			if ($last_word_num != -1 && $word_num == $last_word_num + 1 && isset($results['numbers'][$word_count])) {
				$phrase .= " ". $results['word'];
				++$word_count;
				$last_word_num = $word_num;
				/// Did we find the last word in the phrase?
				if ($word_count == $phrase_count) {
					/// This creates a fake highlighted results. (not used currently)
					//if (!isset($excerpt_text[$exerpt_num])) $excerpt_text[$exerpt_num] = "";
					//$excerpt_text[$exerpt_num] .= " <b>" . trim($phrase) . "</b>";
					
					$value = str_replace($punc, "", $phrase);
					if (isset($excerpt_text[$value])) {
						++$excerpt_text[$value];
					} else {
						$excerpt_text[$value] = 1;
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
	echo "<pre>";print_r($excerpt_text);die;
	return $excerpt_text;
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