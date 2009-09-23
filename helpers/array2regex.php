<?php

class array2regex
{
	public $debugging = false;
	
	private $regex = "";
	private $parens_arr = array();
	private $char_arr = array();
	/// This shows whether or not the entire regular expression needs to be enclosed in parentheses.
	/// This is true if the first letters of any two words do not match.
	private $enclose_regex = false;
	
	
	public function convert($arr)
	{
		/// Prepare the array.
		$arr = array_unique($arr);
		sort($arr);
		
		/// Reset the class variables
		$this->regex = "";
		$this->parens_arr = array();
		$this->char_arr = array();
		$this->enclose_regex = false;
		
		/// Prepare the local variables
		$word1 = "";
		$word2 = "";	
		$last = 0;
		
		foreach ($arr as $value) {
			/// Is this the first time in the loop?
			if ($word1 == "") {
				$word1 = $value;
				continue;
			}
			
			$word2 = $value;
			$i = 0;
			$len1 = strlen($word1);
			$len2 = strlen($word2);
			
			$min_len = min($len1, $len2);
			
			while ($i < $min_len) {
				if ($this->debugging) echo "<div>&nbsp;&nbsp;&nbsp;" . $word1[$i] . " ~ ". $word2[$i]. "</div>";
				if ($word1[$i] != $word2[$i]) {
					if ($this->debugging) echo "$word1 vs $word2<br>";
					$this->decide($word1, $word2, $last, $i);
					$last = $i;
					$word1 = $word2;
					break;
				}
				++$i;
			}
			if ($i == $len1) { /// Optional parenthese
				if ($this->debugging) echo "$word2<br>";
				$this->decide($word1, $word2, $last, $i, true);
				$last = $i;
				$word1 = $word2;
			}
			
	
		}
		
		/// Check one last time.
		if ($word2 != "") {
			$this->decide($word1, $word2, $last, $i);
		}
		
		/// Close any remaining parentheses.
		$this->regex .= $this->close_parens(0);
		
		if ($this->enclose_regex) $this->regex = '(?:' . $this->regex . ')';
		
		/// Make more efficient: change (?:.)? to .?
		$this->regex = preg_replace('/\(\?\:(\\\\?.)\)\?/', '\1?', $this->regex);
		
		return $this->regex;
	}
	
	private function decide($word1, $word2, $last, $i, $after_loop = false)
	{
		if (!$after_loop) {
			if ($last > 0) {
				if ($i > $last) {
					///NOTE: Found a match and the match contians more characters than before.
					/// Example: sing vs sundery THEN sundery vs sung
					if ($this->debugging) echo "<div>HERE4: $word1, $last $i ~ <u>{$this->regex}</u> ~ ". substr($word1, $last, $i - $last) . "</div>";
					if ($this->add_alternative()) $this->regex .= "|";
					//$this->regex .= substr($word1, $last, $i - $last);
					$this->add_characters($word1, $last, $i - $last);
					$this->regex .= '(?:';
					//$this->regex .= substr($word1, $i);
					$this->add_characters($word1, $i);
					$this->parens_arr[] = array('pos' => $i, 'optional' => false);
				} else {
					///NOTE: Found a match but the match is the same or less characters than previously.
					/// Example: sang vs sing THEN sing vs sung
					/// Example: singing vs single THEN single vs sung
					if ($i < $last && $i > 0) {
						/// Insert new group, if there isn't one.
						$this->insert_parens($i);
					}
					if ($this->debugging) echo "<div>HERE3: $word1, $last $i ~ <u>{$this->regex}</u> ~ ". substr($word1, $last) . "</div>";
					if ($this->add_alternative()) $this->regex .= "|";
					//$this->regex .= substr($word1, $last);
					$this->add_characters($word1, $last);
					$this->regex .= $this->close_parens($i);
					if ($i == 0) $this->enclose_regex = true;
				}
			} else {
				/// This only occurs when the last loop found no matches (or its the first run)
				///TODO Can this be merged with the above?
				$this->regex .= $this->close_parens($i);
				if ($i == 0) {
					///NOTE: No matching characters found.
					/// Example: man vs sang
					if ($this->debugging) echo "<div>HERE0: $word1, $last $i ~ <u>{$this->regex}</u> ~ $word1  </div>";
					if ($this->add_alternative()) $this->regex .= "|";
					//$this->regex .= $word1;
					$this->add_characters($word1, 0);
					$this->enclose_regex = true;
				} else {
					///NOTE: The first time to find atleast one charater to match for a letter.
					/// Example: sang vs sing
					if ($this->debugging) echo "<div>HERE1: $word1, $last $i - $last ~ <u>{$this->regex}</u> ~ ". substr($word1, $last, $i - $last) . "</div>";
					if ($this->add_alternative()) $this->regex .= "|";
					//$this->regex .= substr($word1, $last, $i - $last);
					$this->add_characters($word1, $last, $i - $last);
					$this->regex .= '(?:';
					//$this->regex .= substr($word1, $i - $last);
					$this->add_characters($word1, $i - $last);
					$this->parens_arr[] = array('pos' => $i, 'optional' => false);
				}
			}
			
		} else {
			/// Optional parenthese (Occurs if loop matches all characters of the first word.)
			/// Example: sing vs singing
			if ($this->debugging) echo "<div>HERE2: $word1, $last $i ~ <u>{$this->regex}</u> ~ ". substr($word1, $last) . "</div>";
			if ($this->add_alternative()) $this->regex .= "|";
			//$this->regex .= substr($word1, $last);
			$this->add_characters($word1, $last);
				
			$this->regex .= $this->close_parens($i);
			$this->regex .= '(?:';
			$this->parens_arr[] = array('pos' => $i, 'optional' => true);
		}
		return true;
	}
	
