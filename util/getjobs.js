'use strict';

require('dotenv').load();

var ipp = require('ipp');
var printer = ipp.Printer(process.env.IPP_PRINTER_URL);

var msg = {
	"operation-attributes-tag": {
		//use these to view completed jobs...
//			"limit": 10,
//			"which-jobs": "completed"
	}
};

printer.execute("Get-Jobs", msg, function(err, res){
	console.log(res);
});
