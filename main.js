'use strict';

var fs = require('fs');

require('dotenv').load();
var fetch = require('node-fetch');
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('eventbadge:main');

var generateLabel = require('./lib/label');
var printLabel = require('./lib/print');
var webServer = require('./lib/web');
var event = require('./lib/event');

event.on('checkin', function(attendee) {
	debug('Generating label for: '+attendee.givenName+' '+attendee.familyName);
	return generateLabel(_.extend({}, attendee, {
		eventName: event.getName(),
		eventDate: event.getStartTime()
	})).then(function(label) {
		debug('Printing '+attendee.givenName+' '+attendee.familyName);
		return Promise.resolve();
		//return printLabel(label);
	}).catch(function(reason) {
		console.log(reason.stack || reason);
	});
});
