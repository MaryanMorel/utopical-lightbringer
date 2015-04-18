var passport = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('./User.js')
var PasswordStorage = require('./passwordstorage.js')
var mongoose = require('mongoose');
var mongojs = require("mongojs");
var fs = require('fs');




// how to exchange data beetween passport and mongo_db
passport.serializeUser(function(user, done) {
		console.log('serializeUser: ' + user._id)
		done(null, user._id);
});
passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user){
				console.log(user);
				if(!err) done(null, user);
				else done(err, null);
		})
});

// Initialize passport with credentials
var initPassport = function(consumerKey, consumerSecret) {
  passport.use(new TwitterStrategy({
		consumerKey: consumerKey,
		consumerSecret: consumerSecret,
		callbackURL: "http://localhost:8080/auth/twitter/callback"
   },
// Call back when user logs in
   function(accessToken, refreshToken, profile, done) {
   User.findOne({ oauthID: profile.id }, function(err, user) {
  	 if(err) { console.log(err); }
  	 if (!err && user != null) {
  		 done(null, user);
  	 } else {
  		 var user = new User({
  			 oauthID: profile.id,
  			 name: profile.displayName,
  			 created: Date.now(),
  			 accessToken: accessToken,
  			 refreshToken: refreshToken
  		 });
  		 user.save(function(err) {
  			 if(err) { 
  				 console.log(err); 
  			 } else {
  				 console.log("saving user ...");
  				 done(null, user);
  			 };
  		 });
  	 };
   });
  }
  ));
}

// Initialize mongo db connexion with credentials
var initMongoDB = function(password){
  var uri = "mongodb://nodejs:" + password + "@ds029807.mongolab.com:29807/utopical";
  mongoDB = mongojs.connect(uri, ["tweets", "users"]);
  module.exports.mongoDB = mongoDB;
}


var initPasswords = function() {
  PasswordStorage.findOne({ "name": "main" }, function(err, passwords) {
    if(err) { console.log(err); }
    if(!err && passwords == null) {console.log("passwords not found"); }
    else {
        initPassport(passwords.twitterConsumerKey, passwords.twitterConsumerSecret);
        initMongoDB(passwords.main_mongo);
     } 
  });
};

// Retrieve password on mongo database (can only be accessed locally)

// First case : debugging on localhost
// First try if the password file exists locally (for localhost test)
var file = 'password.txt'
if (fs.existsSync(file)){
  fs.readFile(file, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
      password = data;
      // And connect to distant database
      mongoose.connect('mongodb://local_user:' + password + '@ds027491.mongolab.com:27491/local_mongo');
      initPasswords();
  });
}
// Second case : production 
// Connext to mongodb database that can only be accessed locally on the server
else {
  mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL);
  initPasswords();
}






