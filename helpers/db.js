var config = require("../config.js").config; 

this.query = (function ()
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
    
    return function db_query(sql, callback)
    {
        db.query().execute(sql, [], function (err, data)
        {
            if (typeof callback === "function") {
                callback(data);
            }
        });
    }
}());