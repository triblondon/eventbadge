'use strict';

require('dotenv').load();

var ipp = require('ipp');
var printer = ipp.Printer(process.env.IPP_PRINTER_URL);

printer.execute("Get-Job-Attributes", {
	"operation-attributes-tag": {
		"job-uri": "ipp://localhost:631/jobs/67"
	}
}, function(err, res){
	console.log(res);
});
