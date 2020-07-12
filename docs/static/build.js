import "core-js/stable";

class InitializationError extends Error {
  constructor(message) {
    super(message);
    this.name = "InitializationError";
  }
}
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
            lineHeight = 1.2, // ems
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
class BaseMap {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select("#" + container_id);
        this.url = this.container.attr("_viz_source");
        this.redirect_url = this.container.attr("_viz_redirect_url");
        this.chart_uid = container_id + "-" + this.url;
        this.container_width = parseInt(d3.select("#" + this.container_id).style("width"))
        this.container_height = parseInt(d3.select("#" + this.container_id).style("height"))
        this.width = 600;
        this.height = 600;
        this.pad = 20;
        this.svg = d3.select("#" + this.container_id)
            .append('svg')
            .attr('viewBox', "0 0" + " " + this.width + " " + this.height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .classed(this.container_id, true);

        this.tooltip = d3.select('body')
            .append("div")
            .attr('id', this.container_id + '-tooltip')
            .classed("roi-tooltip", true)
            .classed("roi-map-tooltip", true)
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("opacity", 0)


        this.tooltip.append('div')
            .classed('roi-tooltip-header', true);

        this.tooltip.append('div')
            .classed('roi-tooltip-content', true)
            .append('table')
        // this.tooltip.append('div')
        //     .classed('roi-tooltip-footer', true)

    }

    log(message) {
        if (DEBUG || false) {
            console.log(message + ": " + this.chart_uid)
        }
    }

    init() {
        this.log('initializing map')
        this.loadData();
    }

    update() {
        this.log('updating map')
    }

    loadData() {
        this.log('loading map data')
    }

    choropleth(id) {
        this.log('loading data for choropleth ' + id)
    }

}

class RegionMap extends BaseMap {
    constructor(container_id) {
        super(container_id);

        this.projection = d3.geoConicEqualArea()
            .parallels([34, 40.5])
            .rotate([120, 0]);

        this.path = d3.geoPath()
            .projection(this.projection);

        this.colors = REGION_COLORS || ["#1f77b4"];
        this.feature_obj = null;
        this.selected_region = REGION;
        this.is_choropleth = false;

    }

    on_click(d) {
        let goto = this.selectRegion.bind(this);
        let region_tag = regionTag(d.properties.region);
        this.selected_region = d.properties.region;

        this.clear_roi_tooltips();

        if (this.redirect_url) {
            window.location.href = this.redirect_url + `?region=${region_tag}`;

        } else {

            window.history.pushState(
                "", document.title,
                window.location.href.split('?')[0] + `?region=${region_tag}`
            );
            goto();
            selectTabContent(regionTag(REGION));
            resetCharts();
            updateVisibleCharts();
        }
    }

    loadData() {
        this.log('loading data')

        let that = this
        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)
        var on_click = this.on_click.bind(this)

