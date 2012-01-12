<?php

/// Usage: php cache_buster.php [bg | sleep_time]
///
/// If no arguments are present, it will simply run once and then quit.
/// If arguments are present, it will try to become a background service.
/// If the first argument is text (e.g., "bg"), it will use the default sleep time between runs (5 seconds).
/// If the argument is a number, the script will pause that many seconds between runs.
///
/// Example 1: Run once and then quit.
///     php cache_buster.php
/// Example 2: Run in the background with the default time (5 seconds)
///     php cache_buster.php bg
/// Example 3: Run in the background and pause 10 seconds between runs.
///     php cache_buster.php 10

/// If no parameters, run in the background.
$is_service = ($argc > 1);

require_once 'config.php';

function file_get_contents_utf8($fn)
{
    $content = file_get_contents($fn);
    return mb_convert_encoding($content, 'UTF-8', mb_detect_encoding($content, 'UTF-8, ISO-8859-1', true));
}

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



function update()
{
    
    /// Clear cached datestamps (needed if run in a loop).
    clearstatcache();
    
    /// Update main.js.
    
    $filename = '/js/main.js';
    
    $data = file_get_contents_utf8(BF_DIR . $filename);
    
    $new_data = preg_replace_callback('/BF.include\("(\/js\/secondary.js)(?:\?\d*)?",/', 'replace_callback_main', $data);
    
    if ($new_data && $new_data !== $data && strlen($new_data) >= strlen($data) - 20) {
        file_put_contents(BF_DIR . $filename, $new_data);
    }
    
    
    /// Update index.html.
        
    $filename = '/index.html';
    
    $data = file_get_contents_utf8(BF_DIR . $filename);
    
    $new_data = preg_replace_callback('/(src|href)="([^"]+)\.(js|css)(?:\?\d*)?"/', 'replace_callback_index1', $data);
    
    $new_data = preg_replace_callback('/(\S+)(\:\s*\{[^\}]+modified\:\s*)(?:\d*)(\D)/', 'replace_callback_index2', $new_data);
    
    if ($new_data && $new_data !== $data && strlen($new_data) >= strlen($data) - 20) {
        file_put_contents(BF_DIR . $filename, $new_data);
    }
}

function sig_handler($signo)
 {
    switch ($signo) {
    case SIGTERM:
        /// Shutdown
        exit;
        break;
    case SIGHUP:
        /// Restart
        ///TODO: Restart the script.
        break;
    default:
        /// All other signals
        ///TODO: Perhaps do something else.
    }
}

if ($is_service) {
    $sleep_time = ($argv[1] > 0 ? intval($argv[1]) : 5);
    
    ///TODO: Determine if ticks are actually useful.
    declare(ticks=1);
    
    $pid = pcntl_fork();
    if ($pid === -1) {
        die("Could not fork.\n");
    } else if ($pid) {
        /// We are the parent.
        ///TODO: Determine if something else should be done here.
        exit();
    } else {
        /// We are the child.
    }
    
    /// Detach from the controlling terminal.
    if (posix_setsid() == -1) {
        die("Could not detach from terminal.\n");
    }
    
    $posid =posix_getpid();
    $fp = fopen("/tmp/BF_cache_buster.pid", "w");
    fwrite($fp, $posid);
    fclose($fp);
    
    /// Setup signal handlers.
    pcntl_signal(SIGTERM, "sig_handler");
    pcntl_signal(SIGHUP,  "sig_handler");
    
    for(;;) {
        update();
        sleep($sleep_time);
    }
} else {
    update();
    echo "done\n";
}
