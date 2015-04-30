var mongoose = require('mongoose')

// create a passwords storage model
var User = mongoose.model('PasswordStorage', {
	name: String,
	created: { type: Date, default: Date.now },
	main_mongo: String,
	twitterConsumerKey: String,
	twitterConsumerSecret: String
});

module.exports = User;

// Store passwords on mongo db 
// var passwordStorage = new PasswordStorage({
//        name: "main",
//         created: Date.now(),
//         main_mongo: "****",
//         twitterConsumerKey: "***",
//         twitterConsumerSecret: "****"
//      });
//    passwordStorage.save(function(err) {
//      if(err) { 
//        console.log(err); 
//      } else {
//        console.log("saving passwordStorage ...");
//      };
//    });