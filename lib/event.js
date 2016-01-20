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
var eventemitter = new (require("events").EventEmitter)();
var storageKey;
var eventID;

if (!process.env.EB_OAUTH_TOKEN) {
	throw new Error('EB_OAUTH_TOKEN must be specifed in the environment');
}

if (process.env.EB_EVENT_ID) {
	eventID = process.env.EB_EVENT_ID;
	init();
} else {
	ebRequest('/users/me/owned_events', {
		"arrayProperty": "events",
		"status": "live"
	}).then(function(events) {
		var selectedEvent;
		if (events && events.length) {
			events.forEach(function(evt) {
				var notEnded = (moment(evt.end.utc) > moment());
				if (notEnded && (!selectedEvent || moment(evt.start.utc) < moment(selectedEvent.start.utc))) {
					selectedEvent = evt;
				}
			});
		}
		if (selectedEvent) {
			debug('Selected event:', selectedEvent);
			eventID = selectedEvent.id;
			init();
		} else {
			debug('No events available for checkin');
			process.exit(0);
		}
	}).catch(function(e) {
		debug(e);
	});
}

function init() {
	storageKey = 'attendeeData-'+eventID;
	storage.initSync();
	attendeeData = storage.getItem(storageKey) || {};

	ebRequest("/events/"+eventID)
		.then(function(data) {
			eventData = data;
		})
		.then(poll)
		.catch(function(err) {
			debug(err);
		})
	;
}

function poll() {
	return Promise.resolve()
		.then(function() {
			var opts = {arrayProperty: "attendees", changed_since:lastAttendeeList.utcOffset(0).subtract(600, 'seconds')};
			lastAttendeeList = moment();
			return ebRequest('/events/'+eventID+'/attendees', opts)
			.then(function(ebattendees) {
				if (ebattendees.length) {
					debug('Attendees changed: %d', ebattendees.length);
					return ebattendees.map(function(attendee) {
						return {
							id: attendee.id,
							givenName: attendee.profile.first_name,
							familyName: attendee.profile.last_name,
							email: attendee.profile.email,
							checkedIn: attendee.checked_in
						};
					});
				} else {
					return [];
				}
			});
		})
		.then(function(newattendees) {
			newattendees.forEach(function(attendee) {
				var existing = attendeeData[attendee.id];
				if (attendee.checkedIn && (!existing || !existing.checkedIn)) {
					debug('checkin', attendee);
					eventemitter.emit('checkin', attendee);
				} else if (!attendee.checkedIn && existing && existing.checkedIn) {
					debug('uncheckin', attendee);
					eventemitter.emit('uncheckin', attendee);
				}
				attendeeData[attendee.id] = attendee;
				storage.setItem(storageKey, attendeeData);
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

function ebRequest(path, opts) {
	var responseItems = [];
	opts = opts || {};
	return new Promise(function(resolve) {
		function nextPage(pageno) {
			var url =
				'https://www.eventbriteapi.com/v3' + path +
				'/?token=' + process.env.EB_OAUTH_TOKEN +
				(pageno ? '&page=' + pageno : '') +
				(opts['status'] ? '&status='+opts['status'] : '') +

				// Eventbrite appears to support only a subset of ISO8601 (eg. milliseconds are not supported)
				(opts.changed_since ? '&changed_since='+opts.changed_since.format('YYYY-MM-DD[T]HH:mm:ss[Z]') : '')
			;
			return fetch(url)
				.then(function(response) { return response.json(); })
				.then(function(data) {
					if (data.pagination) {
						var records = opts.arrayProperty ? data[opts.arrayProperty] : data;
						responseItems = responseItems.concat(records);
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

module.exports = Object.assign(eventemitter, {
	listAttendees: function() {
		return Object.keys(attendeeData).map(function(id) {
			return attendeeData[id];
		}).sort(function(a, b) {
			return (a.familyName.toLowerCase() > b.familyName.toLowerCase()) ? 1 : -1;
		});
	},
	getAttendee: function(id) {
		return attendeeData[id];
	},
	getName: function() { return process.env.EVENT_NAME || eventData.name.text; },
	getStartTime: function() { return moment(eventData.start.utc); }
});
