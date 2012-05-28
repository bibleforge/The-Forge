this.ask = (function ()
{
    var callback;
    
    process.stdin.on("data", function (chunk) {
        process.stdin.pause();
        callback(chunk.substr(0, chunk.length - 1));
    });
    
    return function (str, cb)
    {
        callback = cb;
        process.stdout.write(str);
        
        process.stdin.setEncoding("utf8");
        process.stdin.resume();
    };
}());
