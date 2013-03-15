var config = require("../config.js").config; 

this.db = (function ()
{
    var db = new (require("db-mysql")).Database({
        charset:  "utf8", /// With this, we do not need to send "SET NAMES utf8;" when the connection is made.
        hostname: config.db.host,
        user:     config.db.user,
        password: config.db.pass,
        database: config.db.base,
        async: false
    });
    
    db.connect({async: false});
    
    return {
        fetch_rows: function (sql, callback)
        {
            var query = db.query();
            
            query.on("each", callback);
            
            query.execute(sql, []);
        },
        query: function db_query(sql, callback)
        {
            db.query().execute(sql, [], function (err, data)
            {
                if (typeof callback === "function") {
                    callback(data, err);
                }
            });
        },
        query_arr: function db_query(sql_arr, callback)
        {
            var errs = [],
                len  = sql_arr.length - 1,
                res  = [];
            
            (function loop(i)
            {
                db.query().execute(sql_arr[i], [], function (err, data)
                {
                    if (err) {
                        errs[i] = {
                            err: err,
                            sql: sql_arr[i]
                        };
                    }
                    
                    res[res.length] = data;
                    
                    if (i >= len) {
                        if (typeof callback === "function") {
                            callback(res, errs);
                        }
                    } else {
                        /// Use a setTimeout to prevent too much recursion.
                        setTimeout(function ()
                        {
                            loop(i + 1);
                        }, 0);
                    }
                });
            }(0));
        },
        query_sync: function db_query(sql)
        {
            var res;
            
            db.query().execute(sql, [], function (err, data)
            {
                if (err) {
                    console.error(err);
                    console.error(sql);
                }
                res = data;
            }, {async: false});
            
            return res;
        }
    };
}());
