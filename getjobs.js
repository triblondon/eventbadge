var ipp = require('ipp');
var printer = ipp.Printer("ipp://localhost/printers/Brother_QL_570");

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

/*
printer.execute("Get-Printer-Attributes", null, function(err, res){
	console.log(res);
});
*/
