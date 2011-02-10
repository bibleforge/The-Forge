<?php

error_reporting(E_ALL);
set_time_limit(9999999);
// ********************
// delcare variables
// ********************

$table = "bible_original";
///TODO: Rename to `grammar` (or something similar).
$table_into = "morphology";


require_once 'config.php';
$db = mysql_connect(HOST, USER, PASS);
mysql_select_db(BASE, $db);

mysql_query("SET NAMES utf8");
$count = 0;

/// Display a message after this many words.
$reached = 5000;

/// Find the first New Testament word (should be id 305506).
$query = "SELECT id FROM $table WHERE book = 40 ORDER BY id limit 1";
$res = mysql_query($query) or die(mysql_error() . "<br>". $query . "<br>". __LINE__);
$row = mysql_fetch_assoc($res);
$start_id = $row['id'];
/// Load $start_id if avaiable.
$start_file = "morph_start.php";
//@include $start_file; /// Not used now.

/// Check to see if the table needs to be created.
$query = "SHOW TABLES";
$res   = mysql_query($query) or die(mysql_error() . "<br>" . $query);
$has_morph = false;
while ($row = mysql_fetch_row($res)) {
    if ($row[0] == $table_into) {
        $has_morph = true;
    }
}

/// Create tables if needed
if (!$has_morph) {
    echo "<div>Creating `$table_into` table.</div>";
    
    $query = "CREATE TABLE `" . BASE . "`.`" . $table_into . "` (
    `id` mediumint( 8 ) unsigned NOT NULL ,
    `part_of_speech` tinyint( 1 ) unsigned NOT NULL ,
    `declinability` tinyint( 1 ) unsigned NOT NULL ,
    `case_5` tinyint( 3 ) unsigned NOT NULL ,
    `number` tinyint( 3 ) unsigned NOT NULL ,
    `gender` tinyint( 3 ) unsigned NOT NULL ,
    `degree` tinyint( 3 ) unsigned NOT NULL ,
    `tense` tinyint( 1 ) unsigned NOT NULL ,
    `voice` tinyint( 3 ) unsigned NOT NULL ,
    `mood` tinyint( 3 ) unsigned NOT NULL ,
    `person` tinyint( 3 ) unsigned NOT NULL ,
    `middle` tinyint( 3 ) unsigned NOT NULL ,
    `transitivity` tinyint( 3 ) unsigned NOT NULL ,
    `miscellaneous` tinyint( 1 ) unsigned NOT NULL ,
    `noun_type` tinyint( 3 ) unsigned NOT NULL ,
    `numerical` tinyint( 1 ) unsigned NOT NULL ,
    `form` tinyint( 1 ) unsigned NOT NULL ,
    `dialect` tinyint( 1 ) unsigned NOT NULL ,
    `type` tinyint( 1 ) unsigned NOT NULL ,
    `pronoun_type` tinyint( 2 ) unsigned NOT NULL ,
    PRIMARY KEY ( `id` )
    ) ENGINE = MYISAM DEFAULT CHARSET = latin1;";
    mysql_query($query) or die(mysql_error() . "<br>" . $query);
}

$query = "REPLACE INTO $table_into SET id = 0";
mysql_query($query) or die(mysql_error() . "<br>". $query . "<br>". __LINE__);

$query = "SELECT id, morph FROM $table WHERE id >= $start_id";

