var dict = require(process.argv[2]).dict,
    weights = require(process.argv[3]).weight;

process.stdout.write("this.dict=[");

dict.forEach(function (entry)
{
    if (weights[entry]) {
        /// Skip these words since they are probably not what we want to match.
        if (entry !== "人的" && entry !== "的人" && entry !== "们就" && entry !== "们的" && entry !== "人在" && entry !== "我在" && entry !== "你在" && entry !== "他在" &&
                                                   entry !== "們就" && entry !== "們的") {
            process.stdout.write("\"" + entry + "\",");
        }
    }
});

process.stdout.write("];");
