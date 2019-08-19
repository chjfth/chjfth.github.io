"use strict"

const g_svg_right_arrow = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="long-arrow-alt-right" class="svg-inline--fa fa-long-arrow-alt-right fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="rgb(202,202,202)" d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"></path></svg>'

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
			<td class="corner"></td><td>·</td> <!-- dstlen <td>s later -->
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
		
		arrow_ele.innerHTML = g_svg_right_arrow;
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

function attach_step_numbering_div(cell, iStep, opcode) {
	
	// Context:
	// In UI:
	// 		From: [G][T][A][C][C][ ]
	// 
	// If cell points to second [C] above, iStep=2, and opcode="S3", then we'll get:
	//
	//		From: [G][T][A][C][C][ ]
	//		                  (2)
	//		                   ↓
	//		                   #
	//
	// I call the new div "gate" which is a absolute-positioned ele relative to `cell`.
	cell.style.position = "relative";
	
	var gate = document.createElement("div");
	gate.className = "step_gate"; // see css for its trait.
	cell.appendChild(gate);
	
	var step_circle = document.createElement("div");
	step_circle.className = "step_circle incenter";
	step_circle.textContent = iStep;
	gate.appendChild(step_circle);
	
	var down_arrow_div = document.createElement("div");
	down_arrow_div.className = "down_arrow_div";
	down_arrow_div.innerHTML = g_svg_right_arrow;
	gate.appendChild(down_arrow_div);
	
	var opcode_div = document.createElement("div");
	opcode_div.className = "opcode";
	if(opcode=="S2")
		opcode_div.classList.add("opcode_Del");
	else if(opcode=="S3")
		opcode_div.classList.add("opcode_Rplc");
	else if(opcode=="S4")
		opcode_div.classList.add("opcode_Ins");
	gate.appendChild(opcode_div);
}

function create_diff_chart(arcs) {
	
	// Yes, all info we need to create a diff-chart has been included in arcs[].
	//
	// We'll fill two flexbox here, each for one visual line.
	//   From: [ ][ ][ ][ ][ ][ ]...
	//   To:   [ ][ ][ ][ ][ ][ ]...

//	var explain_steps_ele = $1(".explain_steps");
//	var from_flexbox = $1(".fromcells", explain_steps_ele);
//	var to_flexbox = $1(".tocells", explain_steps_ele);
//	from_flexbox.innerHTML = "";
//	from_flexbox.className = "expflex";
//	to_flexbox.innerHTML = "";
//	to_flexbox.className = "expflex";

	var ag_explain = $1(".ag_explain");
	var fromgraph = $1(".fromgraph", ag_explain);
	var tograph = $1(".tograph", ag_explain);
	fromgraph.innerHTML = "";
	tograph.innerHTML = "";
	
	var from_flexbox = document.createElement("div");
	var to_flexbox = document.createElement("div");
	from_flexbox.className = "expflex";
	to_flexbox.className = "expflex";
	
	fromgraph.appendChild(from_flexbox);
	tograph.appendChild(to_flexbox);
	
	var iStep = 0; // big Step count
	for(var i=0; i<arcs.length; i++) {
		
		var cs = arcs[i];
		
		// create flex item(cell) for "From:".

		var cell = document.createElement("div");
		cell.textContent = cs.old;
		
		cell.className ="expcell incenter";
		if(cs.code=="S1" || cs.code=="S2" || cs.code=="S3")
			cell.classList.add("solidx");
		else if(cs.code=="S4")
			cell.classList.add("blankc");
		else
			alert("Error. Wrong cs.code in create_diff_chart()");

		from_flexbox.appendChild(cell);
		
		if(cs.code!="S1") {
			iStep++;
			attach_step_numbering_div(cell, iStep, cs.code);
		}

		// create flex item(cell) for "To:".
		
		var cell = document.createElement("div");
		cell.textContent = cs.cur;
		
		cell.className ="expcell incenter";
		if(cs.code=="S1")
			cell.classList.add("solidx");
		else if(cs.code=="S2")
			cell.classList.add("blankc");
		else if(cs.code=="S3" || cs.code=="S4")
			cell.classList.add("solidy");
		else
			alert("Error. Wrong cs.code in create_diff_chart()");
		
		to_flexbox.appendChild(cell);
	}
	
//	explain_steps_ele.appendChild(div_chart);
}

