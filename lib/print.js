const ipp = require('ipp')

module.exports = async pdf => {

	if (!process.env.IPP_PRINTER_URL) {
		throw new Error('No printing destination set.  To print, set the IPP_PRINTER_URL environment variable')
	}

  const printer = ipp.Printer(process.env.IPP_PRINTER_URL)
  const msg = {
    "operation-attributes-tag": {
      "requesting-user-name": "Event badge",
      "job-name": "badge",
      "document-format": "application/pdf"
    },
    "job-attributes-tag":{
      "copies": 1,
      "sides": "one-sided",

      // This string caused a world of pain.  It's not listed in the
      // media-supported section of the ipp printer attributes response,
      // and it's not what CUPS lists on the admin UI when you choose
      // 62x100mm as the default page size.  Found it by:
      // 1. printing from Preview using the OSX print dialog
      // 2. finding the print job number in the CUPS web UI
      // 3. viewing the spool file in /var/spool/cups (as root)
      // 4. finding the 'media' property, which was set to 'DC07'
      "media": "DC07",
      "orientation-requested": "landscape"
    },
    "data": pdf
  }

  const result = await new Promise(resolve => {
    printer.execute("Print-Job", msg, (err, res) => {
      if (!err && res.statusCode === 'successful-ok') {
        resolve(res['job-attributes-tag']['job-uri'])
      } else {
        throw err
      }
    })
  })

}
