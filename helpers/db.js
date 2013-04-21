var config = require("../config.js").config,
    db;

db = require(process.cwd() + "/" + config.server_path + "./modules/db.js").db(config.db);

this.db = {
    query: db.query,
    query_arr: function db_query_arr(sql_arr, callback)
    {
        var errs = [],
            len  = sql_arr.length - 1,
            res  = [];
        
        (function loop(i)
        {
            db.query(sql_arr[i], function (data, err)
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
    request_a_client: db.request_a_client,
};
