# Badge printing script for eventbrite events

![Me wearing a badge](photo.jpg)

Polls the eventbrite API for new checkins.  When a person checks in for the first time, creates a PDF of a name badge, and prints it on a locally attached Brother QL-570 printer.

To run:

1. Clone
2. npm install
3. Create a `.env.json` file or set appropriate env vars (see below)
4. Make sure printer is turned on, plugged in, and is stocked with labels
5. Run `node main.js`

## Config

Configure the app via env vars as follows:

* `IPP_PRINTER_URL`: IPP URL for the printer.  Can be discovered by running `lpstat -p -d`.  Append the printer name to `ipp://localhost/printers/`.
* `EB_EVENT_ID`: Eventbrite event ID, as a string
* `EB_OAUTH_TOKEN`: Eventbrite Oauth token that has access to the above event
* `EVENT_NAME` (optional): Name of event.  If omitted, the event name from Eventbrite will be used
* `DEBUG` (optional): Configuration for the [debug](https://github.com/visionmedia/debug) node module.  To see all debug output, set to `*`.  If not set the app will produce no output.
