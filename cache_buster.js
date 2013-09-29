var config,
    debugging,
    fs,
    start_watching,
    md5_file,
    crypto;

/// If there are no arguments, relaunch the program with an argument to make it work in the background.
if (process.argv.length === 2) {
    require("child_process").exec(process.argv.join(" ") + " bg");
    console.log("Running in the background...");
    ///NOTE: Use the "nohup" command if it won't stay in the background.
    ///      E.g., nohup node cache_buster.js > /dev/null
    process.exit();
}

/// Make sure we can access the files properly.
process.chdir(__dirname);

config = require("./config.js").config;
fs = require("fs");
crypto = require("crypto");


md5_file = function md5_file(file, callback)
{
    var data = fs.readFile(file, "utf8", function (err, data)
    {
        var hasher = crypto.createHash("md5");
        
        ///NOTE: Change "hex" to "binary" if you want a binary digest.
        hasher.setEncoding("hex");
        
        /// Now add the password to be hashed.
        hasher.write(data);
        
        ///NOTE: You can"t read from the stream until you call .end().
        hasher.end();
        
        /// Get the hash.
        callback(hasher.read());
    });
};

start_watching = (function ()
{
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
    function create_onchange(file_to_watch, file_to_change, last_hash, regex, replace_str_pre)
    {
        return function ()
        {
            if (debugging) {
                console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), file_to_watch);
            }
            //fs.stat(file_to_watch, function (err, stats)
            md5_file(file_to_watch, function (hash)
            {
                if (debugging) {
                    console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), file_to_watch + " " + last_hash + " vs " + hash);
                }
                /// Does it need to be updated?
                if (last_hash !== hash) {
                    last_hash = hash;
                    fs.writeFileSync(file_to_change, fs.readFileSync(file_to_change, "utf8").replace(regex, replace_str_pre + last_hash), "utf8");
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
                    last_hash,
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
                    last_hash       = explained_obj.last_hash;
                    replace_regex   = explained_obj.replace_regex;
                    replace_str_pre = explained_obj.replace_str_pre;
                } else {
                    file_to_watch   = config.static_path + match[2];
                    last_hash       = match[3] || 0;
                    replace_regex   = new RegExp("(" + (match[1] + match[2]).replace(/(\()/g, "\\$1") + ")(?:\\?[\\da-f]*)?")
                    replace_str_pre = "$1?";
                }
                
                if (debugging) {
                    console.log((new Error).stack.replace(/[^\n]*\n[^\n]*\:(\d+\:\d+)[\s\S]*/, "$1"), file_to_watch);
                }
                onchange = create_onchange(file_to_watch, file_to_change, last_hash, replace_regex, replace_str_pre);
                
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
                }, 600);
            });
        }());
    };
}());

///NOTE: The regex should have 3 captures
///      The 1st captures everything before the filename.
///      The 2nd captures the filename
///      The 3rd captures the time (if any) (but ignoring the optional question mark).

/// index.html
start_watching(config.static_path + "index.html", /((?:src|href)=")([^"]+\.(?:js|css))(?:\?([\da-f]*))?/);
/// index_non-js.html
start_watching(config.server_path + "index_non-js.html", /((?:src|href)=")([^"]+\.(?:js|css))(?:\?([\da-f]*))?/);
/// main.js (secondary.js & night.css)
start_watching(config.static_path + "js/main.js", /(BF\.include\(\"|link_tag\.href\s*=\s*")(\/js\/secondary\.js|\/styles\/night\.css)(?:\?([\da-f]*))?/);
/// main.js (extra languages)
start_watching(config.static_path + "js/main.js", /([a-zA-Z0-9_]+)(\s*=\s*\{\n.*\n\s*hash:\s*)([\da-f]+)/, function (match)
{
    return {
        file_to_watch:   config.static_path + "js/lang/" + match[1] + ".js",
        last_hash:       match[3] || 0,
        replace_regex:   new RegExp("(" + match[1] + "\\s*=\\s*\{\n.*\n\\s*hash:\\s*)[\\da-f]+"),
        replace_str_pre: "$1"
    };
});
/// language specific CSS
fs.readdirSync(config.static_path + "styles/lang/").forEach(function (filename)
{
    var path = require("path");
    
    start_watching(config.static_path + "js/lang/" + path.basename(filename, path.extname(filename)) + ".js", /^\s*css_hash:\s*([\da-f]+)/m, function (match)
    {
        return {
            file_to_watch:   config.static_path + "styles/lang/" + filename,
            last_hash:       match[1] || 0,
            replace_regex:   /^(\s*css_hash:\s*)[\da-f]+/m,
            replace_str_pre: "$1"
        };
    });
});
/// Chinese language files
/// Simplified Chinese
start_watching(config.static_path + "js/lang/zh_s.js", /(BF.include\("|"GET",\s*\")([^"?]+)\?([\da-f]*)/);
/// Traditional Chinese
start_watching(config.static_path + "js/lang/zh_t.js", /(BF.include\("|"GET",\s*\")([^"?]+)\?([\da-f]*)/);
