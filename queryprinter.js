var ipp = require('ipp');
var printer = ipp.Printer("ipp://localhost/printers/Brother_QL_570");

printer.execute("Get-Printer-Attributes", null, function(err, res){
	console.log(res['printer-attributes-tag']);
});
