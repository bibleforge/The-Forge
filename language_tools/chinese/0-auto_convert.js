var ask = require("../../helpers/ask.js").ask,
    execFile = require("child_process").execFile,
    fs = require("fs"),
    directly_run = (require.main === module);

function done()
{
    /// Beep
    process.stdout.write("\u0007");
}

function run(dict, corpus, callback)
{
    var cwd = process.cwd() + "/",
        rand = "tmp-" + (new Date()).getTime() + "_" + Math.round(Math.random() * 100000) + "-";
    
    console.log("1/5 Weighing dictionary entries (this is the long part)...");
    execFile("node", [__dirname + "/1-weigh.js", dict, corpus], function (err, res)
    {
        var weights_file = cwd + rand + "weights.js";
        
        if (err) {
            throw err;
        }
        fs.writeFileSync(weights_file, res);
        
        console.log("2/5 Filtering dictionary by weights...");
        execFile("node", [__dirname + "/2-filter_by_weight.js", dict, weights_file], function (err, res)
        {
            var filtered1_file = cwd + rand + "dict_filtered_by_weight.js"
            if (err) {
                throw err;
            }
            
            fs.writeFileSync(filtered1_file, res);
            
            console.log("3/5 Analyzing dictionary...");
            execFile("node", [__dirname + "/3-analyze.js", filtered1_file], function (err, res)
            {
                var analysis_file = cwd + rand + "analysis.js";
                if (err) {
                    throw err;
                }
                fs.writeFileSync(analysis_file, res);
                
                console.log("4/5 Filtering out unneeded entries...");
                execFile("node", [__dirname + "/4-filter_by_analysis.js", filtered1_file, analysis_file], function (err, res)
                {
                    var filtered2_file = cwd + rand + "dict.js",
                        plot_data_file = cwd + rand + "plot_data.json";
                    
                    if (err) {
                        throw err;
                    }
                    
                    fs.writeFileSync(filtered2_file, res);
                    
                    console.log("5/5 Weighing and converting to raw data...");
                    execFile("node", [__dirname + "/5-sort_by_weight_and_convert.js", filtered2_file, weights_file, plot_data_file], function (err, res)
                    {
                        if (err) {
                            throw err;
                        }
                        var raw_file = cwd + rand + "dict_raw";
                        fs.writeFileSync(raw_file, res);
                        
                        if (directly_run) {
                            console.log("");
                            console.log("Files created:");
                            console.log(weights_file);
                            console.log(filtered1_file);
                            console.log(analysis_file);
                            console.log(filtered2_file);
                            console.log(raw_file);
                            console.log(plot_data_file);
                        }
                        
                        if (callback) {
                            callback({
                                weights_file: weights_file,
                                filtered1_file: filtered1_file,
                                analysis_file: analysis_file,
                                filtered2_file: filtered2_file,
                                raw_file: raw_file,
                                plot_data_file: plot_data_file
                            });
                        }
                    });
                });
            });
        });
    });
}

/// Was this run directly?
if (directly_run) {
    ask("Dictionaries location:", "./", function (dict)
    {
        ask("CKJV location:", "../../../languages/Chinese/", function (corpus)
        {
            console.log("Getting Simplified Chinese:");
            run(dict + "/dict_simp.js", corpus + "/ckjv_shangdi_sc/script/ckjv.js", function ()
            {
                console.log("Getting Traditional Chinese:");
                run(dict + "/dict_trad.js", corpus + "/ckjv_shangdi_tc/script/ckjv.js", done);
            });
            
        });
    });
} else {
    exports.run = run;
}