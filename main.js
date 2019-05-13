const fs = require('fs')

require('dotenv').config()

const fetch = require('node-fetch')
const moment = require('moment')
const debug = require('debug')('eventbadge:main')

const generateLabel = require('./lib/label')
const printLabel = require('./lib/print')
const webServer = require('./lib/web')
const event = require('./lib/event')

event.on('checkin', async attendee => {
  debug('Generating label', attendee)
	const label = await generateLabel({
    ...attendee,
		eventName: event.getName(),
		eventDate: event.getStartTime()
  })
	debug('Printing label', attendee)
	return printLabel(label)
})

event.init()