$mysql_res = mysql_query($query) or die(mysql_error() . "<br>". $query . "<br>". __LINE__);
while ($row = mysql_fetch_assoc($mysql_res)) {
	$q = "";
	if (substr($row["morph"], 0, 3) == "ADV") {
		$q .= " part_of_speech = 4 ";
		preg_match("/^...-(.*)/", $row["morph"], $matches);
		$q .= suffixes($matches, substr($row["morph"], 0, 3));
	} elseif (substr($row["morph"], 0, 4) == "CONJ") {
		//$q .= " part_of_speech = 16 ";
		$q .= " part_of_speech = 7 ";
	} elseif (substr($row["morph"], 0, 4) == "COND") {
		//$q .= " part_of_speech = 17 ";
		$q .= " part_of_speech = 8 ";
		preg_match("/^....-(.*)/", $row["morph"], $matches);
		$q .= suffixes($matches, substr($row["morph"], 0, 4));
	} elseif (substr($row["morph"], 0, 3) == "PRT") {
		//$q .= " part_of_speech = 18 ";
		$q .= " part_of_speech = 9 ";
		preg_match("/^...-(.*)/", $row["morph"], $matches);
		$q .= suffixes($matches, substr($row["morph"], 0, 3));
	} elseif (substr($row["morph"], 0, 4) == "PREP") {
		//$q .= " part_of_speech = 19 ";
		$q .= " part_of_speech = 10 ";
	} elseif (substr($row["morph"], 0, 3) == "INJ") {
		//$q .= " part_of_speech = 20 ";
		$q .= " part_of_speech = 11 ";
	} elseif (substr($row["morph"], 0, 3) == "HEB") {
		//$q .= " part_of_speech = 21 ";
		$q .= " part_of_speech = 12 ";
	} elseif (substr($row["morph"], 0, 4) == "ARAM") {
		//$q .= " part_of_speech = 22 ";
		$q .= " part_of_speech = 13 ";
	} elseif (substr($row["morph"], 0, 5) == "N-PRI") {
		$q .= " part_of_speech = 1 ";
		$q .= ", declinability = 1 ";
		$q .= ", noun_type = 2 ";
	} elseif (substr($row["morph"], 0, 5) == "A-NUI") {
		$q .= " part_of_speech = 3 ";
		$q .= ", declinability = 1 ";
		$q .= ", numerical = 1 ";
		preg_match("/^.-...-(.*)/", $row["morph"], $matches);
		$q .= suffixes($matches, substr($row["morph"], 0, 1));
	} elseif (substr($row["morph"], 0, 4) == "N-LI") {
		$q .= " part_of_speech = 1 ";
		$q .= ", declinability = 1 ";
		$q .= ", noun_type = 3 ";
	} elseif (substr($row["morph"], 0, 4) == "N-OI") {
		$q .= " part_of_speech = 1 ";
		$q .= ", declinability = 1 ";
		$q .= ", noun_type = 4 ";
	} elseif (substr($row["morph"], 0, 2) == "N-") {
		$q .= " part_of_speech = 1 ";
		$q .= ", noun_type = 1 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {
			stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);
		} else {
			$q .= $res;
		}
	} elseif (substr($row["morph"], 0, 2) == "V-") {
		$q .= " part_of_speech = 2 ";
		$q .= handle_verbs($row['morph'], $row['id']);
	} elseif (substr($row["morph"], 0, 2) == "A-") {
		$q .= " part_of_speech = 3 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "R-") {
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 2 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "C-") {
		//$q .= " part_of_speech = 6 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 3 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "D-") {
		//$q .= " part_of_speech = 7 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 4 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "T-") {
		//$q .= " part_of_speech = 8 ";
		$q .= " part_of_speech = 6 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "K-") {
		//$q .= " part_of_speech = 9 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 5 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "I-") {
		//$q .= " part_of_speech = 10 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 6 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "X-") {
		//$q .= " part_of_speech = 11 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 7 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "Q-") {
		//$q .= " part_of_speech = 12 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 10 ";
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);} else {$q .= $res;}
	} elseif (substr($row["morph"], 0, 2) == "F-") {
		//$q .= " part_of_speech = 13 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 8 ";
		$q .= ", person = " . substr($row['morph'], 2, 1);
		$res = cngs(substr($row["morph"], 0, 2) . substr($row['morph'], 3), substr($row["morph"], 0, 1));
		if ($res === false) {
			stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);
		} else {
			$q .= $res;
		}
	} elseif (substr($row["morph"], 0, 2) == "S-") {
		//$q .= " part_of_speech = 14 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 9 ";
		$q .= ", person = " . substr($row['morph'], 2, 1);
		$res = cngs(substr($row["morph"], 0, 2) . substr($row['morph'], 3), substr($row["morph"], 0, 1));
		if ($res === false) {
			stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);
		} else {
			$q .= $res;
		}
	} elseif (substr($row["morph"], 0, 2) == "P-") {
		//$q .= " part_of_speech = 15 ";
		$q .= " part_of_speech = 5 ";
		$q .= ", pronoun_type = 1 ";
		$tmp = substr($row["morph"], 2, 1);
		if ($tmp == "1" || $tmp == "2" || $tmp == "3") {
			$q .= ", person = $tmp";
			$row['morph'] = substr($row['morph'], 0, 2) . substr($row['morph'], 3) . "    "; /// padding is to make sure that the next substr won't have an error
			$row['morph'] = substr($row['morph'], 0, 4) . "_" . trim(substr($row['morph'], 4));
		}
		$res = cngs($row['morph'], substr($row["morph"], 0, 1));
		if ($res === false) {
			stopit($row['id'], "<br>Bad cng<div>{$row['id']}: {$row['morph']}: $q</div>", __LINE__);
		} else {
			$q .= $res;
		}
	} else {
		stopit($row['id'], 'Else what?', __LINE__);
	}
	
	$query = "REPLACE INTO $table_into SET id = {$row['id']},  $q";
	mysql_query($query) or die(mysql_error() . "<br>". $query . "<br>". __LINE__ . "<div>{$row['id']}: {$row['morph']}: $q</div>");
	if (++$count == $reached) {
		$count = 0;
		echo "<div>{$row['id']}: {$row['morph']}: $q</div>";
		flush();@ob_flush();
	}
}

