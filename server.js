#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongojs = require("mongojs");
var http = require("http");
var path = require('path');



// var db;
// fs.readFile('password.txt', 'utf8', function (err,data) {
//   if (err) {
//     return console.log(err);
//   }
//     password = data;
//     var uri = "mongodb://nodejs:" + password + "@ds029807.mongolab.com:29807/utopical";
//     db = mongojs.connect(uri, ["tweets", "users"]);
// });


/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        self.zcache = {};
        // if (typeof self.zcache === "undefined") {
        //     self.zcache = { 'index.html': '' };
        // }

        // //  Local cache for static content.
        // self.zcache['index.html'] = fs.readFileSync('./index.html');
        // self.zcache['dev.html'] = fs.readFileSync('./dev.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };
        //var routes = require('./routes/index');


        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };


        // self.routes['/'] = function(req, res) {
        //     db.tweets.find({}, { limit : 50 }, function(e, tweets){
        //         res.render('main', {
        //             "tweets" : tweets,
        //             "tweetfeeds" : ["tweetfeed1", 
        //             "tweetfeed2", "tweetfeed3", "tweetfeed4", 
        //             "tweetfeed5", "tweetfeed6"]
        //         });
        //     });
        // };

        self.routes['/'] = function(req, res) {
                res.render('main', {
                    "tweets" : [{
                    "_id": {
                        "$oid": "55199ebbebf43b7333c2f078"
                    },
                    "source": "<a href=\"http://twitter.com\" rel=\"nofollow\">Twitter Web Client<\/a>",
                    "in_reply_to_status_id_str": null,
                    "id_str": "582562316971061248",
                    "favorite_count": 0,
                    "user": {
                        "time_zone": null,
                        "profile_sidebar_border_color": "C0DEED",
                        "name": "Jean-Luc Trémolinas",
                        "friends_count": 3,
                        "profile_image_url_https": "https://pbs.twimg.com/profile_images/575017913716842496/7iDBg8W2_normal.jpeg",
                        "follow_request_sent": false,
                        "profile_background_color": "C0DEED",
                        "notifications": false,
                        "profile_use_background_image": true,
                        "listed_count": 0,
                        "profile_link_color": "0084B4",
                        "favourites_count": 0,
                        "profile_background_tile": false,
                        "profile_background_image_url": "http://abs.twimg.com/images/themes/theme1/bg.png",
                        "verified": false,
                        "id_str": "3082237761",
                        "protected": false,
                        "entities": {
                            "description": {
                                "urls": []
                            }
                        },
                        "is_translator": false,
                        "following": true,
                        "screen_name": "JLTremolinas",
                        "location": "",
                        "default_profile": true,
                        "lang": "fr",
                        "geo_enabled": false,
                        "profile_image_url": "http://pbs.twimg.com/profile_images/575017913716842496/7iDBg8W2_normal.jpeg",
                        "utc_offset": null,
                        "contributors_enabled": false,
                        "url": null,
                        "is_translation_enabled": false,
                        "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme1/bg.png",
                        "id": 3082237761,
                        "description": "",
                        "default_profile_image": false,
                        "created_at": "Mon Mar 09 19:32:12 +0000 2015",
                        "followers_count": 1,
                        "profile_sidebar_fill_color": "DDEEF6",
                        "profile_location": null,
                        "profile_banner_url": "https://pbs.twimg.com/profile_banners/3082237761/1425930107",
                        "profile_text_color": "333333",
                        "statuses_count": 11
                    },
                    "friend": "maryanmorel",
                    "favorited": false,
                    "truncated": false,
                    "id": 582562316971061248,
                    "geo": null,
                    "entities": {
                        "hashtags": [],
                        "symbols": [],
                        "user_mentions": [
                            {
                                "screen_name": "MaryanMorel",
                                "indices": [
                                    0,
                                    12
                                ],
                                "id_str": "433689807",
                                "name": "Maryan Morel",
                                "id": 433689807
                            }
                        ],
                        "media": [
                            {
                                "media_url": "http://pbs.twimg.com/media/CBWtVxHWYAAvz8l.png",
                                "indices": [
                                    32,
                                    54
                                ],
                                "media_url_https": "https://pbs.twimg.com/media/CBWtVxHWYAAvz8l.png",
                                "id_str": "582562316287369216",
                                "sizes": {
                                    "thumb": {
                                        "w": 150,
                                        "h": 55,
                                        "resize": "crop"
                                    },
                                    "small": {
                                        "w": 273,
                                        "h": 55,
                                        "resize": "fit"
                                    },
                                    "large": {
                                        "w": 273,
                                        "h": 55,
                                        "resize": "fit"
                                    },
                                    "medium": {
                                        "w": 273,
                                        "h": 55,
                                        "resize": "fit"
                                    }
                                },
                                "expanded_url": "http://twitter.com/JLTremolinas/status/582562316971061248/photo/1",
                                "url": "http://t.co/Lxo6A4uTpX",
                                "type": "photo",
                                "id": 582562316287369216,
                                "display_url": "pic.twitter.com/Lxo6A4uTpX"
                            }
                        ],
                        "urls": []
                    },
                    "contributors": null,
                    "lang": "en",
                    "possibly_sensitive": false,
                    "in_reply_to_status_id": null,
                    "in_reply_to_user_id": 433689807,
                    "in_reply_to_user_id_str": "433689807",
                    "extended_entities": {
                        "media": [
                            {
                                "media_url": "http://pbs.twimg.com/media/CBWtVxHWYAAvz8l.png",
                                "indices": [
                                    32,
                                    54
                                ],
                                "media_url_https": "https://pbs.twimg.com/media/CBWtVxHWYAAvz8l.png",
                                "id_str": "582562316287369216",
                                "sizes": {
                                    "thumb": {
                                        "w": 150,
                                        "h": 55,
                                        "resize": "crop"
                                    },
                                    "small": {
                                        "w": 273,
                                        "h": 55,
                                        "resize": "fit"
                                    },
                                    "large": {
                                        "w": 273,
                                        "h": 55,
                                        "resize": "fit"
                                    },
                                    "medium": {
                                        "w": 273,
                                        "h": 55,
                                        "resize": "fit"
                                    }
                                },
                                "expanded_url": "http://twitter.com/JLTremolinas/status/582562316971061248/photo/1",
                                "url": "http://t.co/Lxo6A4uTpX",
                                "type": "photo",
                                "id": 582562316287369216,
                                "display_url": "pic.twitter.com/Lxo6A4uTpX"
                            }
                        ]
                    },
                    "created_at": "Mon Mar 30 15:17:34 +0000 2015",
                    "retweeted": false,
                    "in_reply_to_screen_name": "MaryanMorel",
                    "place": null,
                    "retweet_count": 0,
                    "coordinates": null,
                    "text": "@MaryanMorel pervers polymorphe http://t.co/Lxo6A4uTpX"
                }],
                    "tweetfeeds" : ["tweetfeed1", 
                    "tweetfeed2", "tweetfeed3", "tweetfeed4", 
                    "tweetfeed5", "tweetfeed6"]
                });
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        //self.app = express.createServer();
        // var express = require("express");
        self.app = express();

        // view engine setup
        self.app.set('views', path.join(__dirname, 'views'));
        self.app.set('view engine', 'jade');
        self.app.use(express.static(__dirname + '/public'));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();

        self.handleErrors();

        // self.app.use(function(req,res,next){
        //     req.db = db;
        //     next();
        // });

        self.app.locals.moment = require('moment');


    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };


self.handleErrors = function(){

        /// catch 404 and forwarding to error handler
        self.app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        /// error handlers

        // development error handler
        // will print stacktrace
        if (self.app.get('env') === 'development') {
            self.app.use(function(err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        self.app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    };


};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

