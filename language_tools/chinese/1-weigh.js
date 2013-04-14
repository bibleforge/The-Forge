/// Is it the master?
if (!process.send) {
    (function ()
    {
        var cp = require("child_process"),
            cpus = require("os").cpus().length,
            enteries = require(process.argv[2]).dict.length,
            enteries_todo,
            nodes = [],
            i,
            finished = 0;
        
        function create_on_message(which)
        {
            return function (message)
            {
                /// Parent got a message.
                finished += 1;
                process.stdout.write(message);
                if (finished === cpus) {
                    process.stdout.write("};");
                    process.exit();
                }
            };
        }
        
        enteries_todo = Math.round(enteries / cpus);
        
        process.stdout.write("this.weight={");
        
        for (i = 0; i < cpus; i += 1) {
            /// Create child processes of itself.
            nodes[i] = cp.fork(process.argv[1]);
            nodes[i].on("message", create_on_message(i));
            nodes[i].send({
                dict_file: process.argv[2],
                corpus_file: process.argv[3],
                start: i * enteries_todo,
                enteries_todo: (i === cpus - 1 ? enteries -  (i * enteries_todo): enteries_todo),
            });
        }
    }());
} else {
    process.on("message", function(message)
    {
        var corpus = require("fs").readFileSync(message.corpus_file, "utf8"),
            dict = require(message.dict_file).dict,
            analysis = {},
            i,
            stop_at = message.start + message.enteries_todo,
            entry,
            weight,
            res = "";
        
        /**
         * Function count the occurrences of needle in a string;
         *
         * @param str    (string) The string to examine
         * @param needle (string) The string to search for
         */
        function occurrences(str, needle)
        {
            var count = 0,
                pos   = 0,
                step  = needle.length;
            
            if (needle.length === 0) {
                return false;
            }
        
            for (;;) {
                pos = str.indexOf(needle, pos);
                if (pos > -1) {
                    count += 1;
                    pos += step;
                } else {
                    break;
                }
            }
            
            return count;
        }
        
        function add(char, pos, weight)
        {
            if (!analysis[char]) {
                analysis[char] = {}
            }
            if (!analysis[char][pos]) {
                analysis[char][pos] = weight;
            } else {
                analysis[char][pos] += weight;
            }
        }
        
        for (i = message.start; i < stop_at; i += 1) {
            
            entry = dict[i];
            ///NOTE: Just doing a pass/fail weight does not really to make it faster.
            weight = occurrences(corpus, entry);
            
            if (weight > 0) {
                res += "\"" + entry + "\":" + weight + ",";
            }
        }
        
        process.send(res);
        ///NOTE: The parent process will exit when it is all done.
    });
}