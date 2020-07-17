// ---- Utility Functions ----

function addDropShadowFilter(svg, id, stddev = 3, xoffset = 5, yoffset = 5) {
    // adapted from http://bl.ocks.org/cpbotha/5200394

    // filters go in defs element
    var defs = svg.append("defs");

    // create filter with id #drop-shadow
    // height=200% so that the shadow is not clipped
    var filter = defs.append("filter")
        .attr("id", id)
        .classed("drop-shadow", true)
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

function getAxisTickLabelFormatter(units) {
    if (units == "percent") {
        return d3.format('.0%');
    } else if (units == "count") {
        return d3.format(',.0f')
    } else if (units == "usd") {
        return function(d) { return "$" + d3.format(",.0f")(d); }
    }
}

function getLabelFormatter(units) {
    if (units == "percent") {
        return d3.format('.1%');
    } else if (units == "count") {
        return d3.format(',.0f')
    } else if (units == "usd") {
        return function(d) { return "$" + d3.format(",d")(d); }
    }
}

function toLabels(data) {
    // data must be formatted as csv with keys after region, group, and subgroup are values
    let first_row = Object.keys(data[0]);
    if (!(first_row.includes("group"))) {
        return first_row.slice(1)
    } else if (!(first_row.includes("subgroup"))) {
        return first_row.slice(2)
    }
    return first_row.slice(3)
}

function regionTag(region) {
    return region.toLowerCase().split(' ').join('-');
}

function regionTitleCase(string, sep = "-") {
    if (!string) return "";
    var sentence = string.toLowerCase().split(sep);
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
}

function toLabelMap(labels) {
    let label_map = {};
    for (let label of labels) {
        let obj = {};
        obj.label_list = label.split(";");
        obj.label_short = obj.label_list[0].replace(/^\s+|\s+$/g, '');;
        if (obj.label_list.length == 2) {
            obj.label_long = obj.label_list.slice(1).join('').replace(/^\s+|\s+$/g, '');
        } else if (obj.label_list.length == 3) {
            obj.label_long = obj.label_list[1].replace(/^\s+|\s+$/g, '');
            obj.column = obj.label_list.slice(2).join('').replace(/^\s+|\s+$/g, '');
        }
        label_map[label] = obj;
    }
    return label_map;
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

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function insertLinebreaks(d) {
    let el = d3.select(this);
    let tspans = el.selectAll('tspan');
    var words = []
    let x = el.attr('x')
    let y = el.attr('y')
    let dy = parseFloat(el.attr('dy')) || 0
    if (tspans.empty()) {
        words = el.text().split(' ');
    } else {
        tspans.nodes().forEach(function(d) {
            words.push(d.textContent)
        })
        x = tspans.nodes()[0].getAttribute('x')
        y = tspans.nodes()[0].getAttribute('y')
        dy = parseFloat(tspans.nodes()[0].getAttribute('dy'))
        tspans.attr('x', x).attr('y', y).attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
    }

    el.text('');
    for (let i = 0; i < words.length; i++) {
        let tspan = el.append('tspan').text(words[i])
            .attr('x', x).attr('y', y).attr('dy', dy + 'em')
        // .attr('y', y)
        // .attr("text-anchor", "middle")
        // .attr("alignment-baseline", "middle");
        if (i > 0)
            tspan.attr('dy', "1.1" + 'em');
    }
}


// function wrap(text, width) {
//     text.each(function() {
//         let text = d3.select(this),
//             y = text.attr("y"),
//             x = text.attr('x'),
//             dy = parseFloat(text.attr("dy")) || 0,
//             tspans = text.selectAll('tspan'),
//             // words = tspans.empty() ? text.text().split(/\s+/).reverse() : new Array(tspans.nodes().length).map(d=>d.textContent).reverse(),
//             word,
//             line = [],
//             lineNumber = 0,
//             lineHeight = 1.1; // ems
//         // 
//         let words = [];
//         // console.log(text.text())
//         // return text;
//         if (tspans.empty()) {
//             console.log(text.text())
//             words = text.text().trim().split(/\s+/).reverse();
//         } else {
//             tspans.nodes().forEach(function(d) {
//                 words.push(d.textContent.trim())
//             })
//             x = tspans.nodes()[0].getAttribute('x')
//             dy = parseFloat(tspans.nodes()[0].getAttribute('dy'))
//             // tspans.attr('x', x).attr('y',y).attr("text-anchor", "middle")
//             //     .attr("alignment-baseline", "middle")
//         }
//         // tspans.remove()
//         let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
//         console.log(words)
//         while (word = words.pop()) {
//             line.push(word);
//             tspan.text(line.join(""));
//             if (tspan.node().getComputedTextLength() > width) {
//                 line.pop();
//                 tspan.text(line.join(""));
//                 line = [word];
//                 tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
//             }
//         }
//     });
// }

function wrap(text, width, direction = 1) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = text.attr("dy") ? parseFloat(text.attr("dy")) : 0, //<-- null check
            anchor = text.attr("text-anchor"),
            baseline = text.attr('dominant-baseline'),
            tspan = null;
        // if (direction<0) {
        //     words = words.reverse();
        // }

        if (words.length == 1) {
            tspan = text.text(null).append("tspan");
            tspan.text(words[0])
                .attr("text-anchor", anchor)
                .attr("dominant-baseline", baseline)
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");

        } else {
            tspan = text.text(null).append("tspan")
                .attr("text-anchor", anchor)
                .attr("dominant-baseline", baseline)
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
            // .attr("x", x).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("text-anchor", anchor)
                        .attr("dominant-baseline", baseline)
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * lineHeight * direction + dy + "em").text(word);
                }
            }
        }
    });
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return '';
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function is_visible(id, check_ahead = 0) { // TODO : add check_behind=300
    let elem = d3.select("#" + id).node();
    let bounding = elem.getBoundingClientRect();

    // console.log(id, 'window h:', window.innerHeight, 'document h:', document.documentElement.clientHeight,
    //     bounding.top, bounding.bottom)

    let win_height = (window.innerHeight || document.documentElement.clientHeight);
    let win_width = (window.innerWidth || document.documentElement.clientWidth);

    let is_vis = (
        (
            (bounding.top > 1 && bounding.top - check_ahead <= win_height) &&
            (bounding.left > 1 && bounding.left <= win_width)
        ) ||
        (
            (bounding.bottom > 1 && bounding.bottom - check_ahead <= win_height) &&
            (bounding.right > 1 && bounding.right <= win_width)
        )
    );
    return is_vis;
}

// function processAjaxData(response, urlPath) {
//     document.getElementById("content").innerHTML = response.html;
//     document.title = response.pageTitle;
//     window.history.pushState({ "html": response.html, "pageTitle": response.pageTitle }, "", urlPath);
// }

//    this.units = UNITS.filter(d => this.container.node().classList.contains(d))[0].split("=")[1];
