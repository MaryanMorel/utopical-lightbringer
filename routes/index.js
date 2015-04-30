var path = require("path");
var util = require('util');
var User = require('../models/User.js');
var Tweet = require('../models/Tweet.js');
var Snapshot = require('../models/Snapshot.js');
var auth = require('../authentication.js');
var passport = require('passport')
var async = require("async");


exports.index = function(req, res){
	res.render('login', { title: "Passport-Examples"});
};



exports.getSortedTweets = function(req, res){

	// Query to get homefeed of users (last tweets)
	var getHomeFeed = function(callback){
		auth.Twitter.get('statuses/home_timeline', {count:800} , function(error, tweets, response){
			callback(null, tweets);
		});
	};

	// Retrieve tweets storde in mongodb
	var retrieveTweets = function(callback){
		console.log("looking for {" + "owner : " + req.user.screen_name + '}')
		Tweet.find({"owner" : req.user.screen_name}, function(err, tweets){
			if (err) callback(err, null);
			else {
				console.log("retrievedTweets : " + tweets.length);
				callback(null, tweets);
			}
		});
	}

	// This create queries by clusters and limits the query length and the number of user requested by query
	var createQueries = function(clusters, maxSearchPerQuery, maxQueryLength){		
		queries = [];
		for(var i = 0; i < clusters.length; i++){
			cluster = clusters[i];
            var unJoinedQueries = cluster.map(function(screen_name){ return ("from:" + screen_name); })
			var currentStart = 0;
			var lastQuery = '';
			for (var j = 0; j < cluster.length + 1; j++){
				currentQuery = unJoinedQueries.slice(currentStart, j).join('+OR+');
				if (currentQuery.length > maxQueryLength || (j-currentStart) > maxSearchPerQuery){
					queries.push(lastQuery);
					currentStart = j-1;
                    currentQuery = unJoinedQueries.slice(currentStart, j).join('+OR+');
				}
				lastQuery = currentQuery;
			}
			queries.push(lastQuery);
		}
		return queries;
	}

	// Performs search query for a specified query
	var searchQuery = function(query){
		return function(callback){
			auth.Twitter.get('search/tweets', {q: query, count:50}, function(error, result, response){
				if (error){
					callback(error, null);
				}
				else {
					tweets = result.statuses;
					console.log('cluster #' + ' recieved :' + tweets.length + " for (" + query.length + ') ' + query);
					callback(null, tweets);
				}
			});
		}	
	};

	// strange syntax to be used in map
	var saveTweet = function(tweet){
		return function(done){
			tweet.save(function (err, tweet) {
				if (err) {
					console.log('err ' + err);
					done(err, null);
				}
				else {
					done(null, tweet.id_str);
				}
			});
		}
	};

	// Splits an array into an array of smaller arrays 
	var chunkitize = function(array, chunkSize){
		chunkedArray = []
		for (i = 0; i < array.length; i += chunkSize){
			chunkedArray.push(array.slice(i, i+chunkSize));
		}
		return chunkedArray
	}


	var n_clusters = 20;
	var createSnapshotAfter = false;

	async.waterfall([ 

		// Retrieve clusters on mongoDB
		function(callback){
			var db = auth.mongoDB;
			db.clusterings.find({nb_clusters: n_clusters, ego_id:1000}, { limit : 1 }).sort({_id:-1}, function(e, clusterings){
				if (e) callback(null, e);
				else {
					var clusters = clusterings[0].content.clusters;
					callback(null, clusters)
				}
			});
		},

		// prepare queries to get corresponding tweets
		function(clusters, callback){
			// Initialize tweedfeeds and cluster mapper
			tweetfeeds = [];
			clusterMapper = {};
			for (i = 0; i < n_clusters; i++) { 
				tweetfeeds.push([]);
				for (j = 0; j < clusters[i].length; j++){
					var name = clusters[i][j];
					clusterMapper[name] = i;
				}
			}
			// this last category is for unclassified users
			tweetfeeds.push([]);

			var getClusterSearch = [];
			getClusterSearch.push(getHomeFeed)

			Snapshot.findOne({ "owner": req.user.screen_name }, {} , { sort: { 'created_at' : -1 }}, function(err, snapshot) {
				if (err) {
					callback(err, null);
				}

				// Recent snapshot found => get only homefeed
				else if (snapshot != null && ((new Date) - snapshot.createdAt) < 15*60*1000 ){
					console.log("Snapshot found!")
					getClusterSearch.push(retrieveTweets);
					callback(null, getClusterSearch);
				}

				// No recent snapshot found => launch search
				else{
					console.log("No snapshot found");
					createSnapshotAfter = true;

					var maxSearchPerQuery = 20;
					var maxQueryLength = 400;
					var chunkedQueries = createQueries(clusters, maxSearchPerQuery, maxQueryLength);

					getClusterSearch = getClusterSearch.concat(chunkedQueries.map(searchQuery));
					callback(null, getClusterSearch);
				}
			});
		},

		// get corresponding tweets and put them in the right tweedfeed
		function(getClusterSearch, callback){
			async.parallel(getClusterSearch,
				// optional callback
				function(err, results){

					if (err) {
						callback(err, null);
					}
					else{
						allTweets = [];
						allTweets = allTweets.concat.apply(allTweets, results);
						console.log("before " + allTweets.length)

						// sort by date and remove duplicates (due to homefeed + search)
						allTweets.sort(function(a,b) { return new Date(b.created_at) - new Date(a.created_at) } );
						for(var i = 1; i < allTweets.length; ){
							if(allTweets[i-1].id_str == allTweets[i].id_str){
									allTweets.splice(i, 1);
							} else {
									i++;
							}
						}	 
						console.log("after " + allTweets.length)


						// Put each tweet in its tweetfeed
						for (j = 0; j < allTweets.length; j++){
							var tweet = allTweets[j];
							var name = tweet.user.screen_name;
							var clusterIndex = clusterMapper[name];
							if (clusterIndex){
								tweetfeeds[clusterIndex].push(tweet);
							}
							else {
								tweetfeeds[tweetfeeds.length - 1].push(tweet);
							}
							
						}

						// set rendering
						res.render('main', {
								"title" : "Utopical",
								"tweetfeeds" : tweetfeeds
						});
						callback(null, allTweets);
					}
				}
			);
		},

		// save requested tweets to mongodb to create a snapshot
		function(allTweets, callback){

			// Works faster but takes 6 times more space on mongo
			var fastButHeavy = true;

			if (createSnapshotAfter && allTweets.length > 0){
				async.waterfall([
					function(callback){
						// add owner
						allTweets = allTweets.map(function(tweet){
							tweet.owner = req.user.screen_name;
							return tweet;
						});

						if (fastButHeavy){
							batchSize = 900;
							batchedTweets = chunkitize(allTweets, batchSize);
							console.log('size ' + batchedTweets.length);
							async.parallel(
								batchedTweets.map(
									function(tweets){
										return function(callback){
											Tweet.collection.insert(tweets, callback)
										}
									}
								),
								function(err, results){
									if (err) callback(err, null);
									else callback(null, results);
								}
							);
						}
						else {
							Tweet.create(allTweets, function (err, mongoTweets) {
								if (err) callback(err, null);
								else {
									saveFunctions = mongoTweets.map(saveTweet);
									async.parallel(saveFunctions,
										function(err, results){
											if (err) callback(err, null);
											else callback(null, results);
										}
									);
								}
							});
						}
					},
					function(tweets, callback) {
						Snapshot.create({owner: req.user.screen_name}, function (err, small) {
							if (err) console.log('error while creating snapshot :' + util.inspect(err));
							else console.log("Snapshot created for : " + req.user.screen_name);
						})
					}
				]);// end waterfall
			} // end if
		} //end saving
	]); // end main waterfall
};