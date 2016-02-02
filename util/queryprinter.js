'use strict';

require('dotenv').load();

var ipp = require('ipp');
var printer = ipp.Printer(process.env.IPP_PRINTER_URL);

printer.execute("Get-Printer-Attributes", null, function(err, res){
	console.log(res['printer-attributes-tag']);
});
