'use strict';

var fs = require('fs');

var fetch = require('node-fetch');
var moment = require('moment');
var storage = require('node-persist');

var minPollInterval = 3000;
var attendeeData;
var eventData = {};
var lastAttendeeList = moment('2000-01-01');

var debug = require('debug')('eventbadge:event');
var debugFetch = require('debug')('eventbadge:event:fetch');
var eventemitter = new (require("events").EventEmitter)();

if (!process.env.EB_EVENT_ID || !process.env.EB_OAUTH_TOKEN) {
	throw new Error('EB_EVENT_ID and EB_OAUTH_TOKEN must be specifed in the environment');
}

storage.initSync();
attendeeData = storage.getItem('attendeeData') || {};

ebRequest({})
	.then(function(data) { eventData = data; })
	.then(poll)
	.catch(function(reason) {
		console.warn(reason);
	})
;

module.exports = Object.assign(eventemitter, {
	listAttendees: function() {
		return Object.keys(attendeeData).map(function(email) {
			return attendeeData[email];
		}).sort(function(a, b) {
			return (a.familyName.toLowerCase() > b.familyName.toLowerCase()) ? 1 : -1;
		});
	},
	getName: function() { return process.env.EVENT_NAME || eventData.name.text; },
	getStartTime: function() { return moment(eventData.start.utc); }
});

function poll() {
	return Promise.resolve()
		.then(function() {
			var opts = {method:'attendees', changed_since:lastAttendeeList.utcOffset(0).subtract(10, 'seconds')};
			lastAttendeeList = moment();
			return ebRequest(opts)
			.then(function(ebattendees) {
				if (ebattendees.length) {
					debug('Attendees changed: %d', ebattendees.length);
				}
				return ebattendees.map(function(attendee) {
					return {
						id: attendee.id,
						givenName: attendee.profile.first_name,
						familyName: attendee.profile.last_name,
						email: attendee.profile.email,
						checkedIn: attendee.checked_in
					};
				});
			});
		})
		.then(function(newattendees) {
			newattendees.forEach(function(attendee) {
				var existing = attendeeData[attendee.email];
				if (attendee.checkedIn && (!existing || !existing.checkedIn)) {
					debug('checkin', attendee);
					eventemitter.emit('checkin', attendee);
				} else if (!attendee.checkedIn && existing && existing.checkedIn) {
					debug('uncheckin', attendee);
					eventemitter.emit('uncheckin', attendee);
				}
				attendeeData[attendee.email] = attendee;
				storage.setItem('attendeeData', attendeeData);
			});

			// Poll again at least minPollInterval mseconds after the previous poll
			var delayRequired = Math.max(0, (minPollInterval - moment().diff(lastAttendeeList)));
			if (delayRequired) {
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

function ebRequest(opts) {
	var responseItems = [];
	return new Promise(function(resolve) {
		function nextPage(pageno) {
			var url =
				'https://www.eventbriteapi.com/v3/events/' +
				process.env.EB_EVENT_ID +
				(opts.method ? '/'+opts.method : '') +
				'/?token=' + process.env.EB_OAUTH_TOKEN +
				(pageno ? '&page=' + pageno : '') +

				// Eventbrite appears to support only a subset of ISO8601 (eg. milliseconds are not supported)
				(opts.changed_since ? '&changed_since='+opts.changed_since.format('YYYY-MM-DD[T]HH:mm:ss[Z]') : '')
			;
			debugFetch('Fetching '+url);
			return fetch(url)
				.then(function(response) { return response.json(); })
				.then(function(data) {
					if (data.pagination) {
						responseItems = responseItems.concat(data[opts.method]);
						if (data.pagination.page_number == data.pagination.page_count) {
							resolve(responseItems);
						} else {
							nextPage((pageno || 1) + 1);
						}
					} else {
						resolve(data);
					}
				})
			;
		}
		nextPage();
	});
}