        d3.json(that.url, function(error, ca) {
            if (error) throw error;
            that.feature_obj = topojson.feature(ca, ca.objects.data)

            that.projection.fitExtent([
                [that.pad, that.pad],
                [that.width - that.pad, that.height - that.pad]
            ], that.feature_obj)

            let nRegions = d3.max(that.feature_obj.features, d => d.properties.region_id)
            let defaultRegions = {}

            for (var i = 0; i < nRegions + 1; i++) {
                var region_features = that.feature_obj.features.filter(d => d.properties.region_id == i);
                let region = region_features[0].properties.region;
                let region_tag = regionTag(region)
                defaultRegions[region_tag] = region;
                that.svg.append("g")
                    .attr("class", `counties region_${i} ${region_tag}`)
                    .selectAll("path")
                    .data(region_features)
                    .enter().append("path")
                    .attr("d", that.path)
                    .style("fill", that.colors[region_tag])
                    .style('fill-opacity', 0.5)
                    .attr("data-region", d => d.properties.region)
                    .on('touchstart touchend click mouseover mousemove mouseout', function(d) {

                        if (d3.event.type == 'touchstart') {
                            d3.event.preventDefault();
                            d3.event.stopPropagation();
                            that.selected_region = d.properties.region;
                            return on_touch(d);

                        } else if (d3.event.type == 'touchend') {
                            d3.event.preventDefault();
                            d3.event.stopPropagation();
                            return false;

                        } else if (d3.event.type == 'click') {
                            return on_click(d);
                        } else if (d3.event.type == "mouseover") {
                            return show_tooltip(d);
                        } else if (d3.event.type == "mousemove") {
                            return move_tooltip(d);
                        } else if (d3.event.type == "mouseout") {
                            return hide_tooltip(d);
                        }
                    })
            }

            REGION_NAME_MAPPING = Object.assign(defaultRegions, REGION_NAME_MAPPING)

            if (!(REGION == "Statewide") && REGION != "") {

                that.selected_region = REGION;
                that.selectRegion();

            }

        });
    }

    selectRegion() {

        let region_id = this.feature_obj.features.filter(d => d.properties.region == this.selected_region)[0].properties.region_id,
            selected_region = d3.select("svg .counties.region_" + region_id),
            region_features = this.feature_obj.features.filter(d => d.properties.region_id == region_id);

        d3.selectAll(".active-region").classed('active-region', false);
        d3.selectAll(".countySelected").remove();

        selected_region.classed('active-region', true)
        REGION = region_features[0].properties.region;

        let bbox = selected_region.node().getBBox(),

            cx = bbox.x + bbox.width / 2,
            cy = bbox.y + bbox.height / 2,
            scaler = REGION_POP_SCALER,
            color = selected_region.selectAll('path').style('fill');

        let shadow_id = this.container_id + "_drop_shadow"

        var shadow = addDropShadowFilter(selected_region.clone(true), shadow_id, 5, 0, 0)
            .classed('countySelected', true)

            .raise()
            .selectAll('path')
            .classed('drop-shadow', true)
            .data(region_features)
            .style('fill', color)
            .style('fill-opacity', .8)
            .style('pointer-events', 'none')
            .style("filter", `url(#${shadow_id})`);

        var pop_region = selected_region.clone(true)
            .classed('countySelected', true)

            .raise()
            .selectAll('path')
            .classed('overlay', true)
            .data(region_features)
            .style('fill', color)
            .style('fill-opacity', 1)
            .style('pointer-events', 'none')
            .interrupt()
            .transition()
            .duration(50)
            .attr(
                "transform",
                "translate(" + (1 - scaler) * cx + ", " + (1 - scaler) * cy + ") scale(" + scaler + ")");
        // }
    }

    baseColors() {
        let that = this;
        this.is_choropleth = false;
        this.svg.selectAll('.legend').remove();
        d3.selectAll("#" + that.container_id + ' svg .counties path')
            .style('fill', d => that.colors[regionTag(d.properties.region)])
            .style('fill-opacity', 0.5)

        d3.selectAll("#" + that.container_id + ' svg .counties path.overlay')
            .style('fill-opacity', 1)
    }

    choroplethColors(id) {
        // id is a correctly formatted id string prefixed with "#"
        let button_element = d3.select(id);
        this.url = button_element.attr("_viz_source");
        this.units = UNITS.filter(d => d == button_element.attr('_viz_units'));
        this.unitFormatter = getAxisTickLabelFormatter(this.units);
        this.labelFormatter = getLabelFormatter(this.units);
        this.is_choropleth = true;

        let that = this;
        let lowColor = "#C2d6db",
            highColor = "#1C5463"

        let cmap = d3.scaleLinear()
            .range([d3.rgb(lowColor), d3.rgb(highColor)]);

        let data = [];

        this.log('loading choropleth data')

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.choro_labels = toLabels(data);
            that.choro_label = that.choro_labels[0]; //Object.keys(data[0]).slice(3, 4); // keys after region, group, and subgroup are values
            that.choro_label_map = toLabelMap(that.choro_labels);
            that.choro_title = that.choro_label_map[that.choro_label].label_short;
            let choro_data = data.filter(d => d.group == "All");
            that.choro_data = choro_data;

            let vmin = 1e9,
                vmax = 0;

            that.feature_obj.features
                .forEach(function(d) {
                    let obj = {};
                    let fdata = choro_data.filter(e => e.region == d.properties.region);
                    if (fdata.length == 0) {
                        console.error(`No data provided for region: ${d.properties.region}\nin data source: ${that.url}`)
                        let v = "No Data";
                        d.properties.choro_value = v;

                        obj['region'] = d.properties.region;
                        obj['label'] = that.choro_label;
                        obj['value'] = v;

                        data.push(obj);

                    } else {

                        let v = +fdata[0][that.choro_label];
                        d.properties.choro_value = v;

                        obj['region'] = d.properties.region;
                        obj['label'] = that.choro_label;
                        obj['value'] = v;

                        data.push(obj);

                        if (v < vmin) {
                            vmin = v;
                        }
                        if (v > vmax) {
                            vmax = v;
                        }
                    }
                })

            cmap.domain([vmin, vmax])

            let _sel = d3.selectAll("#" + that.container_id + ' svg .counties path')

            d3.selectAll("#" + that.container_id + ' svg .counties path')
                .interrupt()
                .transition()
                .ease(d3.easeExp)
                .style('fill-opacity', 0)
                .duration(200)

            d3.selectAll("#" + that.container_id + ' svg .counties path')
                .interrupt()
                .transition()
                .ease(d3.easeExp)
                .style('fill-opacity', 1)
                .style('fill', d => cmap(d.properties.choro_value))
                .duration(500)

            that.svg.selectAll('.legend').remove();

            var w = 30,
                h = w * 1.618 * 2;

            var key = that.svg
                .append("g")
                .attr("class", "legend");

            var legend = key.append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "100%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

            legend.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", highColor)
                .attr("stop-opacity", 1);

            legend.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", lowColor)
                .attr("stop-opacity", 1);

            key.append("rect")
                .attr("width", w)
                .attr("height", h)
                .style("fill", "url(#gradient)")
                .attr("transform", `translate(${that.width/8},${that.height-h-that.height/15})`);

            var y = d3.scaleLinear()
                .range([h, 0])
                .domain([vmin, vmax]);

            var yAxis = d3.axisRight(y);

            key.append("g")
                .attr("class", "y axis")
                .attr("transform", `translate(${that.width/8+w+4},${that.height-h-that.height/15})`)
                .call(
                    yAxis
                    .ticks(4)
                    .tickFormat(that.labelFormatter)
                );
        })

        this.cmap = cmap;
        this.data_tidy = data;
    }

    tooltip_show(d) {
        // d3.selectAll('.roi-tooltip').style('opacity', 0);
        let that = this;
        let current_region = d.properties.region;

        if (!this.is_choropleth) {

            this.tooltip.select('.roi-tooltip-header')
                .html(`<h5>${REGION_NAME_MAPPING[regionTag(current_region)]}</h5>`)

            this.tooltip.select('.roi-tooltip-content table').html(
                `
                <tr>
                    <td>${d.properties.fullName}</td>
                </tr>
                `
            )

        } else {
            let header = that.choro_title;

            let header_demo = '';

            let sorted_data = this.feature_obj.features
                .filter(d => (d.properties.region != 'Statewide'))
                .sort(function(a, b) { return b.properties.choro_value - a.properties.choro_value; });

            let max_d = sorted_data[0].properties
            let min_d = sorted_data.slice(-1)[0].properties

            let statewide_data = this.choro_data
                .filter(d => (d.region == 'Statewide'))
            let statewide_d = statewide_data[0]

            this.tooltip.select('.roi-tooltip-header')
                .html(`<h5>${header}<span class="roi-tooltip-small-header">&nbsp${header_demo}</span></h5>`)

            this.tooltip.select('.roi-tooltip-content table')
                .html(

                    `
                <tr>
                    <td>${REGION_NAME_MAPPING[regionTag(max_d.region)] || max_d.region}<span class="roi-tooltip-small">&nbsp(most in state)</span></td>
                    <td>${REGION_NAME_MAPPING[regionTag(max_d.region)] ? that.labelFormatter(max_d.choro_value) : 'No Data'}</td>
                </tr>
                <tr>
                    <td>State Average</td>
                    <td>${statewide_d ? that.labelFormatter(statewide_d[that.choro_label]) : 'No Data'}</td>
                </tr>
                <tr class="roi-tooltip-active">
                    <td>${REGION_NAME_MAPPING[regionTag(d.properties.region)] || d.properties.region} </td>
                    <td>${REGION_NAME_MAPPING[regionTag(d.properties.region)] ? that.labelFormatter(d.properties.choro_value) : 'No Data'}</td>
                </tr>
                <tr>
                    <td>${REGION_NAME_MAPPING[regionTag(min_d.region)] || min_d.region}<span class="roi-tooltip-small">&nbsp(least in state)</span></td>
                    <td>${REGION_NAME_MAPPING[regionTag(min_d.region)] ? that.labelFormatter(min_d.choro_value) : 'No Data'}</td>
                </tr>
                `
                )

        }

        this.tooltip
            .interrupt().transition()
            .style('opacity', 1);
    }

    tooltip_move(d) {

        let tt_width = this.tooltip.node().getBoundingClientRect().width;
        let px = null;
        let py = null;
        if (d3.event.type == 'touchstart') {
            px = d3.event.touches[0].pageX;
            py = d3.event.touches[0].pageY;
        } else {
            px = d3.event.pageX;
            py = d3.event.pageY;
        }

        let anchorPt = Math.max(0, (window.innerWidth - px < tt_width) ? px - tt_width : px)

        this.tooltip
            .style("left", (anchorPt) + "px")
            .style("top", (py - 28) + "px")

    }

    tooltip_hide(d) {
        this.tooltip.interrupt().transition()
            .style('opacity', 0)
            .style("pointer-events", 'none');

    }

    clear_roi_tooltips() {
        d3.selectAll('.roi-tooltip')
            .style('opacity', 0)
            .style("pointer-events", 'none');
    }

    on_touch(d) {
        let that = this;
        var hide_tooltip = this.clear_roi_tooltips;
        this.clear_roi_tooltips();

        this.tooltip_move(d)
        this.tooltip_show(d)
        let region = d.properties.region

        let onclick = this.on_click.bind(this)

        if (this.is_choropleth) {
            let header_html = this.tooltip.select('.roi-tooltip-header').node().innerHTML
            this.tooltip.select('.roi-tooltip-header')
                .html(`
                <table>
                    <tr>
                        <td>${header_html}</td>
                        <td class="hide-button" align="right" valign="top">(hide)</td>
                    </tr>
                </table>
                `)

            this.tooltip.select(".hide-button")
                .style("pointer-events", 'all')
                .on('click', function(d) {
                    that.clear_roi_tooltips();
                })

            let table_html = this.tooltip.select('.roi-tooltip-content table').node().innerHTML
            this.tooltip.select('.roi-tooltip-content table tbody')
                .html(`
                    ${table_html}
                    <tr>
                        <td><h5 class="region-button">Click For ${REGION_NAME_MAPPING[regionTag(region)]} Details</h5></td>
                    </tr>
                    `)

            this.tooltip.select(".region-button")
                .style("pointer-events", 'all')
                .on('click', function() {
                    that.clear_roi_tooltips();
                    onclick(d);
                })

        } else {
            onclick(d);
        }

        return false;
    }

}
class BaseChart {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select("#" + container_id);
        this.url = this.container.attr("_viz_source");
        this.color = this.container.attr("_viz_color");
        this.limit_to = parseInt(this.container.attr("_viz_limit"))
        this.sort = this.container.attr("_viz_sort")
        this.title = JSON.parse(`"${this.container.attr("_viz_title")}"`);
        this.statewide_tt_label = this.container.attr("_viz_statewide_tt_label") || "State Average";
        this.chart_uid = container_id + "-" + this.url;
        this.units = UNITS.filter(d => d == this.container.attr('_viz_units'));
        this.unitFormatter = getAxisTickLabelFormatter(this.units);
        this.labelFormatter = getLabelFormatter(this.units);
        this.hidden = false;

        this.svg = this.container.append("svg")
            .classed("_viz-svg-container", true)
            .append("g")

        this.container.select(".roi-tooltip").remove()

        this.tooltip = d3.select('body')
            .append("div")
            .attr('id', this.container_id + '-tooltip')
            .classed("roi-tooltip", true)
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("opacity", 0)

        this.tooltip.append('div')
            .classed('roi-tooltip-header', true);

        this.tooltip.append('div')
            .classed('roi-tooltip-content', true)
            .append('table')
        this.tooltip.append('div')
            .classed('roi-tooltip-footer', true)

        let that = this;
        let div_icons = this.container.selectAll("[_viz_icon^=icon-]")
        let icon_url_list = []
        if (!div_icons.empty()) {
            div_icons.nodes().forEach(function(d) {
                icon_url_list.push(d.getAttribute('src'))
                that.container.selectAll("[_viz_icon^=icon-]").remove()
            })
        }
        this.icon_url_list = icon_url_list;
        this.icon_urls = {};