function stopit($id, $text, $line = __LINE__)
{
    /// This is not used currently (it was just mainly used while creating the script).
    return;
    
    global $start_file;
    
	file_put_contents($start_file, "<?php \$start_id = $id;");
	echo "<div>$text ID: $id Line: $line</div>"; 
	die();
}

/// $morph = ?-CNG-S
function cngs($morph, $type)
{
	$q = "";
	preg_match("/^.-([A-Z])([A-Z])([A-Z_])/", $morph, $matches);
	if (count($matches) == 0) {
		return false;
	}
	
	if ($matches[1] == 'N') {
		$q .= ", `case_5` = 1 ";
	} elseif ($matches[1] == 'G') {
		$q .= ", `case_5` = 2 ";
	} elseif ($matches[1] == 'A') {
		$q .= ", `case_5` = 3 ";
	} elseif ($matches[1] == 'D') {
		$q .= ", `case_5` = 4 ";
	} elseif ($matches[1] == 'V') {
		$q .= ", `case_5` = 5 ";
	} else {
		return false;
	}
	
	if ($matches[2] == 'S') {
		$q .= ", number = 1 ";
	} elseif ($matches[2] == 'P') {
		$q .= ", number = 2 ";
	} else {
		return false;
	}
	
	if ($matches[3] == 'M') {
		$q .= ", gender = 1 ";
	} elseif ($matches[3] == 'F') {
		$q .= ", gender = 2 ";
	} elseif ($matches[3] == 'N') {
		$q .= ", gender = 3 ";
	} elseif ($matches[3] == '_') {
		/// Ignore this (see the "P" section above.)
	} else {
		return false;
	}
	
	preg_match("/^.-...-(.*)/", $morph, $matches);
	$q .= suffixes($matches, $type);
	
	return $q;
}


function suffixes($matches, $type)
{
	if (count($matches) == 0) return "";
	$q = "";
	if ($matches[1] == "C" && ($type == "A" || $type == "ADV")) {
		$q .= ", degree = 1 ";
	} elseif ($matches[1] == "S") {
		$q .= ", degree = 2 ";
	}
	
	if ($matches[1] == "ABB") { /// Abbreviated
		$q .= ", type = 1 ";
	} elseif ($matches[1] == "I") { /// Interrogative
		$q .= ", `miscellaneous` = 1 ";
	} elseif ($matches[1] == "N") { /// Negative
		$q .= ", `miscellaneous` = 2 ";
	} elseif ($matches[1] == "C" && $type != "A" && $type != "ADV") { /// Contracted
		$q .= ", `type` = 2 ";
	} elseif ($matches[1] == "ATT") { /// Attic
		$q .= ", dialect = 1 ";
	} elseif ($matches[1] == "P") { /// Particle
		$q .= ", `miscellaneous` = 3";
	}
	
	return $q;
}


