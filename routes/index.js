var path = require("path");

exports.index = function(req, res){
  res.render('login', { title: "Passport-Examples"});
};

exports.ping = function(req, res){
  res.send("pong!", 200);
};