        this.color_sequence = [
            "#C54241",
            "#C66F2C",
            "#C7A630",
            "#899237",
            "#34778C",
            "#834778",
        ]
        this.color_cycle = i => Object.values(this.color_sequence)[i % this.color_sequence.length]
    }

    get container_width() {
        return parseInt(d3.select("#" + this.container_id).node().clientWidth);
    }

    get container_height() {
        return parseInt(d3.select("#" + this.container_id).node().clientHeight);
    }

    get is_visible() {
        return is_visible(this.container_id)
    }

    toTidy(data, labels) {
        let that = this;
        let tidy = [];
        let group_cache = {};
        let group_cache_ix = 0;
        data
            .forEach(function(d) {
                for (let label of labels) {
                    var obj = {};
                    obj['region'] = d['region'];
                    obj['label'] = label;
                    obj['value'] = d[label] == "" ? null : +d[label];
                    obj['concat_label'] = d.group + "-" + d.subgroup;
                    obj['group'] = d.group;
                    obj['subgroup'] = d.subgroup;
                    obj['column'] = that.label_map[label].column;
                    if (!d.subgroup || d.group == d.subgroup) { // TODO this doesn't work, everything is .55 if subgroup is null
                        obj['width'] = 1; // x times normal
                        obj['demographic'] = d.group || "All";
                    } else {
                        obj['width'] = 0.55; // x times normal
                        obj['demographic'] = d.subgroup || "All";
                    }
                    if (!(d.group in group_cache) && !(d.group == "All")) {
                        group_cache[d.group] = group_cache_ix;
                        group_cache_ix += 1;
                    }

                    obj['ix'] = group_cache[d.group]

                    tidy.push(obj)
                }
            })
        return tidy;
    }

    log(message) {
        if (DEBUG || false) {
            console.log(message + ": " + this.chart_uid)
        }
    }

    init() {
        this.log('initializing')
        this.loadData();
    }

    update() {
        this.clear_roi_tooltips()
        this.log('updating bar chart')
    }

    resize() {
        this.clear_roi_tooltips()
        this.log('resizing bar chart')
    }

    loadData() {
        this.log('no method for loading data')
    }

    checkIfBreakdown(d) {
        let data = this.data_tidy.filter(
            e => e.region == REGION && e.label == d.label &&
            e.demographic != 'All' && e.value != null
        );

        return data.length > 0;
    }


    checkData(data) {

        if (data.length == 0) {
            this.container.style('opacity', 0)
            this.hidden = true;
            throw new InitializationError(
                `No Data for\n\tregion: ${REGION}\n\tdata source: ${this.url}\n\tchart: ${this.container_id}`
            )

            return false;
        } else {
            this.container.style('opacity', 1)
            this.hidden = false;
            return true;
        }
    }

    rescale(data, units) {
        // make this static?
        this.log('rescaling data')

        if (units == "percent") {
            return 1;
        } else if (REGION == "Statewide") {
            return d3.max(data, d => d.value)
        } else {
            return d3.max(data.filter(d => d.region != 'Statewide'), d => d.value)
        }
    }

    overviewPointerHandler(d, ele) {
        var goto = this.breakdown.bind(this)
        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)

        if (d3.event.type == 'touchstart') {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            this.selected_bar = d3.select(ele).attr('data_label');
            this.breakdownTitleColor = d3.select(ele).attr('data_color');
            return on_touch(d);

        } else if (d3.event.type == 'touchend') {
            d3.event.preventDefault();
            d3.event.stopPropagation();

        } else if (d3.event.type == 'click') {
            hide_tooltip(d);
            this.selected_bar = d3.select(ele).attr('data_label');
            this.breakdownTitleColor = d3.select(ele).attr('data_color');
            return goto();
        } else if (d3.event.type == "mouseover") {
            return show_tooltip(d);
        } else if (d3.event.type == "mousemove") {
            return move_tooltip(d);
        } else if (d3.event.type == "mouseout") {
            return hide_tooltip(d);
        }
    }

    breakdownPointerHandler(d, ele) {
        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)

        if (d3.event.type == 'touchstart') {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            return on_touch(d);

        } else if (d3.event.type == 'touchend') {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            return false;
        } else if (d3.event.type == "mouseover") {
            return show_tooltip(d);
        } else if (d3.event.type == "mousemove") {
            return move_tooltip(d);
        } else if (d3.event.type == "mouseout") {
            return hide_tooltip(d);
        }
    }

    tooltip_show(d) {
        if (this.hidden) {
            return false;
        }
        let that = this;
        let header = that.label_map[d.label].label_long || d.label
        let current_bar = d.label
        let current_demo = d.demographic
        let header_demo = '';
        if (current_demo != 'All') {
            header_demo = "(" + current_demo + ")";

        }
        let mostly_filtered_data = that.data_tidy.filter(
            d => (d.demographic == current_demo && d.label == current_bar && d.value != null)
        )

        if (!(d.value)) {
            d.value = mostly_filtered_data.filter(d => (d.region == REGION))[0].value
        }

        let sorted_data = mostly_filtered_data
            .filter(d => (d.region != 'Statewide'))
            .sort(function(a, b) { return b.value - a.value; });
        let max_d = sorted_data[0]
        let min_d = sorted_data.slice(-1)[0]

        let statewide_data = mostly_filtered_data
            .filter(d => (d.region == 'Statewide'))
        let statewide_d = statewide_data[0]

        // this.tooltip.style('height', null);
        this.tooltip
            .interrupt().transition()
            .style('opacity', 1);

        this.tooltip.select('.roi-tooltip-header')
            .html(`<h5>${header}<span class="roi-tooltip-small-header">&nbsp${header_demo}</span></h5>`)

        let table_html = `
                <tr>
                    <td>${REGION_NAME_MAPPING[regionTag(max_d.region)] || max_d.region}<span class="roi-tooltip-small">&nbsp(most in state)</span></td>
                    <td>${REGION_NAME_MAPPING[regionTag(max_d.region)] ? that.labelFormatter(max_d.value) : 'No Data'}</td>
                </tr>
                <tr>
                    <td>${that.statewide_tt_label}</td>
                    <td>${statewide_d ? that.labelFormatter(statewide_d.value) : 'No Data'}</td>
                </tr>
                <tr class="roi-tooltip-active">
                    <td>${REGION_NAME_MAPPING[regionTag(d.region)] || d.region}</td>
                    <td>${REGION_NAME_MAPPING[regionTag(d.region)] ? that.labelFormatter(d.value) : 'No Data'}</td>
                </tr>
                <tr>
                    <td>${REGION_NAME_MAPPING[regionTag(min_d.region)] || min_d.region}<span class="roi-tooltip-small">&nbsp(least in state)</span></td>
                    <td>${REGION_NAME_MAPPING[regionTag(min_d.region)] ? that.labelFormatter(min_d.value) : 'No Data'}</td>
                </tr>
                `
        this.tooltip.select('.roi-tooltip-content table')
            .html(table_html)

        this.tooltip.select('.roi-tooltip-footer .breakdown-note').remove()
        if (this.state == "overview" & d.hasBreakdown) {
            this.tooltip.select('.roi-tooltip-footer')
                .html(`<h5 class="breakdown-note">Click the Chart for Demographic Breakdown</h5>`)
        }
    }

    tooltip_move(d) {

        let tt_width = this.tooltip.node().getBoundingClientRect().width;
        let px = null;
        let py = null;
        if (d3.event.type == 'touchstart') {
            px = d3.event.touches[0].pageX;
            py = d3.event.touches[0].pageY;
        } else {
            px = d3.event.pageX;
            py = d3.event.pageY;
        }

        let anchorPt = Math.max(0, (window.innerWidth - px < tt_width) ? px - tt_width : px)

        this.tooltip
            .style("left", (anchorPt) + "px")
            .style("top", (py - 28) + "px")

    }

    tooltip_hide(d) {
        this.tooltip.interrupt().transition()
            .style('opacity', 0)
            .style("pointer-events", 'none');
        // .on("end", function() {
        //     d3.select(this).style('height', 0);
        // })
    }

    clear_roi_tooltips() {
        d3.selectAll('.roi-tooltip')
            // .style('height', 0)
            .style('opacity', 0)
            .style("pointer-events", 'none');
    }

    on_touch(d) {
        let that = this;
        var goto = this.breakdown.bind(this)
        var hide_tooltip = this.clear_roi_tooltips; //tooltip_hide.bind(this)
        this.clear_roi_tooltips();

        this.tooltip_move(d)
        this.tooltip_show(d)

        let header_html = this.tooltip.select('.roi-tooltip-header').node().innerHTML
        this.tooltip.select('.roi-tooltip-header')
            .html(`
                <table>
                    <tr>
                        <td>${header_html}</td>
                        <td class="hide-button" align="right" valign="top"></td>
                    </tr>
                </table>
                `)

        this.tooltip.select(".hide-button")
            .style("pointer-events", 'all')
            .on('click', function(d) {
                that.clear_roi_tooltips();
            })

        this.tooltip.select('.roi-tooltip-footer .breakdown-note').remove()

        if (this.state == 'overview' & d.hasBreakdown) {
            this.tooltip.select('.roi-tooltip-footer')
                .html(`<h5 class="breakdown-button">Click Here for Demographic Breakdown</h5>`)

            this.tooltip.select(".breakdown-button")
                .style("pointer-events", 'all')
                .on('click', function(d) {
                    that.clear_roi_tooltips();
                    return goto();
                })
        } else {
            this.tooltip.select('.roi-tooltip-footer .breakdown-button').remove()

        }
        return false;
    }

}
class RegionStatsBarChart extends BaseChart {
    constructor(container_id) {
        super(container_id);

        this.selected_bar = null;
        this.state = null;
    }