function handle_verbs($morph, $id)
{
	$q = "";
	preg_match("/^V-(2?[A-Z])([A-Z])([A-Z])/", $morph, $matches);
	
	if ($matches[1] == "P") {
		$q .= ", tense = 1 ";
	} elseif ($matches[1] == "I") {
		$q .= ", tense = 2 ";
	} elseif ($matches[1] == "F") {
		$q .= ", tense = 3 ";
		$q .= ", `form` = 1 ";
	} elseif ($matches[1] == "2F") {
		$q .= ", tense = 3 ";
		$q .= ", `form` = 2 ";
	} elseif ($matches[1] == "A") {
		$q .= ", tense = 4 ";
		$q .= ", `form` = 1 ";
	} elseif ($matches[1] == "2A") {
		$q .= ", tense = 4 ";
		$q .= ", `form` = 2 ";
	} elseif ($matches[1] == "R") {
		$q .= ", tense = 5 ";
		$q .= ", `form` = 1 ";
	} elseif ($matches[1] == "2R") {
		$q .= ", tense = 5 ";
		$q .= ", `form` = 2 ";
	} elseif ($matches[1] == "L") {
		$q .= ", tense = 6 ";
		$q .= ", `form` = 1 ";
	} elseif ($matches[1] == "2L") {
		$q .= ", tense = 6 ";
		$q .= ", `form` = 2 ";
	} elseif ($matches[1] == "X") {
		$q .= ", tense = 99 "; /// What should unknown be
	}
	
	
	if ($matches[2] == "A") {
		$q .= ", voice = 1 ";
	} elseif ($matches[2] == "M") {
		$q .= ", voice = 2 ";
	} elseif ($matches[2] == "P") {
		$q .= ", voice = 3 ";
	} elseif ($matches[2] == "D") {
		$q .= ", voice = 4 ";
	} elseif ($matches[2] == "O") {
		$q .= ", voice = 5 ";
	} elseif ($matches[2] == "Q") {
		$q .= ", voice = 6 ";
	} elseif ($matches[2] == "E") {
		$q .= ", voice = 77 "; /// We need to figure it out
	} elseif ($matches[2] == "N") {
		$q .= ", voice = 88 "; /// We need to figure it out
	} elseif ($matches[2] == "X") {
		$q .= ", voice = 99 ";
	}
	
	
	if ($matches[3] == "I") {
		$q .= ", mood = 1 ";
	} elseif ($matches[3] == "S") {
		$q .= ", mood = 2 ";
	} elseif ($matches[3] == "M") {
		$q .= ", mood = 3 ";
	} elseif ($matches[3] == "N") {
		$q .= ", mood = 4 ";
	} elseif ($matches[3] == "O") {
		$q .= ", mood = 5 ";
	} elseif ($matches[3] == "P") {
		$q .= ", mood = 6 ";
	} elseif ($matches[3] == "R") {
		$q .= ", mood = 7 ";
	}
	
	
	preg_match("/^V-2?...-([123])([SP])/", $morph, $matches);
	if (count($matches) > 0) {
		$q .= ", person = " . $matches[1];
		if ($matches[2] == "S") {
			$q .= ", number = 1 ";
		} elseif ($matches[2] == "P") {
			$q .= ", number = 2 ";
		}
	}
	
	preg_match("/^V-2?...-([NGDVA])([SP])([MFN])/", $morph, $matches);
	if (count($matches) > 0) {
		if ($matches[1] == 'N') {
			$q .= ", `case_5` = 1 ";
		} elseif ($matches[1] == 'G') {
			$q .= ", `case_5` = 2 ";
		} elseif ($matches[1] == 'A') {
			$q .= ", `case_5` = 3 ";
		} elseif ($matches[1] == 'D') {
			$q .= ", `case_5` = 4 ";
		} elseif ($matches[1] == 'V') {
			$q .= ", `case_5` = 5 ";
		}
		
		if ($matches[2] == 'S') {
			$q .= ", number = 1 ";
		} elseif ($matches[2] == 'P') {
			$q .= ", number = 2 ";
		}
		
		if ($matches[3] == 'M') {
			$q .= ", gender = 1 ";
		} elseif ($matches[3] == 'F') {
			$q .= ", gender = 2 ";
		} elseif ($matches[3] == 'N') {
			$q .= ", gender = 3 ";
		}
	}
	
	preg_match("/-(M|C|T|A|ATT|AP|IRR)$/", $morph, $matches);
	if (count($matches) > 0) {
		if ($matches[1] == 'M') {
			$q .= ", `miscellaneous` = 4 ";
		} elseif ($matches[1] == 'C') {
			$q .= ", `type` = 2 ";
		} elseif ($matches[1] == 'T') {
			$q .= ", `transitivity` = 1 ";
		} elseif ($matches[1] == 'ATT') {
			$q .= ", dialect = 1 ";
		} elseif ($matches[1] == 'A') {
			$q .= ", dialect = 2 ";
		} elseif ($matches[1] == 'AP') {
			$q .= ", `type` = 3 ";
		} elseif ($matches[1] == 'IRR') {
			$q .= ", `type` = 4 ";
		}
	}
	return $q;
}

echo "<br><div>Finished populting `$table_into`.</div>";
echo "<div>Double checking...</div>";

@ob_flush();flush();

include "testers/check_grammar_parsing.php";

run_double_checker();