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

	for(var isrc=0; isrc<srclen; isrc++)
	{	
		for(var idst=0; idst<dstlen; idst++)
		{
			var td_now = get_cell(table, isrc, idst);

			var leftv = cell_value(table, isrc, idst-1); //left-side cell value
			var diagv = cell_value(table, isrc-1, idst-1); // diagonal cell value
			var topv  = cell_value(table, isrc-1, idst); // top-side cell value
			
			var leftcost = leftv + 1;
			var diagcost = diagv + (srcword[isrc]==dstword[idst] ? 0 : 1);
			var topcost  = topv + 1;
			
			// Now we'll pick the minimum ones from the three cost values.
			// as feasible editing step.
			var minval = Math.min(leftcost, diagcost, topcost);
			td_now.textContent = minval;
			
			// More than one path can produce the same min value, 
			// we record them all in "pathchars" html element attribute.
			
			var pathchars = "";
			if(leftcost==minval) {
				pathchars += "L"; // Left
			}
			if(diagcost==minval) {
				pathchars += "D"; // Diagonal
			}
			if(topcost==minval) {
				pathchars += "T"; // Top
			}
			
			td_now.setAttribute("pathchars", pathchars);
			
		} // inner for
	} // outer for
}

function td_draw_path_arrows(td_ele) {
	
	var arrow_letters = td_ele.getAttribute("pathchars"); // e.g. "LDT", "LD"
	if(!arrow_letters)
		return;
	
	for(var arrow_letter of arrow_letters) {
		
		if( "LDT".indexOf(arrow_letter)<0 )
			continue; // not a valid arrow letter
		
		var arrow_dir_class = "arrow" + arrow_letter;
		
		var arrow_ele = document.createElement("div");
		arrow_ele.className = "arrow " + arrow_dir_class;
		
		td_ele.appendChild(arrow_ele);
	}
}

function draw_edw_table(srcword, dstword) {
	
	var srclen = srcword.length;
	var dstlen = dstword.length;
	
	var table = create_table_skeleton(srcword, dstword); // table is the HTML <table> ele
	
	run_algorithm(table, srcword, dstword);
	
	var tds = table.querySelectorAll("td");
	for(var td of tds) {
		td_draw_path_arrows(td);
	}
}

//////////////////////////////////////////////////////////////////////////////
// Initialization code:
//////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function(){

//	alert("AAA");

	draw_edw_table("GCTAC", "CTCA");
	
});


