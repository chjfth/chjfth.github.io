"use strict"


function create_table_skeleton(srcword, dstword) {
	
	var srclen = srcword.length;
	var dstlen = dstword.length;
	
	// table dimension will be [srclen+2] * [dstlen+2] 
	
	var table = document.createElement("table");
	table.innerHTML = `
		<colgroup>
			<col class="lettercells"></col><col class="initvalues"></col>
		</colgroup>
		<tr class="lettercells">
			<td class="hidden"></td><td>·</td> <!-- dstlen <td>s later -->
		</tr>
		<tr class="initvalues"> <!-- this row for dstword -->
			<td class="lettercells">·</td> <!-- dstword initvalues <td>s later -->
		</tr>
	`
	table.className= "table1";
	
	// fill dstword to table's first row
	var dstword_tr = table.querySelector("tr.lettercells");
	for(var i=0; i<dstlen; i++) {
		var td = document.createElement("td");
		td.innerText = dstword[i];
		dstword_tr.appendChild(td);
	}
	
	// fill initvalues for dstword to table's second row
	var dstvalue0_tr = table.querySelector("tr.initvalues");
	for(var i=0; i<=dstlen; i++) {
		 var td = document.createElement("td");
		 td.innerText = i;
		 dstvalue0_tr.appendChild(td);
	}
	
	// append rows for srcword, one row per src-letter
	for(var i=0; i<srclen; i++) {
		var tr = document.createElement("tr");
		
		var intr = "<td>{0}</td><td>{1}</td>".format(srcword[i], i+1);
		intr += "<td></td>".repeat(dstlen);
		
		tr.innerHTML = intr;
		
		table.appendChild(tr);
	}
	
	var agcanvas = document.querySelector(".agcanvas"); // algorithm canvas
	agcanvas.innerHTML = ""; // clear canvas
	agcanvas.appendChild(table)
		
	return table;
}

function get_cell(table, idxsrc, idxdst) {
	
	// The input `idx` is the letter index of the user input-string.
	// Example: (0,0) means the top-left corner *white* cell.
	// (-1,-1), (3,-1) etc may be used to index those "initial" values.
	//
	// idxsrc is y-axis, idxdst is x-axis 
	
	var tr_eles = table.querySelectorAll("tr");
	var tr_ele  = tr_eles[2+idxsrc];
	var td_eles = tr_ele.querySelectorAll("td");
	var td_ele  = td_eles[2+idxdst];
	
	return td_ele;
}

function cell_value(table, idxsrc, idxdst) {
	
	if(idxsrc==-2 || idxdst==-2) {
		// out-of-bound, we return a very big number for later easy coding
		return 10000; 
	}
	
	var td_ele = get_cell(table, idxsrc, idxdst);
	
	if(td_ele.textContent.trim()=="")
		return -1; // as null value
	
	var val = parseInt( td_ele.textContent );
	return val;
}

function run_algorithm(table, srcword, dstword) {
	// Fill the `table` with edit-distance "cost", according to srcword and dstword

	var srclen = srcword.length;
	var dstlen = dstword.length;

	for(var isrc=-1; isrc<srclen; isrc++)
	{	
		for(var idst=-1; idst<dstlen; idst++)
		{
			var td_now = get_cell(table, isrc, idst);

			if(isrc==-1 && idst==-1) {
				td_now.textContent = "0";
				continue;
			}

			var leftv = cell_value(table, isrc, idst-1); //left-side cell value
			var diagv = cell_value(table, isrc-1, idst-1); // diagonal cell value
			var topv  = cell_value(table, isrc-1, idst); // top-side cell value
			
			var meet_equal = srcword[isrc]==dstword[idst];
			
			var leftcost = leftv + 1;
			var diagcost = diagv + (meet_equal ? 0 : 1);
			var topcost  = topv + 1;
			
			// Now we'll pick the minimum ones from the three cost values.
			// as feasible editing step.
			var minval = Math.min(leftcost, diagcost, topcost);
			td_now.textContent = minval;
			
			// More than one path can produce the same min value, 
			// we record them all in "pathchars" html element attribute.
			
			var pathchars = "";
			if(leftcost==minval) {
				pathchars += 'L'; // Left
			}
			if(diagcost==minval) {
				pathchars += meet_equal ? 'd' : 'D'; // Diagonal
			}
			if(topcost==minval) {
				pathchars += 'T'; // Top
			}
			
			td_now.setAttribute("pathchars", pathchars);
			
		} // inner for
	} // outer for
}

function td_draw_path_arrows(td_ele) { // operate one <td>
	
	var arrow_letters = td_ele.getAttribute("pathchars"); // e.g. "LDT", "LD"
	if(!arrow_letters)
		return;
	
	for(var arrow_letter of arrow_letters) {
		
		if( "LDdT".indexOf(arrow_letter)<0 )
			continue; // not a valid arrow letter
		
		var arrow_dir_class = "arrow" + arrow_letter;
		
		var arrow_ele = document.createElement("div");
		
		arrow_ele.innerHTML = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="long-arrow-alt-right" class="svg-inline--fa fa-long-arrow-alt-right fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="rgb(202,202,202)" d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"></path></svg>'
			// the svg graph is a left-to-right pointing arrow
		
		arrow_ele.className = "arrow " + arrow_dir_class;
		
		td_ele.appendChild(arrow_ele);
	}
}

