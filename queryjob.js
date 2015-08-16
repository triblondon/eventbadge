var ipp = require('ipp');
var printer = ipp.Printer("ipp://localhost/printers/Brother_QL_570");

printer.execute("Get-Job-Attributes", {
	"operation-attributes-tag": {
		"job-uri": "ipp://localhost:631/jobs/67"
	}
}, function(err, res){
	console.log(res);
});
