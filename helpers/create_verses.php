<?php

/**
 * Create the html and plain text tables for a Bible verion.
 *
 * @example create_verses('english');
 */
function create_verses($lang)
{
    error_reporting(E_ALL);
    set_time_limit(9999999);
    
    /*********************
    * delcare variables *
    *********************/
    $table       = 'bible_' . $lang;
    $html_verses = 'bible_' . $lang . '_html';
    $searchable  = 'bible_' . $lang . '_verses';
    
    $db = mysql_connect(HOST, USER, PASS);
    mysql_select_db(BASE, $db);
    
    /// Not needed for English version.
    mysql_query("SET NAMES utf8");
    
    $query = "SHOW TABLES";
    $res   = mysql_query($query) or die(mysql_error() . "<br>" . $query);
    $has_html_verses = false;
    $has_searchable  = false;
    while ($row = mysql_fetch_row($res)) {
        if ($row[0] == $html_verses) {
            $has_html_verses = true;
        }
        if ($row[0] == $searchable) {
            $has_searchable = true;
        }
    }
    
    /// Create tables if needed
    if (!$has_html_verses) {
        $query = "CREATE TABLE `" . BASE . "`.`" . $html_verses . "` (
        `id` int( 4 ) unsigned NOT NULL ,
        `id2` mediumint( 3 ) unsigned NOT NULL AUTO_INCREMENT ,
        `book` tinyint( 1 ) unsigned NOT NULL DEFAULT '0',
        `chapter` tinyint( 1 ) unsigned NOT NULL DEFAULT '0',
        `verse` tinyint( 1 ) unsigned NOT NULL DEFAULT '0',
        `words` text NOT NULL ,
        `paragraph` tinyint( 1 ) unsigned NOT NULL ,
        PRIMARY KEY ( `id2` ) ,
        KEY `verseID` ( `id` ) ,
        KEY `book` ( `book` )
        ) ENGINE = MYISAM DEFAULT CHARSET = utf8;";
        mysql_query($query) or die(mysql_error() . "<br>" . $query);
    }
    if (!$has_searchable) {
        $query = "CREATE TABLE `" . BASE . "`.`" . $searchable . "` (
        `id` int( 4 ) unsigned NOT NULL ,
        `id2` mediumint( 3 ) unsigned NOT NULL AUTO_INCREMENT ,
        `book` tinyint( 1 ) unsigned NOT NULL DEFAULT '0',
        `chapter` tinyint( 1 ) unsigned NOT NULL DEFAULT '0',
        `verse` tinyint( 1 ) unsigned NOT NULL DEFAULT '0',
        `words` text NOT NULL ,
        PRIMARY KEY ( `id2` ) ,
        KEY `verseID` ( `id` ) ,
        KEY `book` ( `book` ) ,
        FULLTEXT KEY `words` ( `words` )
        ) ENGINE = MYISAM DEFAULT CHARSET = utf8;";
        mysql_query($query) or die(mysql_error() . "<br>" . $query);
    }
    
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
        
        /// Skip empty words.
        if ($row['word'] === '') {
            continue;
        }
        
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
        /// Convert straight quotes to curly quotes for the HTML version.
        $str  .= " id={$row["id"]}>" . str_replace("'", '�', $row["word"]) . '</a> ';
        $str2 .= "{$row["word"]} ";
    }
    
    $query  .= "($vID, $b, $c, $v, '". addslashes(substr($str,  0, -1)) ."', $para)";
    $query2 .= "($vID, $b, $c, $v, '". addslashes(substr($str2, 0, -1)) ."')";
    
    mysql_query($sql_intro1 . $query)  or die(__LINE__ . "<br>" . mysql_error() . "<br>". $sql_intro1 . $query);
    mysql_query($sql_intro2 . $query2) or die(__LINE__ . "<br>" . mysql_error() . "<br>". $sql_intro2 . $query2);
}