    resize() {
        super.resize();
        this.update();
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.raw_data = data;
            that.labels = toLabels(data)
            that.label_map = toLabelMap(that.labels)
            that.data_tidy = that.toTidy(data, that.labels)

            that.draw_overview();


        });
    }

    update() {
        super.update()
        switch (this.state) {
            case "overview":
                this.log("resize overview")
                this.draw_overview();
                break;
            case "breakdown":
                this.log("resize breakdown")
                this.breakdown();
                break;
        }

    }

    draw_overview() {
        try {
            this.overview();
        } catch (error) {
            console.error(error)
        }
    }

    loadOverviewData() {
        let that = this;
        this.state = 'overview';
        this.data = this.data_tidy
            .filter(d => (d.region == REGION && d.demographic == 'All'));

        this.checkData(this.data)
        this.data
            .forEach(
                function(d) {
                    d.hasBreakdown = that.checkIfBreakdown(d);
                }
            );
        if (this.sort == 'ascending') {
            this.data.sort(function(a, b) { return d3.ascending(a.value, b.value); });
        } else if (this.sort == 'descending') {
            this.data.sort(function(a, b) { return d3.descending(a.value, b.value); });
        }
        if (this.limit_to > 0) {
            this.data = this.data.slice(0, this.limit_to)
        } else {
            this.data = this.data.slice(this.limit_to)
        }
    }

    overview() {
        this.loadOverviewData();
        let that = this;

        let data = this.data;

        if (data.length == 1 && (this.title == "null" || this.title === null)) {
            this.title = this.label_map[data[0].label].label_short;
        } else if (this.title == "null" || this.title === null) {
            this.title = null;
        }

        let margin = {
            top: data.length > 1 ? 30 : 30,
            right: 100,
            bottom: 5,
            left: 130
        };
        let width = Math.max(0, this.container_width - margin.left - margin.right);
        let bar_height = 50;
        bar_height = data.length == 1 ? bar_height : bar_height * .66;
        let height = bar_height * data.length;     

        let icon_group = this.svg.selectAll(".icon-g")
        let icons = this.svg.selectAll(".icon")
        let title = this.svg.selectAll('.title')

        if (icon_group.empty()) {
            icon_group = this.svg.append('g')
                .classed('icon-g', true)
                .classed('overview', true);

            title = icon_group.append('text')
                .classed("title", true)
                .classed('overview', true)
            title.exit().remove();

            icons = icon_group.append("svg:image")
                .classed('icon', true)
                .classed('overview', true)
        }

        let title_center = margin.left / 2;
        let title_text_anchor = 'middle';
        let title_text_dy = "1em";
        let title_text_y = height / 2;
        let title_text_x = -title_center;
        let text_wrap_width = margin.left * 0.95;
        let text_alignment_baseline = 'bottom';
        let text_wrap_direction = 1;

        if (data.length > 1) {
            title_text_anchor = 'start';
            title_text_dy = "0em";
            title_text_y = -margin.top / 2;
            title_text_x = -title_center + Math.min((bar_height / 2 + margin.top), margin.left / 2) / 2 + 6;
            text_wrap_width = width;
            text_alignment_baseline = 'middle';
            text_wrap_direction = 1;
        }

        title
            .attr("fill", that.color)
            .attr("y", title_text_y)
            .attr("dy", title_text_dy)
            .attr("text-anchor", title_text_anchor)
            .attr('dominant-baseline', text_alignment_baseline)
            .merge(title)
            .text(d => that.title)
            .attr("x", title_text_x)

        wrap(title, text_wrap_width, text_wrap_direction) // text object and width in pixels, direction up or down


        let title_text_bbox = title.node().getBBox();
        // let lineheight = title.selectAll('tspan').nodes()[0].getClientHeight();
        // console.log(lineheight)
        let svg_stretch = 0;
        let constraint = 0;

        let icon_width = this.icon_url_list.length > 0 ? Math.min((bar_height / 2 + margin.top), margin.left / 2) : 1,
            icon_height = icon_width,
            icon_vert_translate = -icon_height,
            icon_y = height / 2;

        if (data.length > 1) {
            // icon_width = Math.min((bar_height / 2 + margin.top), margin.left / 2);
            icon_height = icon_width;
            icon_vert_translate = -icon_height / 2;
            icon_y = title_text_bbox.y + title_text_bbox.height / 2;
        }

        icons
            .style("pointer-events", "none")
            .attr('xlink:href', that.icon_url_list[0])
            .attr('x', -title_center)
            .attr('y', icon_y)
            .attr('width', icon_width)
            .attr('height', icon_height)
            .attr('transform', `translate(${-(icon_width)/2}, ${icon_vert_translate})`)

        let icon_bbox = icons.node().getBBox();

        if (data.length > 1) {
            svg_stretch = Math.max(icon_bbox.height, title_text_bbox.height);
            constraint = margin.top;
            margin.top = Math.max(constraint, svg_stretch);
            title.selectAll('tspan').attr('y', -margin.top / 2)
            icons.attr('y', -svg_stretch / 2)

        } else {
            svg_stretch = this.container_height - title_text_bbox.y + title_text_bbox.height;
            constraint = this.container_height;
            margin.bottom += Math.max(0, svg_stretch - constraint)
        }

        this.svg = this.container.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // set the y range
        this.y = d3.scaleBand()
            .range([0, height])
            .padding(0.1);
        this.y.domain(data.map(d => d.label));

        // set the x range
        let xmax = this.rescale(this.data_tidy, this.units);
        this.x = d3.scaleLinear()
            .range([0, width])
            .domain([0, xmax])

        let x = this.x
        let y = this.y

        const t = d3.transition().duration(500);
        const delay = function(d, i) {
            return i * 10;
        };
        this.svg.selectAll(".breakdown").remove();


        let bars = this.svg.selectAll(".bar-g")

        if (bars.empty()) {
            bars = this.svg.append('g')
                .classed('bar-g', true)
                .classed('overview', true);
        }

        let bar = bars.selectAll('.bar')
            .data(data)

        bar.exit().remove();

        bar.enter().append("rect")
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color))
            .classed('overview', true)
            .classed('bar', true)
            .attr("x", function(d) { return 0; })
            .attr("y", d => y(d.label))
            .attr("height", y.bandwidth())
            .style("fill", d3.color(that.color))
            .merge(bar)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            })

            .interrupt()
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", d => Math.max(0, x(d.value)))
            .delay(delay);

        bars.selectAll('.bar').classed('has-breakdown', d => d.hasBreakdown)

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();

        value_labels.enter().append("text")
            .attr("class", "value")
            // .style("pointer-events", "none")
            .classed('overview', true)
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color))
            .attr("fill", "white")
            .attr("opacity", 0)
            .attr("y", d => y(d.label) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .attr("font-size", Math.min(18, y.bandwidth() * 0.95))
            .merge(value_labels)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                if (d._no_tts) {
                    return false;
                }
                that.overviewPointerHandler(d, this);
            })
            .interrupt()
            .transition(t)
            .attr("opacity", 1)
            .text(function(d) {
                let label = null;
                if (d.value == 'null' || d.value == null || d.value == "undefined") {
                    d._no_tts = true;
                    d3.select(this).classed('data-unavailable', true)
                    return "Reliable Data Not Available"

                } else {
                    return that.labelFormatter(d.value);
                }


            })
            .attr("text-anchor", "start")
            .attr("x", d => Math.max(0, x(d.value)) + 7)
            .attr("fill", d => "rgb(51, 51, 51)")
            .delay(delay);

        if (data.length > 1) {
            let titles = bars.selectAll(".titles")
                .data(data);

            titles.exit().remove();

            titles.enter().append("text")
                .classed("titles", true)
                .classed('overview', true)
                .attr("fill", this.color)
                .attr("y", d => y(d.label) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "end")
                .merge(titles)
                .attr("opacity", 1)
                .text(d => that.label_map[d.label].label_short)
                .attr("x", d => -15)

        }
    }

    breakdown() {
        let selected_bar = this.selected_bar,
            that = this,
            data = this.data_tidy.filter(d => d.region == REGION && d.label == selected_bar && d.demographic != 'All' && d.value != null),
            margin = { top: 30, right: 100, bottom: 10, left: 20 },
            width = this.container_width - margin.left - margin.right,
            height = Math.max(25, 25 * data.length);

        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)

        if (!data.length) {
            console.warn(`No demographic breakdown data provided for selection: ${this.selected_bar}`);
            return
        } else {
            this.state = "breakdown";
        }

        var padding = 0.3,
            outerPadding = 0.05;

        function alpha(values, value) {
            var n = values.length,
                total = d3.sum(values, value);
            return (height - (n - 1) * padding * height / n - 2 * outerPadding * height / n) / total
        }

        function Wi(values, value, alpha) {
            return function(i) {
                return value(values[i]) * alpha
            }
        }

        function Midi(values, value, alpha) {
            var w = Wi(values, value, alpha),
                n = values.length;
            return function(_, i) {
                var op = outerPadding * height / n,
                    p = padding * height / n;
                return op + d3.sum(values.slice(0, i), value) * alpha + i * p + w(i) / 2;
            }
        }

        function v(d) {
            return d.width;
        }

        var a = alpha(data, v), // scale factor between value and bar width
            mid = Midi(data, v, a), // mid-point displacement of bar i
            w = Wi(data, v, a); // width of bar i

        this.y = d3.scaleOrdinal()
            .range(data.map(mid))
            .domain(data.map(function(d) { return d.demographic; }));

        let y = this.y
        let z = (this.color_cycle) || (i => ["#eee"][i]);

        const t = d3.transition().duration(500);

        const delay = function(d, i) {
            return i * 10;
        };

        this.svg.selectAll(".overview").remove();

        let bars = this.svg.selectAll(".bar-g")

        if (bars.empty()) {
            bars = this.svg.append('g')
                .classed('bar-g', true)
                .classed('breakdown', true);
        }

        let demo_labels = bars.selectAll(".demo_labels")
            .data(data);

        demo_labels.exit().remove();

        let max_text_width = -1;

        demo_labels.enter().append("text")
            .classed("demo_labels", true)
            .classed('breakdown', true)
            .attr('fill', d => z(d.ix))
            .attr("y", d => y(d.demographic))
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "end")
            .attr("font-size", d => Math.max(14, Math.min(18, a * v(d) * 0.95)))
            .merge(demo_labels)
            .attr("opacity", 1)
            .text(d => d.demographic)
            .attr("x", d => -15)
            .each(function(d) {
                d.text_width = this.getBBox().width;
                max_text_width = d.text_width > max_text_width ? d.text_width : max_text_width;
            });

        // Recalculate left padding for max text box.
        margin.left += max_text_width;
        width = this.container_width - margin.left - margin.right;

        let xmax = this.rescale(data, this.units);
        this.x = d3.scaleLinear()
            .range([0, width])
            .domain([0, xmax])
        let x = this.x

        this.svg = this.container.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        let bar = bars.selectAll('.bar')
            .data(data)

        bar.exit().remove();

        bar.enter().append("rect")
            .classed('bar', true)
            .classed('breakdown', true)
            .attr("x", 0)
            .attr("y", d => y(d.demographic) - a * v(d) / 2) //center the bar on the tick
            .attr("height", d => a * v(d)) //`a` already accounts for both types of padding
            .attr('fill', d => z(d.ix))
            .merge(bar)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.breakdownPointerHandler(d, this);
            })
            .interrupt()
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", d => Math.max(0, x(d.value)))
            .delay(delay);

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();

        value_labels.enter().append("text")
            .classed('value', true)
            .classed('breakdown', true)
            .attr("fill", "rgb(51, 51, 51)")
            .attr("opacity", 0)
            .attr("y", d => y(d.demographic))
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "start")
            .attr("font-size", d => Math.max(14, Math.min(18, a * v(d) * 0.95)))
            .merge(value_labels)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.breakdownPointerHandler(d, this);
            })
            .interrupt()
            .transition(t)
            .attr("opacity", 1)
            .text(d => this.labelFormatter(d.value))
            .attr("x", d => Math.max(0, x(d.value)) + 7)
            .delay(delay);



        let goto = this.overview.bind(this)
        let backbutton = this.svg.selectAll('.backbutton');
        if (backbutton.empty()) {
            backbutton = this.svg.append('g').classed('breakdown', true);
            backbutton.exit().remove();
            backbutton.append('text')
                .classed('backbutton', true)
                .classed('breakdown', true)
                .attr('fill', "rgb(51, 51, 51)")
                .attr("text-anchor", "end")
                .text("\u276E back")
                .attr('dominant-baseline', 'hanging')
                .attr("x", width + margin.right - 10)
                .attr("y", 0 - margin.top)
                .on("click", goto)
        }
        backbutton
            .transition(t)
            .ease(d3.easeExp)
            .attr("x", width + margin.right - 10)
            .delay(delay);


        this.svg.selectAll('.demoTitle-group').remove();
        let title = this.svg.append('g').classed('breakdown', true).classed('demoTitle-group', true);
        let title_text = this.label_map[selected_bar].label_short;

        title.exit().remove();
        title.append('text')
            .classed('breakdown', true)
            .classed('demoTitle', true)
            .attr('dominant-baseline', 'hanging')
            .attr('fill', that.breakdownTitleColor || that.color)
            .attr("text-anchor", "start")
            .text(title_text)
            .attr("x", 0)
            .attr("y", 0 - margin.top);

        wrap(title.select('text.demoTitle'), width)
    }
}

class StackedBarChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
        this.z = (this.color_cycle) || (i => ["#eee"][i]);
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.labels = toLabels(data); // keys after region, group, and subgroup are values 
            that.label_map = toLabelMap(that.labels);
            that.data_tidy = that.toTidy(data, that.labels)

            let dataGrouped = [];
            let data_tidy_slice = that.data_tidy.filter(d => (d.demographic == 'All'))
            let regions = d3.map(that.data_tidy, d => d.region).keys()
            let columns = d3.map(that.data_tidy, d => that.label_map[d.label].column).keys()
            let maxGroupedValue = -1;
            for (let region of regions) {
                for (let column of columns) {
                    let _gdata = data_tidy_slice.filter(
                        d => d.region == region && that.label_map[d.label].column == column
                    )
                    let obj = {}
                    obj['region'] = region;
                    obj['column'] = column;
                    obj['total'] = 0;
                    for (let label of that.labels) {
                        obj[label] = 0;

                        for (let _data of _gdata) {
                            if (_data.label == label) {
                                obj[_data.label] = _data.value;
                                obj['total'] += _data.value;
                            }
                        }
                    }
                    maxGroupedValue = obj['total'] > maxGroupedValue ? obj['total'] : maxGroupedValue;
                    dataGrouped.push(obj)
                }
            }

            that.dataGrouped = dataGrouped;
            that.maxGroupedValue = maxGroupedValue;
            that.columns = columns;

            that.draw_overview()
            // that.resize()

        });
    }

    // update() {
    //     super.update();
    // }

    cornerGetter(label, which) {

        let corner = null;
        switch (which) {
            case "left":
                corner = 'data-xloc-left';
                break;

            case "right":
                corner = 'data-xloc-right';
                break;

            case "top":
                corner = 'data-yloc-top';
                break;

            case "bottom":
                corner = 'data-yloc-bottom';
                break;
        }
        return this.svg.select("g[data_label='" + label + "']").select('.stacked-bars').attr(corner) || null
    }

    drawLegend() {
        let that = this;
        let legend_entries = {}



        this.layers
            .forEach(function(d) {
                if (d.column in legend_entries) {
                    legend_entries[d.column].push(d.label)
                } else {
                    legend_entries[d.column] = [d.label]
                }
            })

        for (let entry in legend_entries) {
            legend_entries[entry].reverse()
        }

        let size = 11;
        let padding = 6;
        let itemHeight = size + padding;

        this.svg.selectAll('.legend').remove()
        this.legend = this.svg.selectAll('.legend');

        if (this.legend.empty()) {
            this.log('legend was empty')
            this.legend = this.svg
                .append("g")
                .classed('legend', 'true')
                .classed('overview', 'true')
        } else {
            this.log('legend NOT empty')

            this.legend = this.svg
                .select(".legend")
        }

        var legend_items = this.legend.selectAll('g')
            .data(that.layers)
            .enter()
            .append("g")


        legend_items.exit().remove();

        var rects = legend_items.append('rect');

        this.legend_height_required = -1;

        rects.merge(rects)
            .classed('legend-patch', true)
            .attr("width", size)
            .attr("height", size)
            .attr("transform", function(d, i) {
                let xoff = that.x(d.column);
                let yoff = (
                    (legend_entries[d.column].indexOf(d.label) *
                        itemHeight) + that.height + (2 * padding + size)
                );
                if (yoff > that.legend_height_required) {
                    that.legend_height_required = yoff;
                }
                return "translate(" + xoff + "," + yoff + ")";
            })
            .attr("fill", function(d, i) { return that.z(i); })
            .attr("data_label", (d, i) => d.key)
            .attr("data_color", function(d, i) { return that.z(i); })
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            });
        rects.classed('has-breakdown', d => d.hasBreakdown);


        that.legend_height_required += padding

        var text = legend_items.append('text');
        text.merge(text)
            .classed('legend-text', true)
            .attr("x", size + padding)
            .attr("y", size / 2)
            .attr('dy', '0.35em')
            .attr("transform", function(d, i) {
                let xoff = that.x(d.column);
                let yoff = (
                    (legend_entries[d.column].indexOf(d.label) *
                        itemHeight) + that.height + (2 * padding + size)
                );
                return "translate(" + xoff + "," + yoff + ")";
            })
            .text(d => d.label_short)
            .attr("data_label", (d, i) => d.key)
            .attr("data_color", function(d, i) { return that.z(i); })
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            });

    }

    overview() {
        this.state = 'overview';
        let that = this;
        this.data = this.dataGrouped.filter(d => d.region == REGION);

        this.checkData(this.data)

        this.margin = { top: 20, right: 2, bottom: 20, left: 2 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;
        this.layers = d3.stack()
            .keys(that.labels)
            (that.data)

        this.layers.forEach(function(d) {
            d.label_long = that.label_map[d.key].label_long;
            d.label_short = that.label_map[d.key].label_short;
            d.column = that.label_map[d.key].column;
            d.label = d.key;
            d.region = REGION;
            d.demographic = 'All';
            d.hasBreakdown = that.checkIfBreakdown(d);
        })

        this.t = d3.transition().duration(500);

        this.delay = function(d, i) {
            return i * 10;
        };

        this.svg.selectAll(".breakdown").remove();

        this.svg = this.container.select("svg")
            .attr("width", that.width + that.margin.left + that.margin.right)
            .attr("height", that.height + that.margin.top + that.margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + that.margin.left + "," + that.margin.top + ")");

        // set the y range
        this.y = d3.scaleLinear()
            .range([that.height, 0])
            .domain([0, d3.max(that.data, d => d.total)])

        // set the x range
        this.x = d3.scaleBand()
            .range([0, that.width])
            .paddingInner(0.75)
            .paddingOuter(0.3)

        this.x.domain(that.layers[0].map(d => d.data.column))

        let x = this.x;
        let y = this.y;
        let z = this.z;

        this.drawLegend()
        this.container.select('svg')
            .attr("height", Math.max(that.height, that.legend_height_required) + that.margin.top + that.margin.bottom)

        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)

        this.bars = this.svg.selectAll(".bar-g")

        if (this.bars.empty()) {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers)
                .enter()
                .append('g')
                .classed('bar-g', true)
                .classed('overview', true)
                // .classed('has-breakdown', d=>that.checkIfBreakdown(d.label))
                .attr('fill', (d, i) => (z(i)))
                .attr("data_label", (d, i) => d.key)
                .attr("data_color", (d, i) => (z(i)))

                .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                    that.overviewPointerHandler(d, this);
                })

        } else {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers);
        }
        this.bars
            .classed('has-breakdown', d => d.hasBreakdown);

        let goto = this.breakdown.bind(this);

        this.bar = this.bars.selectAll('rect')

        this.bar.exit().remove();

        this.bar
            .data((d, i) => that.layers[i].filter(d => (d[1] - d[0] > 0)))
            .enter()
            .append('rect')
            .classed('stacked-bars', true)
            .classed('bar', true)
            .classed('overview', true)
            .attr('y', d => that.height)

            .merge(that.bar)

            .attr('x', d => x(d.data.column))
            .attr('width', x.bandwidth())

            .attr('data-xloc-left', d => x(d.data.column))
            .attr('data-xloc-right', d => x(d.data.column) + x.bandwidth())
            .attr('data-yloc-top', d => y(d[1]))
            .attr('data-yloc-bottom', d => y(d[0]))
            .interrupt()
            .transition(that.t)
            .ease(d3.easeExp)
            .attr('x', d => x(d.data.column))
            .attr('width', x.bandwidth())
            .attr('y', d => (y(d[1])))
            .attr("height", d => y(d[0]) - y(d[1]))
            .delay(that.delay);

    }
}

