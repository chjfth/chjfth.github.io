// If User are using IE9~IE11, remove existing css and load the IE dedicated one.
// Since IE9, document.head, and css can be dynamically added to/removed from the <head>.

var g_is_ie = false;

// Detect IE now, using code from: https://stackoverflow.com/a/20411654/151453

if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
	g_is_ie = true;
	Load_css_for_ie();
}

/////////////////////////////////////////////////////////////////////////////

function Load_css_for_ie()
{
	if(!document.head) {
		// This is IE8.
		warn_old_browser_ie();
	}
	
	// Remove original css first.
	
	var csslinks = document.head.querySelectorAll("link");
	for(var i=0; i<csslinks.length; i++) {
//		console.log(csslinks[i]);
		document.head.removeChild(csslinks[i]);
	}
	
	// Then load the one dedicated for IE.
	
	var iecss = document.createElement("link");
	iecss.href = "css_for_ie.css";
	iecss.rel = "stylesheet";
	document.head.appendChild(iecss);
	
	warn_old_browser_ie();
}

function warn_old_browser_ie()
{
	// Put a yellow banner at start of the page, suggest the user to view me
	// with Chrome or Firefox.
	
	var divwarn = document.createElement("div");
	divwarn.className = "iewarn";
	divwarn.style.cssText = "color:red";
	divwarn.innerHTML = 'This webpage is crippled with Microsoft IE. ' +
		'Please use newer browsers like Chrome (v74) or Firefox (v67) to obtain fully interactive viewing experience.';
	
	document.body.insertBefore(divwarn, document.body.firstChild);
}
