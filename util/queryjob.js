require('dotenv').config()

var ipp = require('ipp')
var printer = ipp.Printer(process.env.IPP_PRINTER_URL)

printer.execute('Get-Job-Attributes', {
  'operation-attributes-tag': {
    'job-uri': 'ipp://localhost:631/jobs/67'
  }
}, (err, res) => {
  if (err) throw err
  console.log(res)
})
