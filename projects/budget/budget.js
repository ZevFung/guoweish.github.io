var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 1200 - margin.top - margin.bottom;

var tooltip = d3.select("body").select("#tooltip");
var header = d3.select("body").select("#head");
var header1 = d3.select("body").select("#header1");
var budget = d3.select("body").select("#budget");

//scale for links width and colors
var lineWidthScale = d3.scale.linear()
		.clamp(true)
		.domain([40,250])
		.range([2,20]);

var departmentWidthScale = d3.scale.linear()
		.clamp(true)
		.domain([4,300, 500, 6000])
		.range([5,10, 20, 50]);

var colorScale = d3.scale.linear()
		.interpolate(d3.interpolateHsl)
		.clamp(true)
		.domain([8, 500, 2000])
		.range(['#9C071B', '#FEC70B', '#016B6B']);
/*		.domain([8,300, 500, 6000])
		.range(["#BA1E20", "#F79324", "#C3D181", "#38A1D6"]);*/

//number format
var formatNumber = d3.format(".2f");
    
var i = 0,
    duration = 250,
    root;

var tree = d3.layout.tree()
	    .size([height, width])
	    .value(function(d) { return d.size; }); //to see if it works for each node

var diagonal = d3.svg.diagonal()
    	.projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body")
		.select("#d3") //hooker in html for d3 svg
		.append("svg")
	    .attr("width", width + margin.right + margin.left)
	    .attr("height", height + margin.top + margin.bottom)
	    .attr("viewBox", function () {
	    	return "0,0," + (width + margin.right + margin.left) + "," + (height + margin.top + margin.bottom);
	    })
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//====loading logo=========================================
svg.append("text")
	.attr("id", "loading")
	.attr("x", width / 2)
	.attr("y", height / 2)
	.text("Loading......");