class EduStackedBarChart extends StackedBarChart {
    constructor(container_id) {
        super(container_id);
    }

    resize() {
        this.svg.selectAll(".link-group").remove();
        super.resize();

    }

    overview() {


        let that = this
        this.z = i => [
            "#36768B",
            "#8A9337",
            "#C64241",
            "#c66f2c",
            "#834778",
            "#C7A630",
            "#878787",
        ][i];

        super.overview()

        this.svg.selectAll(".bar-g")
            .style('fill', (d, i) => (that.z(i)))


        this.legend.selectAll('.legend-patch')
            .attr("fill", (d, i) => that.z(i))

        let graph = [{
                "source": {
                    "top": that.labels[0], // HS
                    "bottom": that.labels[0],
                },
                "target": {
                    "top": that.labels[1], // AG
                    "bottom": that.labels[1],
                },

            },
            {
                "source": {
                    "top": that.labels[1], // AG
                    "bottom": that.labels[1],
                },
                "target": {
                    "top": that.labels[4], // UC
                    "bottom": that.labels[3], // CSU
                },
            }
        ]


        var curvature = .5;

        function link(d) {

            // source to target
            var x0 = that.cornerGetter(d.source.top, 'right'),
                x1 = that.cornerGetter(d.target.top, 'left'),
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = that.cornerGetter(d.source.top, 'top'),
                y1 = that.cornerGetter(d.target.top, 'top'),
                // return trip
                x10 = that.cornerGetter(d.target.bottom, 'left'),
                x11 = that.cornerGetter(d.source.bottom, 'right'),
                x1i = d3.interpolateNumber(x10, x11),
                x12 = x1i(curvature),
                x13 = x1i(1 - curvature),
                y10 = that.cornerGetter(d.target.bottom, 'bottom'),
                y11 = that.cornerGetter(d.source.bottom, 'bottom');


            return (
                "M" + x0 + "," + y0 +
                "C" + x2 + "," + y0 +
                " " + x3 + "," + y1 +
                " " + x1 + "," + y1 +
                "L" + that.cornerGetter(d.target.bottom, 'left') + "," + that.cornerGetter(d.target.bottom, 'bottom') +
                "C" + x12 + "," + y10 +
                " " + x13 + "," + y11 +
                " " + x11 + "," + y11 +
                "L" + that.cornerGetter(d.source.bottom, 'right') + "," + that.cornerGetter(d.source.top, 'top')
            );
        }

        var link_group = this.svg.selectAll(".link-group")

        if (link_group.empty()) {
            link_group = this.svg.append('g')
                .classed('link-group', true)
                .classed('overview', true);

            var links = link_group.selectAll('.link')

            links.exit().remove()

            links.data(graph).enter().append("path")
                .classed("link", true)
                .style("fill", "#fff")
                .style("fill-opacity", 0)
                .attr("d", d => link(d))
                .merge(links)
                .interrupt()
                .transition(that.t)
                .ease(d3.easeExp)
                .style('fill-opacity', 1)
                .style('fill', "#eeeeee")
            // .delay(that.delay);

        } else {
            var links = link_group.selectAll('.link')

            links.exit().remove()

            links.data(graph).enter().append("path")
                .classed("link", true)
                .merge(links)
                .interrupt()
                .transition(that.t)
                .ease(d3.easeExp)
                .attr("d", d => link(d))
                .style('fill-opacity', 1)
                .style('fill', "#eeeeee")
            // .delay(that.delay);
        }
    }
}
class BubbleChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
        this.selected_bubble = null;
        this.t = d3.transition().duration(750);
        this.delay = function(d, i) {
            return i * 60;
        };
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.raw_data = data;
            that.labels = toLabels(data);
            that.label_map = toLabelMap(that.labels);
            that.data_tidy = that.toTidy(data, that.labels);
            if (that.icon_url_list.length>0) {
                that.labels.map(function(e, i) {
                    that.icon_urls[e] = that.icon_url_list[i];
                });
            }
            that.draw_overview();

        });
    }

    loadOverviewData() {
        this.state = 'overview';
        let that = this;
        this.data = this.data_tidy.filter(d => (d.region == REGION) && (d.demographic == 'All'));
        this.checkData(this.data)
        this.data
            .forEach(
                function(d) {
                    d.hasBreakdown = that.checkIfBreakdown(d);
                }
            );
        if (this.sort == 'ascending') {
            this.data.sort(function(a, b) { return d3.ascending(a.value, b.value); });

        } else if (this.sort == 'descending') {
            this.data.sort(function(a, b) { return d3.descending(a.value, b.value); });
        }
        if (this.limit_to > 0) {
            this.data = this.data.slice(0, this.limit_to)
        } else {
            this.data = this.data.slice(this.limit_to)
        }
    }

    overview() {

        this.loadOverviewData();
        let that = this;

        let data = this.data;

        let margin = { top: 10, right: 20, bottom: 10, left: 20 };
        let width = this.container_width - margin.left - margin.right;
        let max_height = 350;

        let max_bubble_dia = Math.min(max_height, (width / data.length) * 0.98);
        let height = max_bubble_dia * 1.05;
        let max_bubble_area = Math.PI * Math.pow(max_bubble_dia / 2, 2);
        let min_bubble_area = Math.PI * Math.pow(10, 2); // 10 px radius
        let max_data_value = d3.max(this.data_tidy.filter(d => d.demographic == 'All'), d => d.value)

        this.svg = this.container.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        this.svg.selectAll(".breakdown").remove();

        // set the x range
        this.x = d3.scaleBand()
            .range([0, width])

        this.x.domain(data.map(d => that.label_map[d.label].label_short))

        let bubbles = this.svg.selectAll(".bar-g")

        if (bubbles.empty()) {
            bubbles = this.svg.append('g')
                .classed('bar-g', true)
                .classed('overview', true);
        }

        data.forEach(function(d) {
            d.radius = Math.sqrt(map_range(d.value, 0, max_data_value, min_bubble_area, max_bubble_area) / Math.PI);
            d.cx = that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2;
            d.area = Math.PI * d.radius * d.radius;
            d.scaler = .6 * d.radius * 2;
        })

        let bubble = bubbles.selectAll('.bubble')
            .data(data)

        bubble.exit().remove();

        bubble.enter().append("circle")

            .classed('overview', true)
            .classed('bubble', true)

            .attr("cx", d => d.cx)
            .attr('cy', height - height / 2)
            .attr('r', 0)
            .attr('fill-opacity', 0.0)
            .merge(bubble)
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color) || "steelblue")
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            })
            .interrupt()
            .transition(that.t)
            .ease(d3.easeExp)
            .attr('r', d => d.radius)
            .attr("cx", d => d.cx)
            .attr('cy', height - height / 2)
            .attr('fill', d3.color(that.color || "steelblue"))
            .attr('fill-opacity', 1)
            .delay(that.delay);

        bubbles.selectAll('.bubble').classed('has-breakdown', d => d.hasBreakdown)

        
        if (Object.keys(that.icon_urls).length > 0) {
            let icons = bubbles.selectAll('.icon')
                .data(data)

            icons.exit().remove();

            icons.enter()
                .append("svg:image")
                .classed('icon', true)
                .classed('overview', true)
                .style("pointer-events", "none")
                .attr('xlink:href', (d, i) => that.icon_urls[d.label])
                .attr('x', d => d.cx - d.scaler / 2)
                .attr('y', d => (height - height / 2) - d.scaler / 2)
                .attr('width', d => d.scaler)
                .attr('height', d => d.scaler)
                .merge(icons)
                .interrupt()
                .transition(that.t)
                .ease(d3.easeExp)
                .attr('x', d => d.cx - d.scaler / 2)
                .attr('y', d => (height - height / 2) - d.scaler / 2)
                .attr('xlink:href', (d, i) => that.icon_urls[d.label])
                .attr('width', d => d.scaler)
                .attr('height', d => d.scaler)
                .delay(that.delay)

        } else {
            let value_labels = bubbles.selectAll(".value")
                .data(data);

            value_labels.exit().remove();

            value_labels.enter().append("text")
                .attr("class", "value")
                .classed('overview', true)
                .style("pointer-events", "none")
                .attr("fill", "white")
                .attr("fill-opacity", 0)
                .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
                .attr("y", height - height / 2)
                .attr("dy", "0.35em") //vertical align middle
                .attr("text-anchor", "middle")
                .merge(value_labels)
                .interrupt()
                .transition(that.t)
                .attr("fill-opacity", 1)
                .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
                .attr('y', height - height / 2)
                .attr("font-size", d => Math.min(0.45 * d.radius, 22))
                .text(d => that.labelFormatter(d.value))
                .delay(that.delay);

        }
        
        let text_labels = bubbles.selectAll(".text-labels")
            .data(data);

        text_labels.exit().remove();

        text_labels.enter().append("text")
            .classed("text-labels", true)
            .classed('overview', true)
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color) || "steelblue")
            .attr("fill", " white")
            .attr("opacity", 0)
            .attr("y", e => (height - height / 2) + e.radius + 25)
            .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            .attr("font-size", Math.min(18, 250 * 0.95))
            .attr('dominant-baseline', 'middle')
            .attr("text-anchor", "middle")

            .each(function(d) {
                d = d3.select(this)
                    .text(e => that.label_map[e.label].label_short)
                   
                wrap(d, that.x.bandwidth() / 2);

                d = d3.select(this).selectAll('text,tspan')
                    .attr("y", e => (height - height / 2) + e.radius + 25)
                    .attr("x", e => that.x(that.label_map[e.label].label_short) + that.x.bandwidth() / 2)
            })

            .merge(text_labels)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            })
            .interrupt()
            .transition(that.t)
            .ease(d3.easeExp)

            .attr("opacity", 1)
            
            .attr('fill', d3.color(that.color || "rgb(51, 51, 51)"))
            .attr("y", e => (height - height / 2) + e.radius + 25)
            .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            
            .delay(that.delay)
            .each(function(d) {
                d = d3.select(this)
                    .text(e => that.label_map[e.label].label_short)
                
                wrap(d, that.x.bandwidth() / 2);
            })
            .selectAll('text,tspan')
            .attr("y", e => (height - height / 2) + e.radius + 25)
            .attr("x", e => that.x(that.label_map[e.label].label_short) + that.x.bandwidth() / 2)
            
        let max_text_height = -1
        text_labels.each(
            function(d) {
                let _h = this.getBBox().height;
                max_text_height = _h > max_text_height ? _h : max_text_height;
            })

        // resize for label wraps.
        this.container.select('svg')
            .attr("height", height + margin.top + Math.max(margin.bottom, max_text_height * 1.15))
    }
}
class RadialChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.raw_data = data;
            that.labels = toLabels(data)
            that.label_map = toLabelMap(that.labels)
            that.data_tidy = that.toTidy(data, that.labels)

            that.draw_overview();

        });
    }

    drawLegend() {
        let that = this;
        this.legend = this.svg.selectAll('.legend').remove()
        let n = 3
        let size = 11;
        let padding = 6;
        let text_width = this.width / n;
        let itemWidth = size + padding + text_width + 5;
        let itemHeight = size + padding;
        let data = this.pie;

        this.legend = this.svg.selectAll('.legend');

        if (this.legend.empty()) {
            this.log('legend was empty')
            this.legend = this.svg
                .append("g")
                .classed('legend', 'true')
                .classed('overview', 'true')
        } else {
            this.log('legend NOT empty')

            this.legend = this.svg
                .select(".legend")
        }

        var legend_items = this.legend.selectAll('g')
            .data(data)
            .enter()
            .append("g")
            .attr("data_label", d => d.data.label)
            .attr("data_color", function(d, i) { return that.z(i); })
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d.data, this)
            })


        legend_items.exit().remove();

        var rects = legend_items.append('rect');
        rects.merge(rects)
            .classed('legend-patch', true)
            .attr("width", size)
            .attr("height", size)
            .attr("transform", function(d, i) {
                let xoff = that.width / 2 + ((i % 3) - 1) * (that.width / n);
                let yoff = ((Math.floor(i / n) * itemHeight) + that.height + (2 * padding + size));
                return "translate(" + xoff + "," + yoff + ")";
            })
            .attr("fill", function(d, i) { return that.z(i); });
        rects.classed('has-breakdown', d => d.data.hasBreakdown);

        var text = legend_items.append('text');
        text.merge(text)
            .classed('legend-text', true)
            .attr("x", size + padding)
            .attr("y", size / 2)
            .attr('dy', '0.35em')
            .attr("transform", function(d, i) {
                let xoff = that.width / 2 + ((i % 3) - 1) * (that.width / n);
                let yoff = ((Math.floor(i / n) * itemHeight) + that.height + (2 * padding + size));
                return "translate(" + xoff + "," + yoff + ")";
            })
            .text(d => that.label_map[d.data.label].label_short);

    }

    overview() {
        this.state = 'overview';
        let that = this;
        this.data = this.data_tidy.filter(d => d.region == REGION && (d.demographic == 'All'));
        this.checkData(that.data)
        this.data
            .forEach(
                function(d) {
                    d.hasBreakdown = that.checkIfBreakdown(d);
                }
            );

        this.margin = { top: 2, right: 2, bottom: 80, left: 2 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = Math.min(300, this.width); //this.container_height - this.margin.top - this.margin.bottom;

        this.svg = this.container.select("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .select("g")
            .attr("transform",
                 "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.z = i => [
            "#C64241", // red
            "#36768B", // blue
            "#C66F2C", // orange
            "#8A9337", // green
            "#834778", // purple
            "#C7A630", // yellow
            "#878787", // grey
        ][i]

        let radius = Math.min(this.width, this.height) / 2;

        let arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(radius * .66 - 10)
            .cornerRadius(0)
            .padAngle(0.02)


        let pie = d3.pie()
            .sort(null)
            .value(function(d) { return d.value; })(that.data)

        this.pie = pie;

        this.drawLegend()

        this.svg.selectAll(".breakdown").remove();
        let piechart = this.svg.selectAll('.pie')
        let path = piechart.selectAll('path')

        if (piechart.empty()) {
            piechart = this.svg
                .append("g")
                .classed('pie', true)
                .classed('overview', true)
                .attr("transform", "translate(" + that.width / 2 + "," + that.height / 2 + ")"); // Moving the center point

            path = piechart.selectAll('path')
                .data(pie)
                .enter()
                .append('path')
                .classed('wedge', true)
                .attr('d', arc)
                .attr('fill', function(d, i) {
                    return that.z(i);
                })
                .attr("data_label", d => d.data.label)
                .attr("data_color", function(d, i) { return that.z(i); })
                .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                    that.overviewPointerHandler(d.data, this)

                })
        }

        piechart
            .transition(that.t).duration(500)
            .ease(d3.easeExp)
            .attr("transform", "translate(" + that.width / 2 + "," + that.height / 2 + ")");

        path = piechart
            .selectAll("path")
            .data(pie) // Compute the new angles
            .classed('has-breakdown', d => d.data.hasBreakdown);

        path.transition(that.t).ease(d3.easeExp).attrTween("d", arcTween); // Smooth transition with arcTween

        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        }
    }
}
export var DEBUG = false;
var qparam = regionTitleCase(getParameterByName('region'))
var REGION = qparam ? qparam : ""
var REGION_TAG = regionTag(REGION);

