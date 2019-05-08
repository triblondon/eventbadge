const path = require('path')

const express = require('express')
const exphbs = require('express-handlebars')
const SSEChannel = require('sse-pubsub')
const debug = require('debug')('eventbadge:web')

const event = require('./event')
const generateLabel = require('./label')
const printLabel = require('./print')

const app = express()
const port = process.env.PORT || 3006

const stream = new SSEChannel()
event.on('checkin', attendee => stream.publish(attendee, 'checkin'))
event.on('checkin', attendee => stream.publish(attendee, 'uncheckin'))

const hbs = exphbs.create({
  defaultLayout: 'default',
  extname: '.hbs',
  helpers: {
    count: arr => arr.length,
    date: (mmt, fmt) => mmt.format(fmt)
  }
})
app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')

app.use('/resources', express.static(path.join(__dirname, '../public')))
app.get('/stream', (req, res) => stream.subscribe(req, res))

app.get('/', (req, res) => {
  res.render('main', {
    eventName: event.getName(),
    eventDate: event.getStartTime(),
    attendees: event.listAttendees()
  })
})

app.post('/print/:id', async (req, res) => {
  try {
    const attendee = event.getAttendee(req.params.id)
    const label = await generateLabel({
      ...attendee,
      eventName: event.getName(),
      eventDate: event.getStartTime()
    })

    debug('Printing ' + attendee.givenName + ' ' + attendee.familyName)
    await printLabel(label)
    res.json(true)
  } catch (err) {
    console.log(err.stack || err.message || err)
    res.send(err)
  }
})

const server = app.listen(port, () => {
  debug('Web server listening on port %s', server.address().port)
})

module.exports = app
