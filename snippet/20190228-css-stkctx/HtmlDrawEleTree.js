function HtmlDrawEleTree(fromId, drawOnId, is_curvy=false)
{
	var fromEle = document.querySelector(fromId);
	var alleles = fromEle.getElementsByTagName('*');
   
	var drawcfg = {
		container: drawOnId,
		connectors: {
			type: is_curvy ? 'bCurve' : 'step', // comment out to get curvy lines
			style: { 
				'arrow-end': "classic-wide-long", 
				'stroke': "#888",
			},
		},
	};

	var fromNode = { text: { name:"roote"+fromId } };
	var chart_struct = [ drawcfg, fromNode ];
   
	// Append every ele-node info into chart_struct[].
	// Need to traverse alleles[] twice.
   
	for(var ele of alleles) {
	   
		ele_text = ele.id ? ele.id :ele.tagName.toLowerCase();
	   
		var thisnode = { 
			inptr: ele,
			parent: undefined, // pending until next traversal
			text: { name: ele_text },
		};
		ele.outptr = thisnode;
		chart_struct.push(thisnode);
	}
	//
	for(var i=2; i<chart_struct.length; i++) {
		
		var ele_parent = chart_struct[i].inptr.parentElement;
		chart_struct[i].parent = ele_parent==fromEle ? fromNode : ele_parent.outptr;
	}
	
	new Treant( chart_struct ); // call Treant API
}
