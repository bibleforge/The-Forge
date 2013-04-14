var config,
    debugging,
    fs,
    start_watching;

/// If there are no arguments, relaunch the program with an argument to make it work in the background.
if (process.argv.length === 2) {
    require("child_process").exec(process.argv.join(" ") + " bg");
    console.log("Running in the background...");
    ///NOTE: Use the "nohup" command if it won't stay in the background.
    ///      E.g., nohup node cache_buster.js > /dev/null
    process.exit();
}

config = require("./config.js").config;
fs = require("fs");

start_watching = (function ()
{
    var time_data;
    
    function match_all(regex, str)
    {
        var match,
            pos = 0,
            res = [];
        
        /// If it has the global flag, it cannot return the elements in the parenthases, so just run the regex and exit.
        if (regex.global) {
            return str.match(regex);
        }
        
        /// Make sure to get all of the matching parenthases.
        while ((match = str.substr(pos).match(regex))) {
            res[res.length] = match;
            pos += match.index + (match[0].length || 1);
        }
        
        return res;
    }
    
    var data = fs.readFileSync(config.static_path + "/js/main.js", "utf8");
    
    /**
     * Create a function that will update a file when changed.
     */
    function create_onchange(file_to_watch, file_to_change, last_time, regex, replace_str_pre)
    {
        /// Make sure that it is an integer so that it can be compared with the new time.
        last_time = parseInt(last_time);
        return function ()
        {
            if (debugging) {
                console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), file_to_watch);
            }
            fs.stat(file_to_watch, function (err, stats)
            {
                var time = (stats.mtime.getTime() / 1000) - 1326361000;
                if (debugging) {
                    console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), file_to_watch + " " + last_time + " vs " + time);
                }
                /// Does it need to be updated?
                if (last_time !== time) {
                    last_time = time;
                    fs.writeFileSync(file_to_change, fs.readFileSync(file_to_change, "utf8").replace(regex, replace_str_pre + last_time), "utf8");
                }
            });
        };
    }
    
    /**
     * Prepare to watch files.
     */
    return function (file_to_change, find_files_regex, explain_func)
    {
        function check_all(start_watching, check_now)
        {
            var data = fs.readFileSync(file_to_change, "utf8");
            
            match_all(find_files_regex, data).forEach(function (match)
            {
                var explained_obj,
                    file_to_watch,
                    last_time,
                    onchange,
                    replace_regex,
                    replace_str_pre;
                
                if (debugging) {
                    console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), match[2]);
                }
                
                /// Does this file need a special function to handle the matches?
                if (typeof explain_func === "function") {
                    /// If there is no easy way to firgure out the files names of both files to watch, a separate function is needed.
                    explained_obj   = explain_func(match);
                    file_to_watch   = explained_obj.file_to_watch;
                    last_time       = explained_obj.last_time;
                    replace_regex   = explained_obj.replace_regex;
                    replace_str_pre = explained_obj.replace_str_pre;
                } else {
                    file_to_watch   = config.static_path + match[2];
                    last_time       = match[3] || 0;
                    replace_regex   = new RegExp("(" + (match[1] + match[2]).replace(/(\()/g, "\\$1") + ")(?:\\?\\d*)?")
                    replace_str_pre = "$1?";
                }
                
                if (debugging) {
                    console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), file_to_watch);
                }
                onchange = create_onchange(file_to_watch, file_to_change, last_time, replace_regex, replace_str_pre);
                
                if (check_now) {
                    /// Since the file could have been changed before cache_buster was started, check them all at start up.
                    setTimeout(onchange, 0);
                }
                
                if (start_watching) {
                    fs.watch(file_to_watch, onchange);
                }
            });
        }
        
        check_all(true, true);
        
        (function ()
        {
            var timeout;
            
            /// If the file to change gets changed, make sure that the times are still correct.
            fs.watch(file_to_change, function ()
            {
                /// fs.watch() fires many times, so just use the last one by stopping existing timeouts.
                clearTimeout(timeout);
                /// Wait a little to make help ensure that the file is ready to be changed and possibly for an external file editor to setup its file watching function.
                timeout = setTimeout(function ()
                {
                    check_all(false, true);
                }, 300);
            });
        }());
    };
}());

///NOTE: The regex should have 3 captures
///      The 1st captures everything before the filename.
///      The 2nd captures the filename
///      The 3rd captures the time (if any) (but ignoring the optional question mark).

/// index.html
start_watching(config.static_path + "index.html", /((?:src|href)=")([^"]+\.(?:js|css))(?:\?(\d*))?/);
/// index_non-js.html
start_watching(config.server_path + "index_non-js.html", /((?:src|href)=")([^"]+\.(?:js|css))(?:\?(\d*))?/);
/// main.js (secondary.js & night.css)
start_watching(config.static_path + "js/main.js", /(BF\.include\(\"|link_tag\.href\s*=\s*")(\/js\/secondary\.js|\/styles\/night\.css)(?:\?(\d*))?/);
/// main.js (extra languages)
start_watching(config.static_path + "js/main.js", /([a-zA-Z0-9_]+)(\s*=\s*\{\n.*\n\s*modified:\s*)(\d+)/, function (match)
{
    return {
        file_to_watch:   config.static_path + "js/lang/" + match[1] + ".js",
        last_time:       match[3] || 0,
        replace_regex:   new RegExp("(" + match[1] + "\\s*=\\s*\{\n.*\n\\s*modified:\\s*)\\d+"),
        replace_str_pre: "$1"
    };
});
/// language specific CSS
fs.readdirSync(config.static_path + "styles/lang/").forEach(function (filename)
{
    var path = require("path");
    
    start_watching(config.static_path + "js/lang/" + path.basename(filename, path.extname(filename)) + ".js", /^\s*css_modified:\s*(\d+)/m, function (match)
    {
        return {
            file_to_watch:   config.static_path + "styles/lang/" + filename,
            last_time:       match[1] || 0,
            replace_regex:   /^(\s*css_modified:\s*)\d+/m,
            replace_str_pre: "$1"
        };
    });
});
/// Chinese language files
/// Simplified Chinese
start_watching(config.static_path + "js/lang/zh_s.js", /(BF.include\("|"GET",\s*\")([^"?]+)\?(\d*)/);
/// Traditional Chinese
start_watching(config.static_path + "js/lang/zh_t.js", /(BF.include\("|"GET",\s*\")([^"?]+)\?(\d*)/);