var spawn = require("child_process").spawn,
    prg   = spawn("node", ["0-auto_convert.js"]);

prg.stdout.on("data", (function ()
{
    var counter = 0;
    
    return function (data)
    {
        counter += 1;
        console.log("stdout: \"" + data + "\"");
        if (counter === 1) {
            prg.stdin.write("./");
        }
    }
}()));

prg.stderr.on("data", function (data) {
  console.log("stderr: " + data);
});

prg.on("close", function (code) {
  console.log("child process exited with code " + code);
});
