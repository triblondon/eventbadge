
var source = new EventSource("stream");

source.addEventListener("checkin", function(e) {
	var attendeeID = e.data;
	document.getElementById('attendee-'+attendeeID).classList.add('checked-in');
}, false);

source.addEventListener("uncheckin", function(e) {
	var attendeeID = e.data;
	document.getElementById('attendee-'+attendeeID).classList.remove('checked-in');
}, false);

document.addEventListener('click', function(e) {
	if (e.target.matches('.print-btn')) {
		var button = e.target;
		e.preventDefault();
		button.classList.add('activity');
		fetch(button.dataset.href)
			.then(function(stream) {
				return stream.json();
			})
			.then(function(result) {
				if (result === true) {
					button.classList.remove('activity');
				} else {
					console.log(result);
				}
			})
		;
	}
});