function log_Charstates(arcs, _csadv, istep) { // only for debug purpose
	
	var msgs = [];
	for(var i=0; i<arcs.length; i++) {
		var old = arcs[i].old, cur = arcs[i].cur;
		
		var msg = "";
		
		// Comment hint: Assume old='x' and cur='y'
		
		if(old==cur) // S1
			msg += old;                         // x
		else if(cur=='') // S2 
			msg += old+"[]";                    // x[]
		else if(old!='' && old!=cur) // S3
			msg += "{0}[{1}]".format(old, cur); // x[y]
		else if(old=='') // S4
			msg += "[{0}]".format(cur);         // [y]
		
		var suffix = i==_csadv ? "*" : ""; // use * to mark current advancing mark into arcs[]
		msgs.push( (msg+suffix).padEnd(5) );
	}
	
	console.log( "ExplainStep-{0}: ".format(istep) + msgs.join(" ") );
}

function explain_edw_steps(srcword, dstword, path) {

	// We need a Charstate(cs) object for each char during our path run.
	// Total Charstates may be longer than srcword(exactly + count of 'L's).
	// For example, aaa1234 -> 1234bbb needs 10 Charstates.
	
	// Input path sample: ['T', 'd', 'T', 'd', 'D', 'L']
	
	var arcs = []; // array of Charstate
	
	// Initialize arcs[] with srcword.
	for(var c of srcword) {
		arcs.push( {old:c, cur:c, code:"S1"} ); // init state: all chars from srcword (S1)
		// Four cases('x' or 'y' represent any non-null char):
		// (S1) old='x' and cur='x' : 'x' is from srcword
		// (S2) old='x' and cur=''  : 'x' from srcword is delete(not exist in dstword)
		// (S3) old='x' and cur='y' : 'x' from srcword is replaced by 'y' from dstword
		// (S4) old='' and cur='y'  : 'y' is inserted from dstword
	}
	
	log_Charstates(arcs, -1, 0);

	//
	// Iterate each path step.
	//
	var idxdst =0; 
	var csadv = 0; // index into arcs[]
	var istep = 0;
	for(var i=0; i<path.length; i++) {
		
		// Will modify arcs[]'s content according to stepchar.
		
		var stepchar = path[i];
		
		if(stepchar=='d') {
			idxdst++;
			csadv++;
			continue;
		}
		else if(stepchar=='D') {
			arcs[csadv].code = "S3";
			arcs[csadv].cur = dstword[idxdst];
			idxdst++;
			csadv++;
		}
		else if(stepchar=='L') {
			// insert a char from dstword at csadv location
			arcs.splice(csadv, 0, {old:'', cur:dstword[idxdst]});
			arcs[csadv].code = "S4";
			idxdst++;
			csadv++;
		}
		else if(stepchar=='T') {
			arcs[csadv].code = "S2";
			arcs[csadv].cur = '';
			csadv++;
		}
		
		istep++;
		log_Charstates(arcs, csadv-1, istep);
	}
	
	/* Sample log_Charstates() output from this function: (each call prints one line)
	
ExplainStep-0: G     T     A     C     C    
ExplainStep-1: G[]*  T     A     C     C    
ExplainStep-2: G[]   T     A[]*  C     C    
ExplainStep-3: G[]   T     A[]   C     C[A]*
ExplainStep-4: G[]   T     A[]   C     C[A]  [G]* 

	Memo: For ExplainStep-2, the '*' in A[]* means, when this (big)Step is done,
	the algorithm has processed this far for srcword. 
	
	Note: A big-Step means a true edit-distance Step, a small-step means an arrow in canvas table.
	*/
	
	var div_chart = create_diff_chart(arcs);
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
	explain_edw_steps(srcword, dstword, paths[0]);
	
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
		explain_edw_steps(srcword, dstword, paths[idxpath]);
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


