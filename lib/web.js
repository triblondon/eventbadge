var path = require('path');

var express = require('express');
var exphbs = require('express-handlebars');
var debug = require('debug')('eventbadge:web');
var _ = require('lodash');

var event = require('./event');
var generateLabel = require('./label');
var printLabel = require('./print');

var app = express();

var hbs = exphbs.create({
	defaultLayout: 'default',
	helpers: {
		count: function (arr) { return arr.length; }
	}
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use('/resources', express.static(__dirname + '/../public'));

app.get('/', function (req, res) {
	res.render('main', {
		eventname: event.getName(),
		arrived: event.listAttendees().filter(function(attendee) { return attendee.checkedIn; }),
		expected: event.listAttendees().filter(function(attendee) { return !attendee.checkedIn; })
	});
});
app.get('/stream', function(req, res) {
	res.set('Content-Type', 'text/event-stream');
	res.set('Cache-Control', 'no-store');
	res.set('Connection', 'keep-alive');
	res.write('retry: 10000\n\n');
	event.on('checkin', function(attendee) {
		res.write('event: checkin\n');
		res.write('data: '+attendee.id+'\n\n');
	});
	event.on('uncheckin', function(attendee) {
		res.write('event: uncheckin\n');
		res.write('data: '+attendee.id+'\n\n');
	});
});
app.post('/print/:id', function(req, res) {
	var attendee = event.getAttendee(req.params.id);
	return generateLabel(_.extend({}, attendee, {
		eventName: event.getName(),
		eventDate: event.getStartTime()
	})).then(function(label) {
		debug('Printing '+attendee.givenName+' '+attendee.familyName);
		return printLabel(label);
	}).then(function() {
		res.json(true);
	}).catch(function(reason) {
		console.log(reason.stack || reason);
		res.send(reason);
	});
});

var server = app.listen(3006, function () {
	debug('Web server listening on port %s', server.address().port);
});

module.exports = app;
