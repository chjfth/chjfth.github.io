// If User are using IE9~IE11, remove existing css and load the IE dedicated one.
// Since IE9, document.head, and css can be dynamically added to/removed from the <head>.

var g_is_ie = false;

if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
	g_is_ie = true;
	Load_css_for_ie();
}

function Load_css_for_ie()
{
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
}

