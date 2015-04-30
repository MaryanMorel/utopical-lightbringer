#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var http = require("http");
var path = require('path');
var util = require('util');
var routes = require('./routes');
var User = require('./models/User.js');
var Tweet = require('./models/Tweet.js');
var Snapshot = require('./models/Snapshot.js');
var auth = require('./authentication.js');
var passport = require('passport')
var async = require("async");

var SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler();

// SegfaultHandler.causeSegfault(); // simulates a buggy native module that dereferences NULL

var db;


//var zerorpc = require("zerorpc");




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

        self.app.get('/', ensureAuthenticated, routes.getSortedTweets);


        self.app.get('/login', routes.index);
        self.app.get('/logout', function(req, res){
          req.logout();
          res.redirect('/');
        });

        self.app.get('/treatment', function(req, res){
          if (self.app.work_ready){
            res.redirect('/');
          }
          else {
            if (!self.app.launched_request){
              self.app.client.invoke("sleep_and_wake", "0", function(error, result, more) {
                  console.log(result);
                  self.app.work_ready = true;
              });
              self.app.launched_request = true;
            }

            var loading_gifs = JSON.parse(fs.readFileSync('loading_gif.js', 'utf8'));
            var randomIndex = Math.floor(Math.random() * loading_gifs.length)


            res.render('progress', {
                gif: loading_gifs[randomIndex]
            });
          }
        });

        self.app.get('/auth/twitter',
          passport.authenticate('twitter'),
          function(req, res){
          });
        self.app.get('/auth/twitter/callback', 
          passport.authenticate('twitter', { failureRedirect: '/' }),
          function(req, res) {
            res.redirect('/');
          });

    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        

        self.app = express();

        // view engine setup
        self.app.configure(function() {
          self.app.set('views', __dirname + '/views');
          self.app.set('view engine', 'jade');
          //self.app.use(express.logger());
          self.app.use(express.cookieParser());
          self.app.use(express.bodyParser());
          self.app.use(express.methodOverride());
          self.app.use(express.session({ secret: 'my_precious' }));
          self.app.use(passport.initialize());
          self.app.use(passport.session());
          self.app.use(self.app.router);
          self.app.use(express.static(__dirname + '/public'));
        });

        //self.app.client = new zerorpc.Client();
       // self.app.client.connect("tcp://127.0.0.1:14242");
        self.app.work_ready = false;
        self.app.launched_request = false;

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
        self.createRoutes();
        self.handleErrors();

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
                console.log("error : " + JSON.stringify(err, null, 4));
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err,
                    title: "Error"
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        self.app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {},
                title: "Error"
            });
        });
    };


};   /*  Sample Application.  */


// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

