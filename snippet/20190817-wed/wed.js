"use strict"

const g_svg_right_arrow = '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="rgb(202,202,202)" d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"></path></svg>'

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
			<td class="corner" onclick=""></td><td>·</td> <!-- dstlen <td>s later -->
		</tr>
		<tr class="initvalues"> <!-- this row for dstword -->
			<td class="lettercells">·</td> <!-- dstword initvalues <td>s later -->
		</tr>
	`
	table.className= "agtable";
	
	// fill dstword to table's first row
	var dstword_tr = table.querySelector("tr.lettercells");
	for(var i=0; i<dstlen; i++) {
		var td = document.createElement("td");
		td.textContent = dstword[i]; // Firefox 40 does not support .innerText, so use .textContent
		dstword_tr.appendChild(td);
	}
	
	// fill initvalues for dstword to table's second row
	var dstvalue0_tr = table.querySelector("tr.initvalues");
	for(var i=0; i<=dstlen; i++) {
		 var td = document.createElement("td");
//		 td.textContent = i; // this is not required, bcz run_algorithm() will fill them.
		 dstvalue0_tr.appendChild(td);
	}
	
	// append rows for srcword, one row per src-letter
	for(var i=0; i<srclen; i++) {
		var tr = document.createElement("tr");
		
		var intr = "<td>{0}</td>".format(srcword[i]) + "<td></td>".repeat(dstlen+1);
		
		tr.innerHTML = intr;
		
		table.appendChild(tr);
	}
	
	var old_table = $1(".agtable");
	old_table.parentElement.replaceChild(table, old_table);
		
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
	
	var text = td_ele.textContent.trim();
	
	var val = text ? parseInt(text) : -1;
	
	return {ele:td_ele, val:val};
}

function get_cell_ele(table, idxsrc, idxdst) {
	var cell = get_cell(table, idxsrc, idxdst);
	return cell.ele;
}
function cell_value(table, idxsrc, idxdst) {
	
	if(idxsrc==-2 || idxdst==-2) {
		// out-of-bound, we return a very big number for later easy coding in run_algorithm()
		return 10000; 
	}
	
	var cell = get_cell(table, idxsrc, idxdst);
	return cell.val;
}

function run_algorithm(table, srcword, dstword) {
	// Fill the `table` with edit-distance "cost", according to srcword and dstword

	var srclen = srcword.length;
	var dstlen = dstword.length;

	for(var isrc=-1; isrc<srclen; isrc++)
	{	
		for(var idst=-1; idst<dstlen; idst++)
		{
			var td_now = get_cell_ele(table, isrc, idst);

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
			var minval;
			if(meet_equal)
				minval = diagv; // this is a quick optimize
			else
				minval = Math.min(leftcost, diagcost, topcost);
			
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
	
	var tmpl = document.createElement("div");
	tmpl.innerHTML = g_svg_right_arrow;
	var svgtmpl = tmpl.firstElementChild;
		// the svg graph is a left-to-right pointing arrow
	
	for(var arrow_letter of arrow_letters) {
		
		if( "LDdT".indexOf(arrow_letter)<0 )
			continue; // not a valid arrow letter
		
		var arrow_ele = svgtmpl.cloneNode(true);
		
		arrow_ele.classList.add("arrow", "arrow"+arrow_letter);

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
	
	var td_ele = get_cell_ele(table_ele, idxsrc, idxdst);
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
		for(var path of pathgen) {
			path.push(pathchar);
			yield path;
		}
	}
}

function draw_highlight_path(table_ele, stepchars) {
	
	// stepchars sample: ['T', 'd', 'T', 'd', 'D', 'L']
	// It describes the editing steps from (-1,-1) to the end.
	
	InEle_remove_matching_class(table_ele, "highlight", "Stepbold");
	
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
		
		var nextcell = get_cell_ele(table_ele, idxsrc, idxdst);
		nextcell.classList.add("highlight");
		if(stepchar!='d')
			nextcell.classList.add("Stepbold");
		
		var arrow_ele = nextcell.querySelector(".arrow"+stepchar); // ".arrowL" etc
		arrow_ele.classList.add("highlight");
	}
}

function startnew_from_editbox() {
	var ed_wordfrom = document.getElementById("wordfrom");
	var ed_wordto = document.getElementById("wordto");
	
	if(ed_wordfrom.value && ed_wordto.value) {
		edw_refresh_all_ui(ed_wordfrom.value, ed_wordto.value);
	}
	else {
		alert("Invalid input.");
	}
}

function attach_step_numbering_div(cell, iStep, cs) {
	
	var opcode=cs.code, oldc=cs.old, newc=cs.cur;
	
	// Context:
	// In UI:
	// 		From: [G][T][A][C][C][ ]
	// 
	// If cell points to second [C] above, iStep=2, and opcode="Rplc", then we'll get:
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
	
	if(opcode=="Del") {
		opcode_div.classList.add("opcode_Del");
		step_circle.title = "Delete letter " + oldc; // mouse-over tooltip
	}
	else if(opcode=="Rplc") {
		opcode_div.classList.add("opcode_Rplc");
		step_circle.title = "Replace letter {0} with {1}".format(oldc, newc);
	}
	else if(opcode=="Ins") {
		opcode_div.classList.add("opcode_Ins");
		step_circle.title = "Insert letter " + newc;
	}
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

	var draw_diff = $1(".draw_diff");
	var fromgraph = $1(".fromgraph", draw_diff);
	var tograph = $1(".tograph", draw_diff);
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
		if(cs.code=="Keep" || cs.code=="Del" || cs.code=="Rplc")
			cell.classList.add("solidx");
		else if(cs.code=="Ins")
			cell.classList.add("blankc");
		else
			alert("Error. Wrong cs.code in create_diff_chart()");

		from_flexbox.appendChild(cell);
		
		if(cs.code!="Keep") {
			iStep++;
			attach_step_numbering_div(cell, iStep, cs);
		}

		// create flex item(cell) for "To:".
		
		var cell = document.createElement("div");
		cell.textContent = cs.cur;
		
		cell.className ="expcell incenter";
		if(cs.code=="Keep")
			cell.classList.add("solidx");
		else if(cs.code=="Del")
			cell.classList.add("blankc");
		else if(cs.code=="Rplc" || cs.code=="Ins")
			cell.classList.add("solidy");
		else
			alert("Error. Wrong cs.code in create_diff_chart()");
		
		to_flexbox.appendChild(cell);
	}
	
//	console.log("draw_diff.offsetWidth="+draw_diff.offsetWidth); // debug
	var result_pane = $1(".rightpane");
	const safe_margin = 60; // px
	result_pane.style.width = (draw_diff.offsetWidth+safe_margin)+"px"; 
		// Important! See css .rightpane for reason.
}

function log_Charstates(arcs, _csadv, istep) { // only for debug purpose
	
	var msgs = [];
	for(var i=0; i<arcs.length; i++) {
		var old = arcs[i].old, cur = arcs[i].cur;
		
		var msg = "";
		
		// Comment hint: Assume old='x' and cur='y'
		
		if(old==cur) // Keep
			msg += old;                         // x
		else if(cur=='') // Del 
			msg += old+"[]";                    // x[]
		else if(old!='' && old!=cur) // Rplc
			msg += "{0}[{1}]".format(old, cur); // x[y]
		else if(old=='') // Ins
			msg += "[{0}]".format(cur);         // [y]
		
		var suffix = i==_csadv ? "*" : ""; // use * to mark current advancing mark into arcs[]
		try {
			msgs.push( (msg+suffix).padEnd(5) );
		} catch (e) {
			msgs.push( msg+suffix ); // Firefox 40 does not have .padEnd() yet.
		}
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
		arcs.push( {old:c, cur:c, code:"Keep"} ); // init state
		// Four cases('x' or 'y' represent any non-null char):
		// (S1,Keep) old='x' and cur='x' : 'x' is from srcword
		// (S2,Del ) old='x' and cur=''  : 'x' from srcword is delete(not exist in dstword)
		// (S3,Rplc) old='x' and cur='y' : 'x' from srcword is replaced by 'y' from dstword
		// (S4,Ins ) old='' and cur='y'  : 'y' is inserted from dstword
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
			arcs[csadv].code = "Rplc";
			arcs[csadv].cur = dstword[idxdst];
			idxdst++;
			csadv++;
		}
		else if(stepchar=='L') {
			// insert a char from dstword at csadv location
			arcs.splice(csadv, 0, {old:'', cur:dstword[idxdst]});
			arcs[csadv].code = "Ins";
			idxdst++;
			csadv++;
		}
		else if(stepchar=='T') {
			arcs[csadv].code = "Del";
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

function find_td_by_idxStep(table_ele, path, idxStep) {
	
	// Input path sample: ['T', 'd', 'T', 'd', 'D', 'L']
	// Note: the idxStep is the big-Step, which means we will skip 'd's.
	
	if(!idxStep) // should start with 1
		alert("idxStep wrong input in find_td_by_idxStep() !");
	
	var idxsrc=-1, idxdst=-1, advStep=0;
	for(var i=0; i<path.length; i++) {
		var stepchar = path[i];
		if(stepchar=='L')
			idxdst++;
		else if(stepchar=='T')
			idxsrc++;
		else if(stepchar=='D' || stepchar=='d')
			idxsrc++, idxdst++;
		
		if(stepchar!='d')
			advStep++;
		
		if(advStep==idxStep) {
			var td = get_cell_ele(table_ele, idxsrc, idxdst);
			return { td:td, idxsrc:idxsrc, idxdst:idxdst };
		}
	}
	return null;
}

function show_hilight2x2_box(td_ele, idxsrc, idxdst) {
	
	// show the hilight2x2 box at td_ele's position
	
	if(idxsrc<0 || idxdst<0) {
		hide_hilight2x2_box();
		return; // no need to show the box
	}
	
	var hibox = $1(".hilight2x2");
	var agcanvas = $1(".agcanvas");
	var posdiff = get_ele_xydiff(agcanvas, td_ele);
	
	hibox.style.left = "calc( {0}px - var(--agtable-td-size) - 1px )".format(posdiff.x);
	hibox.style.top = "calc( {0}px - var(--agtable-td-size) - 1px )".format(posdiff.y);
	
	hibox.style.visibility = "visible";
}

function hide_hilight2x2_box() {
	var hibox = $1(".hilight2x2");
	hibox.style.left = "0px";
	hibox.style.top = "0px";
	hibox.style.visibility = "hidden";
}

function hide_trailing_tds(table_ele, srclen, dstlen, idxsrc, idxdst) {
	// Hide <td>s after [idxsrc,idxdst].
	// We do this when user is focusing on a Step by [idxsrc,idxdst] bcz 
	// trailing/remaining cells are unrelated to current Step.
	
	for(var y=-2; y<srclen; y++) { // not optimal yet
		for(var x=-2; x<dstlen; x++) {
			if(y<=idxsrc && x<=idxdst)
				continue;
				
			var td = get_cell_ele(table_ele, y, x);
			td.classList.add("hide0");
		}
	}
}

function cancel_hide_trailing_tds(table_ele) {
	InEle_remove_matching_class(table_ele, "hide0");
}

function show_click_hint(is_show=true) {
	var hint = $1(".click_hint");
	hint.style.visibility = is_show ? "visible" : "hidden";
}

function hide_step_explain(is_click_hint=true) {
	show_click_hint(is_click_hint);
	
	hide_hilight2x2_box();
	
	var stepexplain = $1(".Step_explain");
	InEle_remove_matching_class(stepexplain, "expshow");
	
	var agtable = $1(".agtable");
	InEle_remove_matching_class(agtable, "dashedboxT", "dashedboxL", "dashedboxD");
}

function explain_single_Step(table, srcword_all, dstword_all, idxsrc, idxdst) {
	
	var parent = $1(".Step_explain");
	
	var is_same = srcword_all[idxsrc]==dstword_all[idxdst];
	
	var expcase;
	if(idxdst<0)
		expcase = "EdgeL";
	else if(idxsrc<0)
		expcase = "EdgeT";
	else if(is_same)
		expcase = "Diag0";
	else
		expcase = "Diag1";
	
	hide_step_explain(false); 
	
	// Show matching explain <divs> by expcase.
	var eles = $("*", parent);
	for(var ele of eles) {
		if(ele.classList.contains(expcase))
			ele.classList.add("expshow");
	}
	
	var curcell = get_cell(table, idxsrc, idxdst);
	var stepcount = curcell.val;
	show_hilight2x2_box(curcell.ele, idxsrc, idxdst);

	var cellT = get_cell(table, idxsrc-1, idxdst);
	var stepcountT = cellT.val;
	var stepcountTT = stepcountT+1;
	//
	var cellL = get_cell(table, idxsrc, idxdst-1);
	var stepcountL = cellL.val;
	var stepcountLL = stepcountL+1;
	//
	var cellD = get_cell(table, idxsrc-1, idxdst-1);
	var stepcountD = cellD.val;
	var stepcountDD = stepcountD + (is_same ? 0 : 1);
	//
	if(idxsrc>=0 && idxdst>=0) {
		cellT.ele.classList.add("dashedboxT");
		cellL.ele.classList.add("dashedboxL");
		cellD.ele.classList.add("dashedboxD");
	}
	
	var _srcword = srcword_all.substring(0, idxsrc); // srcword except the final letter
	var srcword_ = srcword_all.substring(idxsrc, idxsrc+1);  // srcword's final letter
	var _srcword_ = _srcword + srcword_; // so they combine into srcword
	
	var _dstword = dstword_all.substring(0, idxdst);
	var dstword_ = dstword_all.substring(idxdst, idxdst+1);
	var _dstword_ = _dstword + dstword_;
	
	InEle_set_html_by_class(parent, "_srcword", _srcword);
	InEle_set_html_by_class(parent, "srcword_", srcword_);
	InEle_set_html_by_class(parent, "_srcword_", _srcword_);
	//
	InEle_set_html_by_class(parent, "_dstword", _dstword);
	InEle_set_html_by_class(parent, "dstword_", dstword_);
	InEle_set_html_by_class(parent, "_dstword_", _dstword_);

	InEle_set_html_by_class(parent, "stepcount", stepcount);
	InEle_set_html_by_class(parent, "stepcountT", stepcountT);
	InEle_set_html_by_class(parent, "stepcountTT", stepcountTT);
	InEle_set_html_by_class(parent, "stepcountL", stepcountL);
	InEle_set_html_by_class(parent, "stepcountLL", stepcountLL);
	InEle_set_html_by_class(parent, "stepcountD", stepcountD);
	InEle_set_html_by_class(parent, "stepcountDD", stepcountDD);
}

function Steps_count_each_ops(stepchars) {
	// Input stepchars sample: ['T', 'd', 'T', 'd', 'D', 'L']
	var opcounts = { "Delete":0, "Insert":0, "Replace":0 };
	for(var c of stepchars) {
//		opcounts[c] = (opcounts[c] || 0) + 1;
		if(c=='T')
			opcounts["Delete"]++;
		else if(c=='L')
			opcounts["Insert"]++;
		else if(c=='D')
			opcounts["Replace"]++;
		else if(c!='d')
			alert("Unexpected stepchar ('{0}') in Steps_count_each_ops()".format(c));
	}
	return opcounts;
}

function desc_Stepcount(stepchars) {
	var opcounts = Steps_count_each_ops(stepchars);
	var desc = "Delete:{0} Insert:{1} Replace:{2}".format(
		opcounts["Delete"], opcounts["Insert"], opcounts["Replace"]);
	return desc;
}

function on_click_stepcircle(circle_ele, idxpath, stepchars, prev, ro) {

	if(!circle_ele.classList.contains("step_circle"))
		return;
	
	var idxStep = parseInt(circle_ele.textContent);
	if(!idxStep) // should >0
		alert("Wrong idxStep value in Step circle click listener!");

	console.log("Click on Step circle #{0}-{1}".format(idxpath+1, idxStep));

	if(prev.td) {
		prev.td.classList.remove("Step_flashing");
	}
	if(prev.circle) {
		prev.circle.classList.remove("Step_flashing");
	}
	cancel_hide_trailing_tds();

	if(circle_ele==prev.circle) {
		// user clicks it again, it means turning off the flashing, so return
		prev.td = null;
		prev.circle = null;
		hide_step_explain();
		return;
	}
	
	var flashing = find_td_by_idxStep(ro.table, stepchars, idxStep);
	flashing.td.classList.add("Step_flashing");
	
	circle_ele.classList.add("Step_flashing");
	
	hide_trailing_tds(ro.table, ro.srclen,ro.dstlen, flashing.idxsrc,flashing.idxdst);
	
	explain_single_Step(ro.table, ro.srcword,ro.dstword, flashing.idxsrc,flashing.idxdst);
	
	////
	prev.td = flashing.td;
	prev.circle = circle_ele;
}

function on_hovering_stepcircle(event, table, stepchars) {
	var circle_ele = event.target;
	var evttype = event.type;
//	console.log(">>> "+event.type);

	if(!circle_ele.classList.contains("step_circle"))
		return;

	var idxStep = parseInt(circle_ele.textContent);
	var focusing = find_td_by_idxStep(table, stepchars, idxStep);
	
	if(evttype=="mouseover") {
	var curcell = get_cell(table, focusing.idxsrc, focusing.idxdst);
		show_hilight2x2_box(curcell.ele, focusing.idxsrc, focusing.idxdst);
	}
	else if(evttype=="mouseout") {
		hide_hilight2x2_box();
	}
}

function edw_refresh_all_ui(srcword, dstword, idxpath=0) { // old name: draw_edw_table()
	
//	var agcanvas = $(".agcanvas");
	var srclen = srcword.length;
	var dstlen = dstword.length;
	
	hide_step_explain();
	
	var table = create_table_skeleton(srcword, dstword); // table is the HTML <table> ele
	
	run_algorithm(table, srcword, dstword);
	
	var tds = table.querySelectorAll("td");
	for(var td of tds) {
		td_draw_path_arrows(td);
	}

	var minsteps = cell_value(table, srclen-1, dstlen-1); // return a number

	var paths = [];
	var pathgen = find_editing_paths(table, srclen-1, dstlen-1);
	for(var path of pathgen) {
//		console.log(path); // debug
		paths.push(path);
	}

	if(idxpath>=paths.length) {
		alert("The path# parameter({0}) from URL exceeds total path count({1}), I'll use path#0 instead.".format(
			idxpath+1, paths.length));
		idxpath = 0;
	}

	draw_highlight_path(table, paths[idxpath]);
	
	var draw_diff = $1(".draw_diff"); 
	var fromgraph_new = replace_old_ele_by_class("fromgraph", draw_diff);
		// Always get a fresh-new .fromgraph element here.
		// This must be called *before* explain_edw_steps(), so that 
		// explain_edw_steps() will see a fresh-new .fromgraph element.
	
	explain_edw_steps(srcword, dstword, paths[idxpath]);
	
	// Fill result into right pane.
	$1(".rev_minsteps").textContent = minsteps;
	$1(".rev_pathcount").textContent = paths.length;

	// We need to create a NEW combobox(replacing the old), so that the NEW combobox 
	// will always refer to the NEW `table` ele. (Same for draw_diff below)
	var pathcombo = replace_old_ele_by_class("choosepath");
	
	for(var i=0; i<paths.length; i++) {
		var opt = document.createElement("option");
		opt.value = i;
		opt.textContent = "Path #{0} {1}".format(i+1, desc_Stepcount(paths[i]));
		pathcombo.appendChild(opt);
	}

	var prevflashing = { td:undefined, circle:undefined }; // td_flashing_prev, circle_flashing_prev;

	pathcombo.addEventListener("change", function(event) {
		idxpath = parseInt(event.target.value);
		draw_highlight_path(table, paths[idxpath]);
		InEle_remove_matching_class(table, "Step_flashing");
		hide_step_explain();
		cancel_hide_trailing_tds();
		
		prevflashing.td = undefined, prevflashing.circle = undefined;

		explain_edw_steps(srcword, dstword, paths[idxpath]);
	});
	
	//
	// Prepare for Step circle clicking.
	//
	var ro = { table:table, srcword:srcword, dstword:dstword, srclen:srclen, dstlen:dstlen}; // ro: (read-only)
		// todo: can I pass these easily? as a full closure object?
	//
	fromgraph_new.addEventListener("click", function(event) {
		var circle_ele = event.target;
		on_click_stepcircle(circle_ele, idxpath, paths[idxpath], prevflashing, ro);
	});

	// Prepare for Step circle highlighting
	fromgraph_new.addEventListener("mouseover", function(event) {
		if(!prevflashing.circle)
			on_hovering_stepcircle(event, table, paths[idxpath]);
	});
	fromgraph_new.addEventListener("mouseout", function(event) {
		if(!prevflashing.circle)
			on_hovering_stepcircle(event, table, paths[idxpath]);
	});
}

function slide_agcanvas_into_view() {

	// When right-pane has more height than left-pane, and user scrolls down halfway,
	// we'd like to slide agcanvas(inside left-pane) into viewport to keep agcanvas visible.
	// This is done by adding agcanvas's top-margin.
	
	var lp = $1(".leftpane");
	var rp = $1(".rightpane");
	var rpc = $1(".rpcontent");
	var agcanvas = $1(".agcanvas", lp);
	var wholepage_scrollpos = get_scrollTop();
	
	if(lp.offsetLeft==rp.offsetLeft) {
		// right-pane is now wrapped to second row, so no need to slide canvas.
		return;
	}
	
	var marginpx = wholepage_scrollpos - rp.offsetTop;
	
	if( marginpx + agcanvas.offsetHeight > rpc.offsetHeight )
		marginpx = rpc.offsetHeight - agcanvas.offsetHeight;

	if(marginpx<0)
		marginpx = 0;

	agcanvas.style.marginTop = marginpx +"px";
}

function setup_copyurl() {

	var btn_copy = document.getElementById("copyurl");
	
	btn_copy.addEventListener("click", function(event) {
		event.preventDefault();
		
		var baseurl = location.href.split('?');

		// grab text of From: & To: and compose final URL.
		var strfrom = $1("#wordfrom").value;
		var strto = $1("#wordto").value;
		if(!strfrom && !strto) {
			// todo: give user a feedback.
			return;
		}
		
		var fullurl = baseurl + "?from={0}&to={1}".format(strfrom, strto);
		
		var ed_urltext = document.getElementById("urltext");
		ed_urltext.value = fullurl;
		
		ed_urltext.select();
		ed_urltext.setSelectionRange(0, 99999);
		try {
			document.execCommand("copy");
		}
		catch(e) {
			// On firefox 40, this copy operation is not allow by JS engine.
			// So give user a feed back.
			alert("Sorry, Copying to URL is not allowed by this web browser.."); 
		}
	});
}

//////////////////////////////////////////////////////////////////////////////
// Initialization code:
//////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function(){

//	alert("AAA");

	var wordfrom = get_url_variable("from", "GTACC");
	var wordto = get_url_variable("to", "TCAG");
	var idxpath = parseInt(get_url_variable("path", "1"));
	if(!idxpath) // user inputs 0 or some non-number value
		idxpath = 1;
	idxpath--; // make it zero-based
	
	var ed_wordfrom = document.getElementById("wordfrom");
	var ed_wordto = document.getElementById("wordto");
	ed_wordfrom.value = wordfrom;
	ed_wordto.value = wordto;
	
	edw_refresh_all_ui(wordfrom, wordto, idxpath);
//	edw_refresh_all_ui("Washington", "Wasingdon");
	
	// Setup [Start] button so that user can refresh with a new pair of words.
	//
	var startbtn = document.getElementById("startbtn");
	startbtn.addEventListener("click", function(event){
		event.preventDefault();
		startnew_from_editbox();
	});

	window.addEventListener("scroll", function(event){ 
		slide_agcanvas_into_view();
	});
	window.addEventListener("resize", function(event){ 
		slide_agcanvas_into_view();
	});

	setup_copyurl();

	// some debugging code
	var tdcorner = $1("td.corner");
	tdcorner.addEventListener("click", function(){ 
		// Use alert() so that I can easily see it in phone/ipad.
		alert("window.innerWidth = {0}".format(window.innerWidth));
	});
});


