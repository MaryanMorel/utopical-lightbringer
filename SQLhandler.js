var path = require("path");
var fs      = require('fs');
var mongojs = require("mongojs");

var mongoDB;

var file = "../main.db";
var exists = fs.existsSync(file);

// FIRST CASE : DEBUGGING
if (exists){
    var sqlite3 = require("sqlite3").verbose();
    var dbSqlite = new sqlite3.Database(file);

    dbSqlite.each("SELECT * FROM mongo_password WHERE id=1", function(err, rows){
        if (err) {
            console.log(err);
        }
        else {
            var password = rows["pwd"];
            var uri = "mongodb://nodejs:" + password + "@ds029807.mongolab.com:29807/utopical";
            mongoDB = mongojs.connect(uri, ["tweets", "users"]);
            module.exports.mongoDB = mongoDB;
        }
    });


    exports.save_user = function(accessToken, refreshToken, profile) {
      var user = getUserById(profile.id);
      if(user === undefined || user === null) {
        console.log("user was not in database")
        var query = "INSERT into user_information VALUES (";
        query += profile.id + ", ";
        query += "\"" + profile._json.screen_name + "\", ";
        query += "\"" + accessToken + "\", ";
        query += "\"" + refreshToken + "\")";
        console.log(query);
        dbSqlite.run(query);
      }
      else console.log("user w i d b")
    };

    getUserById = function(id, action){
      var query = "SELECT * FROM user_information WHERE user_id=" + id;
      console.log("getting " + id + " : " + query);
      var user;

      dbSqlite.each(query, function(err, row){
        if (err) {
          console.log("no one?");
            console.log("error" + err);
        }
        else {
          console.log(row.lengt)
            user = {
              "user_id":row["user_id"],
              "screen_name":row["screen_name"],
              "accessToken":row["access_token"],
              "refreshToken":row["refresh_token"]
            };
            console.log("We found "+ user.screen_name);
            action(user);
          }
        }
      );
    };

    exports.getUserById = getUserById;
}
else {
    console.log("cannot connect to local file try distant database")
    var mysql      = require('mysql');
    var connection = mysql.createConnection({
      host     : '552bb4aa4382ecad03000048-utopical.rhcloud.com',
      port     : '39871',
      user     : 'adminp2uV8Z4',
      password : '4YyWmAsb-DNS',
      database : 'main'
    });

    connection.connect();
    connection.query('SELECT * from mongo_password WHERE id=1', function(err, rows, fields) {
      if (err) throw err;
      var password = rows[0]["pwd"];
        var uri = "mongodb://nodejs:" + password + "@ds029807.mongolab.com:29807/utopical";
        mongoDB = mongojs.connect(uri, ["tweets", "users"]);
        module.exports.mongoDB = mongoDB;
    });
    connection.end();
}

