require('dotenv').config()

var ipp = require('ipp')
var printer = ipp.Printer(process.env.IPP_PRINTER_URL)

printer.execute('Get-Printer-Attributes', null, (err, res) => {
  if (err) throw err
  console.log(res['printer-attributes-tag'])
})
