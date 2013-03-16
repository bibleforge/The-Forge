"use strict";

var amount_to_simplify = 50,
    dict = require(process.argv[2]).dict,
    dict_len,
    i,
    last_point,
    plot = [],
    plot_file = process.argv[4],
    plot_data,
    pos = 0,
    sorted = [],
    weights = require(process.argv[3]).weight;

var simplify_curve = (function ()
{
    var get_greatest_distance = (function ()
    {
        function hypot(x, y)
        {
            var t;
            
            x = Math.abs(x);
            y = Math.abs(y);
            
            if (x < y) {
                t = x / y;
                x = y;
            } else {
                t = y / x;
            }
            
            return x * Math.sqrt(1 + t * t);
        }
        
        return function get_greatest_distance(p, from, to)
        {
            var i,
                greatest_dist,
                greatest_point,
                this_dist,
                
                to_from_x = p[to].x - p[from].x,
                to_from_y = p[to].y - p[from].y,
                h;
            
            h = hypot(to_from_x, to_from_y);
            
            /// This is non-inclusive.
            for (i = from + 1; i < to; i += 1) {
                this_dist = Math.abs((p[i].x - p[from].x) * to_from_y - (p[i].y - p[from].y) * to_from_x) / h;
                if (i === from + 1 || this_dist > greatest_dist) {
                    greatest_dist = this_dist;
                    greatest_point = i;
                }
            }
            
            return {dist: greatest_dist, p: greatest_point};
        };
    }());
    
    /// Uses the Ramer-Douglas-Peucker algorithm.
    function examine_points(p, e, from, to)
    {
        var mid;
        
        /// Make sure there is something in between.
        for (;;) {
            if (to - from <= 1) {
                break;
            }
            
            ///TODO: It would be much faster to store these results and then clear them if (mid.dist > e).
            mid = get_greatest_distance(p, from, to);
            
            if (mid.dist > e) {
                ///NOTE: The second half has to be check first because removing elements changes the to value.
                examine_points(p, e, mid.p, to);
                examine_points(p, e, from, mid.p);
                break;
            } else {
                /// Remove the point;
                p.splice(mid.p, 1);
                to -= 1;
            }
        }
    }
    
    return function simplify_curve(p, e)
    {
        examine_points(p, e, 0, p.length - 1);
    }
}());

function write(str)
{
    pos += str.length;
    process.stdout.write(str);
}


dict_len = dict.length;


dict.forEach(function (entry)
{
    var weight = weights[entry];
    
    if (!sorted[weight]) {
        sorted[weight] = [];
    }
    sorted[weight].push(entry);
});

/// We want a line break at the beginning to make it easier to look up words.
write("\n");

///NOTE: Skip zero since we only have words that occur at least once.
for (i = sorted.length - 1; i > 0 ;i -= 1) {
    if (sorted[i]) {
        sorted[i].forEach(function (el)
        {
            plot[plot.length] = {x: pos - 1, y: i};
            write(el + "\n");
        });
    }
}

/// Store points used to recreate the curve.
simplify_curve(plot, amount_to_simplify);
require("fs").writeFileSync(plot_file, JSON.stringify(plot));
