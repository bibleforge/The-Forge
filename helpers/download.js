/**
 * Convert a filesize to something human readable.
 *
 * @param bytes      (number)  The amount of bytes.
 * @param inaccurate (boolean) Whether or not to use the inaccurate 1000 bytes/kB or the accurate 1024 bytes/kB (1024 is the default)
 */
var human_readable = (function ()
{
    var places = {
        accurate:   [1024, 1048576, 1073741824, 1099511627776, 1125899906842624, 1152921504606847000],
        inaccurate: [1000, 1000000, 1000000000, 1000000000000, 1000000000000000, 1000000000000000000]
    };
    
    return function human_readable(bytes, inaccurate)
    {
        var num,
            unit,
            which_place = places[inaccurate ? "inaccurate" : "accurate"];
        
        if (bytes < which_place [0]) {        /// bytes
            num = bytes;
            unit = "byte" + (bytes === 1 ? "" : "s");
        } else if (bytes < which_place [1]) { /// kB
            num = bytes / which_place [0];
            unit = "kB";
        } else if (bytes < which_place [2]) { /// MB
            num = bytes / which_place [1];
            unit = "MB";
        } else if (bytes < which_place [3]) { /// GB
            num = bytes / which_place [2];
            unit = "GB";
        } else if (bytes < which_place [4]) { /// TB
            num = bytes / which_place [3];
            unit = "TB";
        } else if (bytes < which_place [5]) { /// PB
            num = bytes / which_place [4];
            unit = "PB";
        } else {                              /// EB
            num = bytes / which_place [5];
            unit = "EB";
        }
        
        return (Math.round(num * 100) / 100) + " " + unit;
    };
}());


/**
 * Download a file.
 *
 * @todo Download to memory.
 * @note Inspired by Carlosedp.
 * @see  http://stackoverflow.com/questions/4771614/download-large-file-with-node-js-avoiding-high-memory-consumption
 */
this.download = function (download_url, callback, options)
{
    var client,
        filename,
        host,
        parsed_url = require("url").parse(download_url),
        request;
    
    if (!options) {
        options = {};
    }
    
    host = parsed_url.hostname;
    filename = options.save_as || parsed_url.pathname.split("/").pop();
    
    client = require("http").createClient(80, host);
    
    if (options.verbose) {
        console.log("Downloading file: " + filename);
    }
    
    request = client.request("GET", download_url, {"host": host});
    request.end();
    
    request.addListener("response", function (response)
    {
        var amount_so_far = 0,
            downloadfile = require("fs").createWriteStream(filename, {"flags": "a"}),
            done_timeout,
            last_bytes_amt,
            progress_int,
            total = response.headers["content-length"];
        
        function done()
        {
            downloadfile.end();
            clearTimeout(done_timeout);
            if (options.progress) {
                clearInterval(progress_int);
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
            }
            if (options.verbose) {
                console.log("Finished downloading " + filename);
            }
            if (callback) {
                callback(filename);
            }
        }
        
        if (options.verbose && total) {
            console.log("File size " + filename + ": " + total + " bytes.");
        }
    
        if (options.progress) {
            progress_int = setInterval(function ()
            {
                if (amount_so_far !== last_bytes_amt) {
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write("Download progress: " + human_readable(amount_so_far))
                    if (total) {
                        process.stdout.write(" " + Math.round((amount_so_far / total) * 100) + "%")
                    }
                    last_bytes_amt = amount_so_far;
                }
                
                /// Is it done?
                if (total && amount_so_far === total) {
                    done();
                }
            }, 1000);
        }
        
        response.addListener("data", function (chunk)
        {
            amount_so_far += chunk.length;
            downloadfile.write(chunk, {encoding:"binary"});
        });
        response.addListener("end", function()
        {
            if (options.verbose) {
                console.log("Done");
            }
            ///NOTE: The "end" event triggers before the data finishes saving.
            done_timeout = setTimeout(done, 3000);
        });

    });
};
