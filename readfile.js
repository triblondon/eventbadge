'use strict';

var ipp = require('ipp');
var fs = require('fs');

var pdf = fs.readFileSync('badge.pdf');

var printer = ipp.Printer("ipp://localhost/printers/Brother_QL_570");
	var msg = {
		"operation-attributes-tag": {
			"requesting-user-name": "Andrew",
			"job-name": "Test",
			"document-format": "application/pdf"
		},
		"job-attributes-tag":{
			"copies": 1,
			"sides": "one-sided",
			"media": "DC07",
			"orientation-requested": "landscape"
		},
		"data": pdf
	};
printer.execute("Print-Job", msg, function(err, res){
    console.log(res);
});
