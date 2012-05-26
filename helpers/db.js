var config = require("../config.js").config; 

this.db = (function ()
{
    var db = new (require("db-mysql")).Database({
        hostname: config.db.host,
        user:     config.db.user,
        password: config.db.pass,
        database: config.db.base,
        async: false
    });
    
    db.connect({async: false});
        
    db.query().execute("SET NAMES 'utf8'", {async: false});
    
    return {
        query: function db_query(sql, callback)
        {
            db.query().execute(sql, [], function (err, data)
            {
                if (typeof callback === "function") {
                    callback(data, err);
                }
            });
        },
        query_sync: function db_query(sql)
        {
            var res;
            
            db.query().execute(sql, [], function (err, data)
            {
                if (err) {
                    console.log(err);
                    console.log(sql);
                }
                res = data;
            }, {async: false});
            
            return res;
        }
    };
}());