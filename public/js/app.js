
var source = new EventSource("/stream");
var layoutTimer;
var cont;
var popMessages = [
	"Commendable",
	"Nice one",
	"Good job",
	"Highly performant",
	"Exemplary",
	"Cooking with gas",
	"Right on",
	"Bravo Zulu",
	"Hooah",
	"First class",
	"Cracking",
	"Outstanding",
	"Tip top",
	"Rad",
	"Capital",
	"Marvellous",
	"Smashing",
	"Nicely done"
];

function layout() {
	cont.classList.remove('rendered');
	clearTimeout(layoutTimer);
	layoutTimer = setTimeout(function() {

		var itemCount = document.querySelectorAll('.attendee').length;
		var contWidth = cont.offsetWidth;
		var contHeight = cont.offsetHeight;
		var idealRatio = 12;
		var maxCols = 5;
		var minItemHeight = 30;
		var minItemWidth = 200;
		var fontSizeRatio = 2.5;  // px of item height for each px of font size

		var bestRatio = 0, thisRatio = 0;
		var bestColCount = 0, thisColCount = 0;
		var thisItemHeight, thisItemWidth, bestItemHeight, bestItemWidth;
		for (thisColCount=1; thisColCount<=maxCols; thisColCount++) {
			thisItemWidth = contWidth / thisColCount;
			thisItemHeight = contHeight / Math.ceil(itemCount/thisColCount);
			thisRatio = thisItemWidth / thisItemHeight;
			if (Math.abs(idealRatio - thisRatio) < Math.abs(idealRatio - bestRatio) && thisItemWidth > minItemWidth) {
				console.log('Possible', thisColCount, 'cols');
				bestRatio = thisRatio;
				bestColCount = thisColCount;
				bestItemWidth = thisItemWidth;
				bestItemHeight = thisItemHeight;
			}
		}

		cont.style.fontSize = (bestItemHeight / fontSizeRatio) + 'px';

		console.log('Best', bestColCount);
		if (!cont.classList.contains('cols-'+bestColCount)) {
			cont.classList.remove('cols-1','cols-2','cols-3','cols-4','cols-5');
			cont.classList.add('cols-'+bestColCount);
		}
		cont.classList.add('rendered');
	}, 250);
}

source.addEventListener("checkin", function(e) {
	var attendeeID = e.data;
	var attendeeEl = document.getElementById('attendee-'+attendeeID);
	var popEl = document.createElement('div');
	attendeeEl.classList.add('checked-in');
	popEl.className = 'pop pop-'+Math.ceil(Math.random()*3);
	popEl.style.top = attendeeEl.offsetTop+'px';
	popEl.style.left = attendeeEl.offsetLeft+'px';
	popEl.innerHTML = popMessages[Math.floor(Math.random()*popMessages.length)];
	popEl.addEventListener('animationend', function() {
		this.parentNode.removeChild(this);
	});
	document.body.appendChild(popEl);
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

		fetch(button.dataset.href, {method:'post'})
		.then(function(responseStream) { return responseStream.json(); })
		.then(function(result) {
			if (result === true) {
				button.classList.remove('activity');
			} else {
				console.log(result);
			}
		});
	}
});

document.addEventListener('DOMContentLoaded', function() {
	cont = document.querySelector('.attendees-list');
	layout();
});
window.addEventListener('resize', layout);