// ----- Map Constants -------

export var REGION_COLORS = (typeof REGION_COLORS == 'undefined') || (REGION_COLORS == null) ? {
    "bay-area": "#34778c", // hs
    "central-coast": "#c7a630",
    "central-sierra": "#c54241",
    "sacramento-tahoe": "#6b7130", 
    "imperial": "#c7a630",
    "inland-empire": "#34778c",
    "los-angeles": "#6b7130", // ag
    "north-far-north": "#c7a630", 
    "upper-sacramento-valley": "#c66f2c",
    "orange": "#c66f2c", // csu
    "san-diego": "#c54241", // ccc
    "san-joaquin-valley": "#834778", // uc
} : REGION_COLORS

export var REGION_NAME_MAPPING = (typeof REGION_NAME_MAPPING == 'undefined') || (REGION_NAME_MAPPING == null) ? {
    "north-far-north": "North- -- -Far North", 
} : REGION_NAME_MAPPING

var COLOR_CYCLE = i => Object.values(REGION_COLORS)[i]

// increases size of region on click/hover/whatever
const REGION_POP_SCALER = 1.01;

const CA_COUNTIES_REGIONS_TOPOJSON_URL = "./data/ca-counties.json"

const UNITS = ["percent", "count", "usd"]

export var CHARTS = [];

