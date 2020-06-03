var dataset = {
    apples: [1,1, ],
    oranges: [0, 0, 50, 50, 25, 25],
};

var width = 460,
    height = 300,
    cwidth = 25;


// d3.v3
/* 
var color = d3.scale.category20();
var pie = d3.layout.pie().sort(null);
var arc = d3.svg.arc();
*/

// d3.v4
var color = d3.scaleOrdinal(d3.schemeCategory10);
var pie = d3.pie().sort(null);
var arc = d3.arc();

var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var gs = svg.selectAll("g").data(d3.values(dataset)).enter().append("g");
var path = gs.selectAll("path")
    .data(function(d, i) {
        return pie(d).map(function(item) {
            return { "data": item, "parentIndex": i };
        });
    })
    .enter().append("path")
    .attr("fill", function(d, i) { return color(i); })
    .attr("d", function(d, i) {
        // console.log(d.data)
        return arc
            .innerRadius(10 + cwidth * d.parentIndex)
            .outerRadius(cwidth * (d.parentIndex + 1))(d.data);
    });
