// ---- Utility Functions ----

function addDropShadowFilter(svg, stddev = 3, xoffset = 5, yoffset = 5) {
    // adapted from http://bl.ocks.org/cpbotha/5200394

    // filters go in defs element
    var defs = svg.append("defs");

    // create filter with id #drop-shadow
    // height=130% so that the shadow is not clipped
    var filter = defs.append("filter")
        .attr("id", "drop-shadow")
        .attr('y', '-40%')
        .attr('x', '-40%')
        .attr("height", "200%")
        .attr("width", "200%");

    // SourceAlpha refers to opacity of graphic that this filter will be applied to
    // convolve that with a Gaussian with standard deviation 3 and store result
    // in blur
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", stddev)
        .attr("result", "blur");

    // translate output of Gaussian blur to the right and downwards with 2px
    // store result in offsetBlur
    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", xoffset)
        .attr("dy", yoffset)
        .attr("result", "offsetBlur");

    // overlay original SourceGraphic over translated blurred opacity by using
    // feMerge filter. Order of specifying inputs is important!
    var feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode")
        .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    return svg

}

function getAxisFormatter(units) {
    if (units == "percent") {
        return d3.format('.0%');
    } else if (units == "count") {
        return d3.format(',')
    } else if (units == "usd") {
        return function(d) { return "$" + d3.format(",.0f")(d); }
    }
}

function getLabelFormatter(units) {
    if (units == "percent") {
        return d3.format('.1%');
    } else if (units == "count") {
        return d3.format(',')
    } else if (units == "usd") {
        return function(d) { return "$" + d3.format(",.2f")(d); }
    }
}

function getMaxProperty(features_array, property) {
    let max_prop = null;
    for (let i = 0; i < features_array.length; i++) {
        let f = features_array[i].properties
        if (f[property] > max_prop) {
            max_prop = f[property]
        }
    }
    return max_prop
}

//    this.units = UNITS.filter(d => this.container.node().classList.contains(d))[0].split("=")[1];