	private function close_parens($pos)
	{
		if (($count = count($this->parens_arr)) == 0) return "";
		$str = "";
		$new_arr = array();
		
		/// Reorder array to prevent gaps.
		$this->parens_arr = array_values($this->parens_arr);
		
		for ($i = $count - 1; $i >= 0; $i--) {
			$value = $this->parens_arr[$i];
			if ($value['pos'] > $pos) {
				$str .= ")";
				if ($value['optional']) {
					$str .= "?";
				}
				unset($this->parens_arr[$i]);
			}
		}
		
		/// Reorder array to prevent gaps again.
		$this->parens_arr = array_values($this->parens_arr);
		
		return $str;
	}
	
	private function add_alternative()
	{
		if (strlen($this->regex) == 0) return false;
		
		/// Only add an alternative if necessary.
		return (strcspn(substr($this->regex, -1), "(:|") == 1);
	}
	
	private function add_characters($word, $start, $len = -1)
	{
		if ($len == -1) {
			$addition = substr($word, $start);
			$len = strlen($addition);
		} else {
			$addition = substr($word, $start, $len);
		}
		$offset = strlen($this->regex);
		$this->regex .= preg_quote($addition);
		if ($start <= count($this->char_arr)) {
			for ($i = count($this->char_arr) - 1; $i >= $start; $i--) {
				unset($this->char_arr[$i]);
			}
		}
		ksort($this->char_arr);
		for ($i = 0; $i < $len; $i++) {
			$this->char_arr[$i + $start] = $i + $offset;
		}
		if ($this->debugging) {echo "<div> char_arr ";print_r($this->char_arr);echo "</div>";}
	}
	
	private function insert_parens($pos)
	{
		foreach ($this->parens_arr as $value) {
			if ($value['pos'] == $pos) return false;
		}
		//echo "<div>insert_parens $pos</div>";
		$this->regex = substr($this->regex, 0, $this->char_arr[$pos]) . '(?:' . substr($this->regex, $this->char_arr[$pos]);
		$char_count = count($this->char_arr);
		for ($i = $pos + 1; $i < $char_count; $i++) {
			$this->char_arr[$i] += 3;
		}
		
		$parens_count = count($this->parens_arr);
		if ($this->debugging) {echo '1st parens '; print_r($this->parens_arr);echo '<br>';}
		$found = false;
		for ($i = $parens_count - 1; $i >= 0; $i--) {
			//if ($this->parens_arr[$i]['pos'] > $pos + 1) {
			if ($this->parens_arr[$i]['pos'] > $pos) {
				$this->parens_arr[$i + 1] = array('pos' => $this->parens_arr[$i]['pos'], 'optional' => $this->parens_arr[$i]['optional']);
			} else {
				$this->parens_arr[$i + 1] = array('pos' => $pos, 'optional' => false);
				$found = true;
				break;
			}
		}
		if (!$found) $this->parens_arr[0] = array('pos' => $pos, 'optional' => false);
		if ($this->debugging) {echo '2nd parens '; print_r($this->parens_arr);echo '<br>';}
	}
}