function *find_editing_paths(table_ele, idxsrc, idxdst) {
	// Find a editing path from srcword[0:idxsrc+1] to dstword[0:idxdst+1] .
	//
	// This should be called AFTER td_draw_path_arrows() for table_ele,
	// bcz it relies on "pathchars" attributes on <td> eles in table_ele.
	//
	// May return multiple paths, bcz pathchars may contain more than one char("LDT" etc).
	// Each yield returns a path.
	//
	// A path is an array of pathchars, like ['T', 'd', 'T', 'd', 'D', 'L'] .
	// The array content is in forward order.
	
	if(idxsrc==-1 && idxdst==-1) {
		yield [];
		return;
	}
	else if(idxdst==-1) {
		// We're at one of the left-most yellow cells.
		yield fillArray('T', idxsrc+1);
		return;
	}
	else if(idxsrc==-1) {
		// We're at one of the top-most yellow cells.
		yield fillArray('L', idxdst+1);
		return;
	}

	// We're at one of the "normal" white cells.
	// There may be multiple arrows pointing to this cell, so we need to collect them all.
	
	var td_ele = get_cell(table_ele, idxsrc, idxdst);
	var pathchars = td_ele.getAttribute("pathchars");
	
	for(var i=0; i<pathchars.length; i++) {
		
		var pathchar = pathchars[i];
		var offset_src=0, offset_dst=0;
		
		if(pathchar=='L')
			offset_dst = -1;
		else if(pathchar=='D' || pathchar=='d')
			offset_dst = -1, offset_src = -1;
		else if(pathchar=='T')
			offset_src = -1;
		else
			alert("pathchars error!");
		
		var pathgen = find_editing_paths(table_ele, idxsrc+offset_src, idxdst+offset_dst);
		for(let path of pathgen) {
			path.push(pathchar);
			yield path;
		}
	}
}

function draw_highlight_path(table_ele, stepchars) {
	
	// stepchars sample: ['T', 'd', 'T', 'd', 'D', 'L']
	// It describes the editing steps from (-1,-1) to the end.
	
	var allarrows = $("*");
	for(var arrow of allarrows) {
		arrow.classList.remove("highlight");
	}
	
	var idxsrc=-1, idxdst=-1;
	for(var stepchar of stepchars) {
		
		if(stepchar=='L') 
			idxdst++;
		else if(stepchar=='D' || stepchar=='d')
			idxsrc++, idxdst++;
		else if(stepchar=='T')
			idxsrc++;
		else
			alert("stepchar error in draw_highlight_path()");
		
		var nextcell = get_cell(table_ele, idxsrc, idxdst);
		nextcell.classList.add("highlight");
		
		var arrow_ele = nextcell.querySelector(".arrow"+stepchar); // ".arrowL" etc
		arrow_ele.classList.add("highlight");
	}
}

function startnew_from_editbox() {
	var ed_wordfrom = document.getElementById("wordfrom");
	var ed_wordto = document.getElementById("wordto");
	
	if(ed_wordfrom.value && ed_wordto.value) {
		draw_edw_table(ed_wordfrom.value, ed_wordto.value);
	}
	else {
		alert("Invalid input.");
	}
}
	
function draw_edw_table(srcword, dstword) {
	
//	var agcanvas = $(".agcanvas");
	var srclen = srcword.length;
	var dstlen = dstword.length;
	
	var table = create_table_skeleton(srcword, dstword); // table is the HTML <table> ele
	
	run_algorithm(table, srcword, dstword);
	
	var tds = table.querySelectorAll("td");
	for(var td of tds) {
		td_draw_path_arrows(td);
	}

	var minsteps = cell_value(table, srclen-1, dstlen-1); // return number

	var paths = [];
	var pathgen = find_editing_paths(table, srclen-1, dstlen-1);
	for(let path of pathgen) {
//		console.log(path); // debug
		paths.push(path);
	}

	draw_highlight_path(table, paths[0]);
	
	// Fill result into right pane.
	$1(".rev_minsteps").textContent = minsteps;
	$1(".rev_pathcount").textContent = paths.length;

	// We need to create a NEW combobox(replacing the old), so that the NEW combobox 
	// will always refer to the NEW `table` ele.
	var chpath = $1(".choosepath");
	var chpath_new = document.createElement("select");
	chpath_new.classList.add("choosepath");
	chpath.parentElement.replaceChild(chpath_new, chpath);
	chpath = chpath_new;
	
	for(var i=0; i<paths.length; i++) {
		var opt = document.createElement("option");
		opt.value = i;
		opt.textContent = "Path #{0}".format(i+1); // todo: tells howmany L,D,T respectively
		chpath.appendChild(opt);
	}

	chpath.addEventListener("change", function(event) {
		var idxpath = event.target.value;
		draw_highlight_path(table, paths[idxpath]);
	});
}


//////////////////////////////////////////////////////////////////////////////
// Initialization code:
//////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function(){

//	alert("AAA");

	var wordfrom = "GTACC"; // default
	var wordto = "TCAG"; // default

	var wordfrom_url = get_url_variable("from");
	var wordto_url = get_url_variable("to");
	
	if(wordfrom_url && wordto_url) {
		wordfrom = wordfrom_url;
		wordto = wordto_url;
	}
	
	var ed_wordfrom = document.getElementById("wordfrom");
	var ed_wordto = document.getElementById("wordto");
	ed_wordfrom.value = wordfrom;
	ed_wordto.value = wordto;
	
	draw_edw_table(wordfrom, wordto);
//	draw_edw_table("Washington", "Wasingdon");
	
	// Setup [Start] button so that user can refresh with a new pair of words.
	//
	var startbtn = document.getElementById("startbtn");
	startbtn.addEventListener("click", function(event){
		event.preventDefault();
		startnew_from_editbox();
	});

});


// from=GCTACC&to=CTCAG
