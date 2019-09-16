'use strict'

const fetch = require('node-fetch')
const moment = require('moment')
const storage = require('node-persist')
const debug = require('debug')('eventbadge:event')

const minPollInterval = 3000
const fieldNames = {
  displayName: ['badge display name', 'display name', 'badge name', 'name for badge', 'name (for badge)'],
  company: ['company', 'affiliation', 'affiliation/company (for badge)'],
  pronoun: ['pronoun']
}

const eventemitter = new (require('events').EventEmitter)()
let storageKey
let eventID
let attendeeData
let eventData = {}
let lastPollTime = moment('2000-01-01')

if (!process.env.EB_OAUTH_TOKEN) {
  throw new Error('EB_OAUTH_TOKEN must be specifed in the environment')
}

const init = async () => {
  debug('Loading event data')
  if (process.env.EB_EVENT_ID) {
    eventID = process.env.EB_EVENT_ID
  } else {
    const events = await ebRequest('/users/me/owned_events', {
      arrayProperty: 'events',
      status: 'live'
    })

    const selectedEvent = events
      .filter(evt => moment(evt.end.utc).isAfter())
      .sort((a, b) => a.start.utc > b.start.utc ? 1 : -1)
      .pop()

    eventID = selectedEvent.id
  }

  storageKey = 'attendeeData-' + eventID
  storage.initSync()
  attendeeData = storage.getItem(storageKey) || {}

  eventData = await ebRequest('/events/' + eventID)
  debug('Selected event', eventID, eventData.name.text)
  poll()
}

const waitFor = delayMS => new Promise(resolve => setTimeout(resolve, delayMS))

const poll = async () => {
  const opts = { arrayProperty: 'attendees', changed_since: lastPollTime.utcOffset(0).subtract(60, 'seconds') }
  lastPollTime = moment()
  const data = (await ebRequest('/events/' + eventID + '/attendees', opts)) || []
  const attendees = data.map(attendee => ({
    id: attendee.id,
    givenName: attendee.profile.first_name,
    familyName: attendee.profile.last_name,
    displayName: (attendee.answers.find(o => fieldNames.displayName.includes(o.question.toLowerCase())) || {}).answer || attendee.profile.first_name,
    pronoun: (attendee.answers.find(o => fieldNames.pronoun.includes(o.question) && o.answer !== "Don't show on badge") || {}).answer,
    affiliation: (attendee.answers.find(o => fieldNames.company.includes(o.question.toLowerCase())) || {}).answer || attendee.profile.company,
    email: attendee.profile.email,
    checkedIn: attendee.checked_in
  }))
  if (attendees.length) debug('Recently changed attendee list', attendees.length)

  attendees.forEach(attendee => {
    const existing = attendeeData[attendee.id]
    if (attendee.checkedIn && (!existing || !existing.checkedIn)) {
      debug('Checkin!', attendee)
      eventemitter.emit('checkin', attendee)
    } else if (!attendee.checkedIn && existing && existing.checkedIn) {
      debug('Uncheckin!', attendee)
      eventemitter.emit('uncheckin', attendee)
    }
    attendeeData[attendee.id] = attendee
  })

  storage.setItem(storageKey, attendeeData)

  // Poll again at least minPollInterval mseconds after the previous poll
  const delayRequired = Math.max(0, (minPollInterval - moment().diff(lastPollTime)))
  if (delayRequired) await waitFor(delayRequired)
  poll()
}

const ebRequest = async (path, opts) => {
  const responseItems = []
  let nextPage = 1
  opts = opts || {}
  while (nextPage) {
    const url =
      'https://www.eventbriteapi.com/v3' + path +
      '/?token=' + process.env.EB_OAUTH_TOKEN +
      '&page=' + nextPage +
      (opts['status'] ? '&status=' + opts['status'] : '') +

      // Eventbrite appears to support only a subset of ISO8601 (eg. milliseconds are not supported)
      (opts.changed_since ? '&changed_since=' + opts.changed_since.format('YYYY-MM-DD[T]HH:mm:ss[Z]') : '')

    const response = await fetch(url)
    const data = await response.json()
    if (data.pagination) {
      const records = opts.arrayProperty ? data[opts.arrayProperty] : data
      responseItems.push(...records)
      nextPage = (data.pagination.page_number === data.pagination.page_count) ? null : nextPage + 1
    } else {
      return data
    }
  }
  return responseItems
}

module.exports = Object.assign(eventemitter, {
  listAttendees: () => {
    return Object.keys(attendeeData).map(id => attendeeData[id]).sort((a, b) => {
      return ((a.familyName || '').toLowerCase() > (b.familyName || '').toLowerCase()) ? 1 : -1
    })
  },
  getAttendee: id => attendeeData[id],
  getName: () => process.env.EVENT_NAME || eventData.name.text,
  getStartTime: () => moment(eventData.start.utc),
  init
})
