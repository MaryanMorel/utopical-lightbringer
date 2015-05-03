var passport = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('./models/User.js')
var PasswordStorage = require('./models/PasswordStorage.js')
var mongoose = require('mongoose');
var mongojs = require("mongojs");
var fs = require('fs');
var os = require("os");
var util = require('util');



// how to exchange data beetween passport and mongo_db
passport.serializeUser(function(user, done) {
		done(null, user._id);
});
passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user){
				if(!err) done(null, user);
				else done(err, null);
		})
});

// Initialize passport with credentials  
var initTwitter = function(consumerKey, consumerSecret, user){
  console.log("current user" + util.inspect(user));

  var Twitter = require('twitter');
  
  // DEBUG : This our way to have Tweets for the dedicated account (cf. 'Pistes d'amélioration)
  user.accessToken = '3089105255-Tk2yPdqnFqQ5pDCIGXos5IXOVR5Fo1u7jJeZzkp';
  user.refreshToken = '7MbNI2i7B2lQOtO3fhzqfVovuVLOo8hzJlJGb0OUFMdnz';

  var client = new Twitter({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: user.accessToken,
    access_token_secret: user.refreshToken
  });

  module.exports.Twitter = client;
   
}


var initPassport = function(consumerKey, consumerSecret, hostname) {
  passport.use(new TwitterStrategy({
		consumerKey: consumerKey,
		consumerSecret: consumerSecret,
    callbackURL: hostname + "auth/twitter/callback"
   },
// Call back when user logs in
   function(accessToken, refreshToken, profile, done) {
    console.log("accessToken :" + accessToken)
    console.log("refreshToken :" + refreshToken)


   User.findOne({ oauthID: profile.id }, function(err, user) {
  	 if(err) { console.log(err); }
     // if he has already logged in, we retrieve it
  	 if (!err && user != null && user.screen_name) {
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      user.ego_id = profile.id;
      initTwitter(consumerKey, consumerSecret, user);
      user.save(function(err) {
         if(err) { 
           console.log(err); 
         } else {
           console.log("saving user ..." + util.inspect(user));
           done(null, user);
         };
       });
  		 done(null, user);
  	 } 
     // otherwise we create a new user
     else {
  		 var user = new User({
  			 oauthID: profile.id,
         name: profile.displayName,
         screen_name: profile.username,
  			 created: Date.now(),
  			 accessToken: accessToken,
  			 refreshToken: refreshToken
  		 });
       initTwitter(consumerKey, consumerSecret, user);
  		 user.save(function(err) {
  			 if(err) { 
  				 console.log(err); 
  			 } else {
  				 console.log("saving user ..." + util.inspect(user));
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
  mongoDB = mongojs.connect(uri, ["clusterings"]);
  module.exports.mongoDB = mongoDB;
}


var initPasswords = function(hostname) {
  // console.log(util.inspect(mongoose.connections[0].collections));
  PasswordStorage.findOne({ "name": "main" }, function(err, passwords) {
    if(err) { console.log(err); }
    if(!err && passwords == null) {console.log("passwords not found"); }
    else {
        var callBackURL = hostname;// + 'treatment';
        initPassport(passwords.twitterConsumerKey, passwords.twitterConsumerSecret, callBackURL);
        initMongoDB(passwords.main_mongo);
     } 
  });
};

// Retrieve password on mongo database (can only be accessed locally)

// First case : debugging on localhost
// First try if the password file exists locally (for localhost test)
var file = 'password.txt'
if (fs.existsSync(file)){
  var hostname = "http://localhost:8080/"
  fs.readFile(file, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
      password = data;
      // And connect to distant database
      mongoose.connect('mongodb://local_user:' + password + '@ds027491.mongolab.com:27491/local_mongo');
      initPasswords(hostname);
  });
}
// Second case : production 
// Connext to mongodb database that can only be accessed locally on the server
else {
  var hostname = 'http://dev-utopical.rhcloud.com/';
  mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL + "dev");
  initPasswords(hostname);
}






