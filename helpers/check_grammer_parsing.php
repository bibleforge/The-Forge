<?php

error_reporting(E_ALL);
set_time_limit(9999999);
// ********************
// delcare variables
// ********************


function rev_morph($row)
{
    $morph = "";
    if ($row['part_of_speech'] == 1) {
        if ($row['declinability'] == 1) {
            if ($row['noun_type'] == 2) {
                $morph .= "N-PRI";
            } elseif ($row['noun_type'] == 3) {
                $morph .= "N-LI";
            } elseif ($row['noun_type'] == 4) {
                $morph .= "N-OI";
            }
        } else {
            $morph .= "N";
        }
    } elseif ($row['part_of_speech'] == 2) {
        $morph .= "V";
    } elseif ($row['part_of_speech'] == 3) {
        if ($row['declinability'] == 1) {
            $morph .= "A-NUI";
        } else {
            $morph .= "A";
        }
    } elseif ($row['part_of_speech'] == 4) {
        $morph .= "ADV";
    //} elseif ($row['part_of_speech'] == 16) {
    } elseif ($row['part_of_speech'] == 7) {
        $morph .= "CONJ";
    //} elseif ($row['part_of_speech'] == 17) {
    } elseif ($row['part_of_speech'] == 8) {
        $morph .= "COND";
    //} elseif ($row['part_of_speech'] == 18) {
    } elseif ($row['part_of_speech'] == 9) {
        $morph .= "PRT";
    //} elseif ($row['part_of_speech'] == 19) {
    } elseif ($row['part_of_speech'] == 10) {
        $morph .= "PREP";
    //} elseif ($row['part_of_speech'] == 20) {
    } elseif ($row['part_of_speech'] == 11) {
        $morph .= "INJ";
    //} elseif ($row['part_of_speech'] == 21) {
    } elseif ($row['part_of_speech'] == 12) {
        $morph .= "HEB";
    //} elseif ($row['part_of_speech'] == 22) {
    } elseif ($row['part_of_speech'] == 13) {
        $morph .= "ARAM";
    //} elseif ($row['part_of_speech'] == 8) {
    } elseif ($row['part_of_speech'] == 6) {
        $morph .= "T";
    } elseif ($row['part_of_speech'] == 5) {
        if ($row['pronoun_type'] == 2) {
            $morph .= "R";
        } elseif ($row['pronoun_type'] == 3) {
            $morph .= "C";
        } elseif ($row['pronoun_type'] == 4) {
            $morph .= "D";
        } elseif ($row['pronoun_type'] == 5) {
            $morph .= "K";
        } elseif ($row['pronoun_type'] == 6) {
            $morph .= "I";
        } elseif ($row['pronoun_type'] == 7) {
            $morph .= "X";
        } elseif ($row['pronoun_type'] == 10) {
            $morph .= "Q";
        } elseif ($row['pronoun_type'] == 8) {
            $morph .= "F";
        } elseif ($row['pronoun_type'] == 9) {
            $morph .= "S";
        } elseif ($row['pronoun_type'] == 1) {
            $morph .= "P";
        }
    }
    
    /// TVM
    if ($row['tense'] == 1) {
        $morph .= "-P";
    } elseif ($row['tense'] == 2) {
        $morph .= "-I";
    } elseif ($row['tense'] == 3) {
        if ($row['form'] == 2) {
            $morph .= "-2F";
        } else {
            $morph .= "-F";
        }
    } elseif ($row['tense'] == 4) {
        if ($row['form'] == 2) {
            $morph .= "-2A";
        } else {
            $morph .= "-A";
        }
    } elseif ($row['tense'] == 5) {
        if ($row['form'] == 2) {
            $morph .= "-2R";
        } else {
            $morph .= "-R";
        }
    } elseif ($row['tense'] == 6) {
        if ($row['form'] == 2) {
            $morph .= "-2L";
        } else {
            $morph .= "-L";
        }
    } elseif ($row['tense'] == 99) {
        $morph .= "-X";
    }
    
    if ($row['voice'] == 1) {
        $morph .= "A";
    } elseif ($row['voice'] == 2) {
        $morph .= "M";
    } elseif ($row['voice'] == 3) {
        $morph .= "P";
    } elseif ($row['voice'] == 4) {
        $morph .= "D";
    } elseif ($row['voice'] == 5) {
        $morph .= "O";
    } elseif ($row['voice'] == 6) {
        $morph .= "Q";
    } elseif ($row['voice'] == 77) {
        $morph .= "E";
    } elseif ($row['voice'] == 88) {
        $morph .= "N";
    } elseif ($row['voice'] == 99) {
        $morph .= "X";
    }
    
    if ($row['mood'] == 1) {
        $morph .= "I";
    } elseif ($row['mood'] == 2) {
        $morph .= "S";
    } elseif ($row['mood'] == 3) {
        $morph .= "M";
    } elseif ($row['mood'] == 4) {
        $morph .= "N";
    } elseif ($row['mood'] == 5) {
        $morph .= "O";
    } elseif ($row['mood'] == 6) {
        $morph .= "P";
    } elseif ($row['mood'] == 7) {
        $morph .= "R";
    }
    
    /// person
    if ($row['person'] != 0) {
        $morph .= "-" . $row['person'];
    }
    
    /// CNG
    if ($row['case_5'] == 1) {
        //if ($row['part_of_speech'] < 13 || $row['part_of_speech'] > 15 || $row['person'] == 0) {
        if ($row['part_of_speech'] != 5 || ($row['part_of_speech'] == 5 && ($row['pronoun_type'] != 8 && $row['pronoun_type'] != 9 && $row['pronoun_type'] != 1)) || $row['person'] == 0) {
            $morph .= "-";
        }
        $morph .= "N";
    } elseif ($row['case_5'] == 2) {
        //if ($row['part_of_speech'] < 13 || $row['part_of_speech'] > 15 || $row['person'] == 0) {
        if ($row['part_of_speech'] != 5 || ($row['part_of_speech'] == 5 && ($row['pronoun_type'] != 8 && $row['pronoun_type'] != 9 && $row['pronoun_type'] != 1)) || $row['person'] == 0) {
            $morph .= "-";
        }
        $morph .= "G";
    } elseif ($row['case_5'] == 3) {
        //if ($row['part_of_speech'] < 13 || $row['part_of_speech'] > 15 || $row['person'] == 0) {
        if ($row['part_of_speech'] != 5 || ($row['part_of_speech'] == 5 && ($row['pronoun_type'] != 8 && $row['pronoun_type'] != 9 && $row['pronoun_type'] != 1)) || $row['person'] == 0) {
            $morph .= "-";
        }
        $morph .= "A";
    } elseif ($row['case_5'] == 4) {
        //if ($row['part_of_speech'] < 13 || $row['part_of_speech'] > 15 || $row['person'] == 0) {
        if ($row['part_of_speech'] != 5 || ($row['part_of_speech'] == 5 && ($row['pronoun_type'] != 8 && $row['pronoun_type'] != 9 && $row['pronoun_type'] != 1)) || $row['person'] == 0) {
            $morph .= "-";
        }
        $morph .= "D";
    } elseif ($row['case_5'] == 5) {
        //if ($row['part_of_speech'] < 13 || $row['part_of_speech'] > 15 || $row['person'] == 0) {
        if ($row['part_of_speech'] != 5 || ($row['part_of_speech'] == 5 && ($row['pronoun_type'] != 8 && $row['pronoun_type'] != 9 && $row['pronoun_type'] != 1)) || $row['person'] == 0) {
            $morph .= "-";
        }
        $morph .= "V";
    }
    
    if ($row['number'] == 1) {
        $morph .= "S";
    } elseif ($row['number'] == 2) {
        $morph .= "P";
    }
    
    if ($row['gender'] == 1) {
        $morph .= "M";
    } elseif ($row['gender'] == 2) {
        $morph .= "F";
    } elseif ($row['gender'] == 3) {
        $morph .= "N";
    }
    
    
    if ($row['miscellaneous'] == 1) {
        $morph .= '-I';
    } elseif ($row['miscellaneous'] == 2) {
        $morph .= '-N';
    } elseif ($row['miscellaneous'] == 3) {
        $morph .= '-P';
    } elseif ($row['miscellaneous'] == 4) {
        $morph .= '-M';
    }
    
    if ($row['degree'] == 1) {
        $morph .= '-C';
    } elseif ($row['degree'] == 2) {
        $morph .= '-S';
    }
    
    if ($row['type'] == 1) {
        $morph .= '-ABB';
    } elseif ($row['type'] == 2) {
        $morph .= '-C';
    } elseif ($row['type'] == 3) {
        $morph .= '-AP';
    } elseif ($row['type'] == 4) {
        $morph .= '-IRR';
    }
    
    if ($row['dialect'] == 1) {
        $morph .= '-ATT';
    } elseif ($row['dialect'] == 2) {
        $morph .= '-A';
    }
    
    if ($row['transitivity'] == 1) {
        $morph .= '-T';
    }
    
    
    return $morph;
}

function run_double_checker()
{
    $orig_table = "bible_original";
    $table = "morphology";
    
    $query = "SELECT id, word, morph FROM $orig_table WHERE book > 39";
    
    $mysql_res = mysql_query($query) or die(mysql_error() . "<br>". $query . "<br>". __LINE__);
    while ($row = mysql_fetch_assoc($mysql_res)) {
        $query = "SELECT * FROM $table WHERE id = {$row['id']}";
        $res = mysql_query($query) or die(mysql_error() . "<br>". $query . "<br>". __LINE__);
        $row2 = mysql_fetch_assoc($res);
        
        $new_morph = rev_morph($row2);
        
        if ($new_morph != $row['morph']) {
            echo "<div>$new_morph != {$row['morph']}</div><pre>";
            print_r($row);
            print_r($row2);
            die();
        } else {
            //echo "<div>$new_morph == {$row['morph']}</div>";
        }
    }
    
    echo "done";
}
