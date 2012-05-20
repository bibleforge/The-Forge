this.ask = (function ()
{
    var rl = require("readline");
    
    return function (str, callback)
    {
        var input = rl.createInterface(process.stdin, process.stdout, null);
        
        input.question(str, function(answer)
        {
            /// Without these two lines, the program would hang.
            input.close();
            process.stdin.destroy();
            
            if (typeof callback === "function") {
                callback(answer);
            }
        });
    }
}());
