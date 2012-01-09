<?php

require 'config.php';

/// Clear cached datestamps (needed if run in a loop).
clearstatcache();

function file_get_contents_utf8($fn)
{
    $content = file_get_contents($fn);
    return mb_convert_encoding($content, 'UTF-8', mb_detect_encoding($content, 'UTF-8, ISO-8859-1', true));
}


/// Update main.js.

function replace_callback_main($matches)
{
    $time = filemtime(BF_DIR . $matches[1]);
    
    /// Did the time return correctly?
    if ($time) {
        return 'BF.include("' . $matches[1] . '?' . $time . '",';
    } else {
        /// Just return the found string if it couldn't figure out the last modified time.
        return $matches[0];
    }
}

$filename = '/js/main.js';

$data = file_get_contents_utf8(BF_DIR . $filename);

$new_data = preg_replace_callback('/BF.include\("(\/js\/secondary.js)(?:\?\d*)?",/', 'replace_callback_main', $data);

if ($new_data && $new_data !== $data && strlen($new_data) >= strlen($data) - 20) {
    file_put_contents(BF_DIR . $filename, $new_data);
}


/// Update index.html.

function replace_callback_index1($matches)
{
    $time = filemtime(BF_DIR . $matches[2] . '.' . $matches[3]);
    
    /// Did the time return correctly?
    if ($time) {
        return $matches[1] . '="' . $matches[2] . '.' . $matches[3] . '?' . $time . '"';
    } else {
        /// Just return the found string if it couldn't figure out the last modified time.
        return $matches[0];
    }
}

function replace_callback_index2($matches)
{
    $time = filemtime(BF_DIR . '/js/lang/' . $matches[1] . '.js');
    
    /// Did the time return correctly?
    if ($time) {
        return $matches[1] . $matches[2] . $time . $matches[3];
    } else {
        /// Just return the found string if it couldn't figure out the last modified time.
        return $matches[0];
    }
}


$filename = '/index.html';

$data = file_get_contents_utf8(BF_DIR . $filename);

$new_data = preg_replace_callback('/(src|href)="([^"]+)\.(js|css)(?:\?\d*)?"/', 'replace_callback_index1', $data);

$new_data = preg_replace_callback('/(\S+)(\:\s*\{[^\}]+modified\:\s*)(?:\d*)(\D)/', 'replace_callback_index2', $new_data);

if ($new_data && $new_data !== $data && strlen($new_data) >= strlen($data) - 20) {
    file_put_contents(BF_DIR . $filename, $new_data);
}
