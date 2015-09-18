var path = require('path');

var express = require('express');
var exphbs = require('express-handlebars');
var debug = require('debug')('eventbadge:web');

var event = require('./event');

var app = express();

app.engine('.hbs', exphbs({defaultLayout: 'default', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use('/resources', express.static(__dirname + '/../public'));

app.get('/', function (req, res) {
	res.render('main', {
		eventname: event.getName(),
		attendees: event.listAttendees()
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

var server = app.listen(3006, function () {
	debug('Web server listening on port %s', server.address().port);
});

module.exports = app;
