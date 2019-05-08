require('dotenv').config()

var ipp = require('ipp')
var printer = ipp.Printer(process.env.IPP_PRINTER_URL)

var msg = {
  'operation-attributes-tag': {
    // use these to view completed jobs...
    // "limit": 10,
    // "which-jobs": "completed"
  }
}

printer.execute('Get-Jobs', msg, (err, res) => {
  if (err) throw err
  console.log(res)
})
