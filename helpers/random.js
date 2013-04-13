var crypto = require("crypto");

this.random_numbers = function (bytes)
{
    return crypto.randomBytes(bytes || 10).readUInt32LE(0);
};
