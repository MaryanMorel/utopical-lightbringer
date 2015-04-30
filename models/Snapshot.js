var mongoose = require('mongoose')

var Snapshot = mongoose.model('Snapshot', {
	owner: String,
	createdAt: { type: Date, expires: 15 * 60, default: Date.now }
});

module.exports = Snapshot;