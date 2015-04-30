var mongoose = require('mongoose')

// create a tweet model

// var Schema = mongoose.Schema;

// var userSchema = new Schema({
//     name: String,
//     profile_image_url_https: String,
//     id_str: String,
//     screen_name: String,
//     profile_image_url: String,
//     id: Number,
//     created_at: Date
// });
// var User = mongoose.model('user', userSchema);

// var mentionSchema = new Schema({
//     name: String,
//     screen_name: String,
//     id_str: String,
//     id: Number,
// });
// var Mention = mongoose.model('mention', mentionSchema);

// var mediaSchema = new Schema({
//     media_url: String,
//     media_url_https: String,
//     id_str: String,
//     expanded_url: String,
//     url: String,
//     type: String,
//     id: Number,
//     display_url: String       
// });
// var Media = mongoose.model('media', mediaSchema);

// var hashtagSchema = new Schema({
//     text: String,
// });
// var Hashtag = mongoose.model('hashtag', hashtagSchema);

// var urlSchema = new Schema({
//     url: String,
//     expanded_url: String,
//     display_url: String
// });
// var Url = mongoose.model('url', urlSchema);


// var tweetSchema = new Schema({
//     owner: String,
//     id: Number,
//     id_str: String,
//     user: User,
//     entities : {
//         hashtags: [Hashtag],
//         user_mentions: [Mention],
//         media: [Media],
//         urls: [Url]
//     },
//     text: String
// });



var Tweet = mongoose.model('tweet', {
    owner: String,
    created_at: Date,
    createdAt: { type: Date, expires: 20 * 60, default: Date.now },
    id: Number,
    id_str: String,
    user: {
        name: String,
        screen_name: String,
        id_str: String,
        id: Number,
        profile_image_url: String
    },
    entities : {
        hashtags: [{
            text: String,
        }],
        user_mentions: [{
            name: String,
            screen_name: String,
            id_str: String,
            id: Number,
        }],
        media: [{
            media_url: String,
            media_url_https: String,
            id_str: String,
            expanded_url: String,
            url: String,
            type: { type: String },
            id: Number,
            display_url: String     
        }],
        urls: [{
            url: String,
            expanded_url: String,
            display_url: String
        }]
    },
    text: String
});

module.exports = Tweet;
