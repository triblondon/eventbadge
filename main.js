'use strict';

var fs = require('fs');

var fetch = require('node-fetch');
var _ = require('lodash');
var moment = require('moment');

var generateLabel = require('./label');
var printLabel = require('./print');

var requiredEnvs = ['IPP_PRINTER_URL', 'EB_EVENT_ID', 'EB_OAUTH_TOKEN'];
var ebURL = 'https://www.eventbriteapi.com/v3/';
var minPollInterval = 3000;
var attendeeData = {};
var eventData = {};
var lastPoll;

if (fs.existsSync(__dirname+'/.env.json')) {
  var environmentOverrides = require(__dirname+'/.env.json');
  process.env = _.extend(process.env, environmentOverrides);
}

var debug = require('debug')('eventbadge:main');

requiredEnvs.forEach(function(key) {
	if (!process.env[key]) {
		console.warn(key+' must be set');
		process.exit(1);
	}
});

fetch(ebURL + "events/"+process.env.EB_EVENT_ID+"?token="+process.env.EB_OAUTH_TOKEN)
	.then(function(response) { return response.json(); })
	.then(function(data) { eventData = data; })
	.then(poll)
	.catch(function(reason) {
		console.warn(reason);
	})
;


function poll() {
	return Promise.resolve()
		.then(function() {
			var url = "https://www.eventbriteapi.com/v3/events/"+process.env.EB_EVENT_ID+"/attendees/?token="+process.env.EB_OAUTH_TOKEN;

			// Eventbrite appears to support only a subset of ISO8601 (eg. milliseconds are not supported)
			if (lastPoll) url += '&changed_since='+lastPoll.utcOffset(0).subtract(10, 'seconds').format('YYYY-MM-DD[T]HH:mm:ss[Z]');
			lastPoll = moment();
			return fetch(url).then(function(response) {
				return response.json();
			}).then(function(data) {
				if (!data.attendees) return Promise.reject(data);
				debug('Attendees changed: %d', data.attendees.length);
				return data.attendees.map(function(attendee) {
					return {
						givenName: attendee.profile.first_name,
						familyName: attendee.profile.last_name,
						email: attendee.profile.email,
						checkedIn: attendee.checked_in
					};
				});
			});
		})
		.then(function(attendees) {
			return Promise.all(
				attendees.filter(function(attendee) {
					var existing = attendeeData[attendee.email];
					return (attendee.checkedIn && (!existing || !existing.checkedIn));
				}).map(function(attendee) {
					debug('Generating label for: '+attendee.givenName+' '+attendee.familyName);
					attendeeData[attendee.email] = attendee;
					return generateLabel(_.extend({}, attendee, {
						eventName: process.env.EVENT_NAME || eventData.name.text,
						eventDate: eventData.start.utc
					}));
				})
			);
		})
		.then(function(labels) {
			if (labels.length) {
				debug('Printing '+labels.length+' labels');
				return Promise.all(labels.map(printLabel));
			}
		})
		.then(function() {

			// Stop polling if event is over
			if (moment(eventData.end.utc).isBefore(moment())) return true;

			// Poll again at least minPollInterval mseconds after the previous poll
			var delayRequired = Math.max(0, (minPollInterval - moment().diff(lastPoll)));
			if (delayRequired) {
				debug('Waiting for '+delayRequired+'ms');
				return new Promise(function(resolve) {
					setTimeout(function() {
						resolve(poll());
					}, delayRequired);
				});
			} else {
				return poll();
			}
		})
		.catch(function(reason) {
			if (reason.status_code === 429) {
				console.log('Encountered Eventbrite rate limit.  See http://developer.eventbrite.com/doc/getting-started/ for more details.');
			} else {
				console.log(reason.stack || reason);
			}
		})
	;
}
