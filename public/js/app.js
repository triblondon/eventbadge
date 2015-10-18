var Attendee = React.createClass({
	handlePrintBadge: function(e) {

		// How to indicate activity?
		//button.classList.add('activity');

		fetch("/print/"+this.props.id, {method:'post'})
			.then(function(responseStream) { return responseStream.json(); })
			.then(function(result) {
				if (result === true) {
					button.classList.remove('activity');
				} else {
					console.log(result);
				}
			})
		;
	},
	render: function() {
		var attendeeClass = 'attendee ' + (this.props.checkedIn ? 'checked-in' : '');
		return (
			<li className={attendeeClass}>
				<span className="icon-checkmark"></span>
				<strong>{this.props.familyName}</strong>, {this.props.givenName}
				<button className='btn icon-print' onClick={this.handlePrintBadge}>Print</button>
			</li>
		)
	}
});

var AttendeeList = React.createClass({
	render: function() {
		var rows = [];
        this.props.attendees.forEach(function(attendee) {
            rows.push(<Attendee
            	familyName={attendee.familyName}
            	givenName={attendee.givenName}
            	id={attendee.id}
            	checkedIn={attendee.checkedIn}
            	key={attendee.id} />);
        });
        rows.sort(function(a, b) {
        	return (a.checkedIn+a.familyName > b.checkedIn+b.familyName) ? 1 : -1;
        });
		return (
			<ul className='attendees-list'>
					{rows}
			</ul>
		);
	}
})

var EventDashboard = React.createClass({
	getInitialState: function() {

		// this.state is immutable, which prevents modifying the results of Array.find in the checkin listener
		this._mutableState = {attendees:[]};

		// Need to include a skeleton to avoid treating undefined as an array in AttendeeList
		return {attendees:[]};
	},
	componentDidMount: function() {
		var source = new EventSource("stream");

		fetch('/data')
			.then(function(responseStream) { return responseStream.json(); })
			.then(function(data) {
				this.setState(data);
				this._mutableState = data;
			}.bind(this))
			.catch(function(e) { console.log(e); })
		;

		source.addEventListener("checkin", function(e) {
			var attendeeID = e.data;
			var attendee = this._mutableState.attendees.find(function(attendee) {
				return attendee.id === attendeeID;
			});
			attendee.checkedIn = true;
			this.setState(this._mutableState);
		}.bind(this), false);

		source.addEventListener("uncheckin", function(e) {
			var attendeeID = e.data;
			var attendee = this._mutableState.attendees.find(function(attendee) {
				return attendee.id === attendeeID;
			});
			attendee.checkedIn = false;
			this.setState(this._mutableState);
		}.bind(this), false);

	},
	render: function() {
		return (
			<div className='dashboard'>
				<h1>{this.state.eventName} <date>{this.state.eventDate}</date></h1>
				<AttendeeList attendees={this.state.attendees} />
			</div>
		);
	}
});

ReactDOM.render(
    <EventDashboard />,
    document.getElementById('container')
);
