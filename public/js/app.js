var Attendee = React.createClass({
	handlePrintBadge: function(e) {
		console.log('Print badge for', this.props.id);
	},
	render: function() {
		var checkInStatus = this.props.checkedIn ? 'checked-in' : '';
		return (
			<li id='attendee-{this.props.id}' className='attendee {checkInStatus}'>
				<span className="icon-checkmark"></span>
				<strong>{this.props.familyName}</strong>, {this.props.givenName}
				<span className='btn icon-print' onClick={this.handlePrintBadge}></span>
			</li>
		)
	}
});

var AttendeeList = React.createClass({
	render: function() {
		var rows = [];
        this.props.attendees.forEach(function(attendee) {
        	var sortKey = (attendee.checkedIn ? '0' : '1') + attendee.familyName;
            rows.push(<Attendee
            	familyName={attendee.familyName}
            	givenName={attendee.givenName}
            	id={attendee.id}
            	checkedIn={attendee.checkedIn}
            	key={sortKey} />);
        });
		return (
			<ul className='attendees-list'>
			{rows}
			</ul>
		);
	}
})

var EventDashboard = React.createClass({
	render: function() {
		return (
			<div className='dashboard'>
				<h1>{this.props.data.eventName} <date>{this.props.data.eventDate}</date></h1>
				<AttendeeList attendees={this.props.data.attendees} />
			</div>
		);
	}
});

var data = {
	eventName: "London Web Performance",
	eventDate: "2015-11-04T19:00:00Z",
	attendees: [
		{id:1, givenName:'Andrew', familyName:'Betts', checkedIn:true},
		{id:2, givenName:'Perry', familyName:'Dyball', checkedIn:false},
		{id:3, givenName:'Matt', familyName:'Andrews', checkedIn:false},
		{id:4, givenName:'Alberto', familyName:'Alias', checkedIn:true}
	]
};

ReactDOM.render(
    <EventDashboard data={data} />,
    document.getElementById('container')
);
// ReactMagicMove

/*
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
		$.post(button.dataset.href, function(result) {
			if (result === true) {
				button.classList.remove('activity');
			} else {
				console.log(result);
			}
		});
	}
});
*/