d3.csv("data/ChinaBudget-full.csv", function(error, data) {
    
    _.each(data, function(element, index, list){
        element.size = +element.size;
    });

	root = genJSON(data, ['department']);

	root.x0 = height / 2;
	root.y0 = 0;

	//*************************************************
	//computer node accumulate value of depth 1
	//*************************************************
	var level_1 = new Array();
    for (var i = 0; i < root.children.length; i++) {
    	level_1[root.children[i].name] = 0;
    	for (var j = 0; j < root.children[i].children.length; j++) {
    		level_1[root.children[i].name] += Number(root.children[i].children[j].size);
    	};
    	//console.log(root.children[i].name + " : " + level_1[root.children[i].name]);
    }
    //console.log(level_1);
    //var strName = ["交通运输", "住房保障"];

	root.children.forEach(collapse); //keep only depth 0, 1 visible
	update(root); //draw the tree

	//***transfer update() here 
	function update(source) {
		// Compute the new tree layout.
		var nodes = tree.nodes(root).reverse(),
			links = tree.links(nodes);

		// Normalize for fixed-depth.
		nodes.forEach(function(d) { d.y = d.depth * 300; });

	    // Update the nodes…
	    var node = svg.selectAll("g.node")
				.data(nodes, function(d) { return d.id || (d.id = ++i); });

	    // Enter any new nodes at the parent's previous position.
	    var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
				.on("click", click);

	    nodeEnter.append("circle")
			.attr("r", 1e-6)
			.on("mouseover", function (d) {
				showToolTip(d);
			})
			.on("mouseout", hideToolTip)
			.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

	    nodeEnter.append("text")
			.attr("x", function(d) { return d.children || d._children ? -15 : 15; })
			.attr("dy", ".35em")
			.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
			.text(function(d) { return d.name; })
			.on("mouseover", function (d) {
				showToolTip(d);
			})
			.on("mouseout", hideToolTip)
			.style("fill-opacity", 1e-6);

		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	    nodeUpdate.select("circle")
	        .attr("r", function (d) {
	        	if (d.depth === 1) {
	        		return departmentWidthScale(level_1[d.name]) / 2;
	        	} else if (d.depth === 2) {
					return lineWidthScale(d.size) / 2;
				} else if (d.depth === 0) {
					return 10;
				}
		    })
	        .style("fill", function (d) {
	        	if (d.depth === 1) {
	        		return colorScale(level_1[d.name]);
	        	} else if (d.depth === 2) {
					return colorScale(level_1[d.parent.name]);
				} else if (d.depth === 0) {
					return "#666";
				}
	        })
	        .attr("stroke", function (d) {
	        	if (d.depth === 1) {
	        		return colorScale(level_1[d.name]);
	        	} else if (d.depth === 2) {
					return colorScale(level_1[d.parent.name]);
				} else if (d.depth === 0) {
					return "#666";
				}
	        })
	        .style("stroke-opacity", function (d) {
	        	if (d.depth === 0) {
					return 0.3;
				} else {
					return 0.8;
				}
	        });

	    nodeUpdate.select("text")
	        .style("fill-opacity", 1);

	    // Transition exiting nodes to the parent's new position.
	    var nodeExit = node.exit().transition()
	        .duration(duration)
	        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
	        .remove();

	    nodeExit.select("circle")
	        .attr("r", 1e-6);

	    nodeExit.select("text")
	        .style("fill-opacity", 1e-6);

	    // Update the links…
	    var link = svg.selectAll("path.link")
	        	.data(links, function(d) { return d.target.id; });

	    // Enter any new links at the parent's previous position.
	    link.enter().insert("path", "g")
	        .attr("class", "link")
	        .attr("stroke-linecap", "round")
	        .attr("stroke", function (d) {
	        	if (d.target.depth === 1) {
	        		return colorScale(level_1[d.target.name]);
	        	} else if (d.target.depth === 2) {
					return colorScale(level_1[d.source.name]);
				}
	        })
	        .attr("stroke-width", function (d) {
	        	if (d.target.depth === 1) {
	        		return departmentWidthScale(level_1[d.target.name]) + "px";
	        	} else if (d.target.depth === 2) {
					return lineWidthScale(d.target.size) + "px";
				}
		    })
	        .attr("d", function(d) {
		        var o = {x: source.x0, y: source.y0};
		        return diagonal({source: o, target: o});
	        });

	    // Transition links to their new position.
	    link.transition()
	        .duration(duration)
	        .attr("stroke-linecap", "round")
	        .attr("stroke", function (d) {
	        	if (d.target.depth === 1) {
	        		return colorScale(level_1[d.target.name]);
	        	} else if (d.target.depth === 2) {
					return colorScale(level_1[d.source.name]);
				}
	        })
	        .attr("stroke-width", function (d) {
	        	if (d.target.depth === 1) {
	        		return departmentWidthScale(level_1[d.target.name]) + "px";
	        	} else if (d.target.depth === 2) {
					return lineWidthScale(d.target.size) + "px";
				}
		    })
	        .attr("d", diagonal);

	    // Transition exiting nodes to the parent's new position.
	    link.exit().transition()
	        .duration(duration)
	        .attr("stroke-linecap", "round")
	        .attr("stroke", function (d) {
	        	if (d.target.depth === 1) {
	        		return colorScale(level_1[d.target.name]);
	        	} else if (d.target.depth === 2) {
					return colorScale(level_1[d.source.name]);
				}
	        })
	        .attr("stroke-width", function (d) {
	        	if (d.target.depth === 1) {
	        		return departmentWidthScale(level_1[d.target.name]) + "px";
	        	} else if (d.target.depth === 2) {
					return lineWidthScale(d.target.size) + "px";
				}
		    })
	        .attr("d", function(d) {
	        var o = {x: source.x, y: source.y};
	        return diagonal({source: o, target: o});
	        })
	        .remove();

	    // Stash the old positions for transition.
	    nodes.forEach(function(d) {
		    d.x0 = d.x;
		    d.y0 = d.y;
	    });
	}

	//to remove the loading state words
	d3.select("#loading").remove();
	//********

	function collapse(d) {
	    if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}

	// Toggle children on click.
	function click(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}

		update(d);
	}

	//tooltip
	function showToolTip(d) {
	    tooltip.transition().duration(200).style("opacity", .9);

	    if (d.depth === 0) {
	        header.text("2015年中央本级预算");
	        header1.text("各部门总计");
	        budget.text("22360.52 亿元");
	    } else if (d.depth === 1) {
	        header.text(d.name);
	        header1.text("部门总计");
	        budget.text(formatNumber(level_1[d.name]) + " 亿元");
	    } else if (d.depth === 2) {
	        header.text(d.name);
	        header1.text("部门: " + d.parent.name);
	        budget.text(formatNumber(d.size) + " 亿元");
	    }

	    tooltip.style("left", (d3.event.pageX + 20) + "px").style("top", (d3.event.pageY - 10) + "px");
	}

	function hideToolTip () {
		tooltip.transition().duration(500).style("opacity", 0);
	}



});

d3.select(self.frameElement).style("height", "1200px");


//*************************************************
// THE CSV FLAT DATA TABLE 2 HIERARCHY JSON FUNCTION
//*************************************************
function genJSON(csvData, groups) {

	var genGroups = function(data) {
		return _.map(data, function(element, index) {
			return { name : index, children : element };
		});
	};

	var nest = function(node, curIndex) {
		if (curIndex === 0) {
			node.children = genGroups(_.groupBy(csvData, groups[0]));
			_.each(node.children, function (child) {
				nest(child, curIndex + 1);
			});
		}
		else {
			if (curIndex < groups.length) {
				node.children = genGroups(
					_.groupBy(node.children, groups[curIndex])
				);
				_.each(node.children, function (child) {
					nest(child, curIndex + 1);
				});
			}
		}

		return node;
	};

	return nest({}, 0);
}