var REGION_MAP

function chartBuilder(container, chart_mapping, chart_registry) {
    let classes = Object.keys(chart_mapping)
    for (let _class of classes) {
        d3.select(container).selectAll(_class).each(function(d) {
            let divId = this.getAttribute("id");
            if (is_visible(divId, 300)) {
                let has_no_chart = d3.select("#" + divId).selectAll('._viz-svg-container').empty()

                if (has_no_chart) {
                    let chart = new chart_mapping[_class](divId);
                    
                    try {
                        chart.init().catch(console.error);
                    } catch (error) {
                        if (error instanceof InitializationError) {
                            console.error(error)
                        }
                    }
                    
                    chart_registry.push(chart);

                }
            }
        })
    }
}

let CHART_MAPPING = {
    ".chart-wrapper-bar": RegionStatsBarChart,
    ".chart-wrapper-stacked-bar": StackedBarChart,
    ".chart-wrapper-edu-stacked-bar": EduStackedBarChart,
    ".chart-wrapper-bubble": BubbleChart,
    ".chart-wrapper-radial": RadialChart,
}

function updateVisibleCharts() {
    for (let chart of CHARTS) {
        if (chart.is_visible) {
            chart.update();
        }
    }
}

function resetCharts() {
    for (let chart of CHARTS) {
        chart.state = 'overview';
    }
}

function onLoad() {

    selectTabContent(REGION_TAG)

    d3.select("._navbar").text(REGION).classed('region_label', true);

    d3.selectAll(".chart-wrapper-map").each(function(d) {
        let divId = this.getAttribute("id");
        REGION_MAP = new RegionMap(divId);
        REGION_MAP.init();
    })
    initDataLabels();

    chartBuilder(document, CHART_MAPPING, CHARTS);

    d3.selectAll(".chart-wrapper-map").on("click", function() {
        d3.select("._navbar").text(REGION).classed('region_label', true)

        // selectTabContent(regionTag(REGION));
        // updateVisibleCharts();
    });
}

function initDataLabels() {
    let button_elements = d3.selectAll(".stat-btn");
    button_elements.each(function() {
        let button_element = d3.select(this)
        let url = button_element.attr("_viz_source");

        if (url) {
            d3.csv(url, function(error, data) {
                if (error) throw error;
                let labelFormatter = getLabelFormatter(button_element.attr("_viz_units"))
                let labels = toLabels(data)
                let statewide_stat = data.filter(d => (d.group == "All") && (d.region == 'Statewide'))[0][labels[0]];
                button_element.select("h4.stat-value")
                    .html(labelFormatter(statewide_stat))
            })
        }
    })
}

function selectTabContent(region_tag) {

    d3.selectAll(".tab-content .tab-pane.active").classed('active', false)
    d3.selectAll(".tab-content .tab-pane.tab-" + region_tag).classed('active', true)

    d3.selectAll(".roi-collapse-heading[class*=-color]").attr('class', "roi-collapse-heading")
    d3.selectAll(".roi-collapse-heading").classed(region_tag + '-color', true)
}

window.onresize = function() {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function() {
        resize();
    }, 500);
};

window.ontouchstart = function() {
    d3.selectAll('.roi-tooltip').style('opacity', 0);
}

function resize() {
    d3.selectAll('.roi-tooltip').style('opacity', 0);
    for (var i = 0; i < CHARTS.length; i++) {
        CHARTS[i].resize();
    }
}

window.onscroll = function() {
    clearTimeout(window.scrollFinished);
    window.scrollFinished = setTimeout(function() {
        updateVisibleCharts();
        chartBuilder(document, CHART_MAPPING, CHARTS);

    }, 50);
}

window.onload = function() {
    var qparam = regionTitleCase(getParameterByName('region'));
    var REGION = qparam ? qparam : "Bay Area";
    var REGION_TAG = regionTag(REGION);
    onLoad();
};

export function init_on_expand() {
    chartBuilder(document, CHART_MAPPING, CHARTS)
}

export function mapDataToggle(id) {
    let elem = '#' + id
    let state = d3.select(elem).classed('_viz-map-selected')
    if (state) {
        REGION_MAP.baseColors()
        d3.select(elem).classed('_viz-map-selected', false)
    } else {
        REGION_MAP.choroplethColors(elem);
        d3.selectAll('._viz-map-selected').classed('_viz-map-selected', false)
        d3.select(elem).classed('_viz-map-selected', true)
    }
}


