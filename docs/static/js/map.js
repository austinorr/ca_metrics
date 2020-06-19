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

            for (var i = 0; i < nRegions + 1; i++) {
                var region_features = that.feature_obj.features.filter(d => d.properties.region_id == i);
                let region = region_features[0].properties.region;
                let region_tag = regionTag(region)
                that.svg.append("g")
                    .attr("class", `counties region_${i} ${region_tag}`)
                    .selectAll("path")
                    .data(region_features)
                    .enter().append("path")
                    .attr("d", that.path)
                    .style("fill", that.colors[region_tag])
                    .style('fill-opacity', 0.5)
                    .attr("data-region", d => d.properties.region)
                    // .on("click", function(d) {
                    //     that.selected_region = d.properties.region;

                    //     window.history.pushState(
                    //         "", document.title,
                    //         window.location.href.split('?')[0] + `?region=${region_tag}`
                    //     );
                    //     if (that.redirect_url) {
                    //         window.location.href = that.redirect_url + `?region=${region_tag}`;
                    //     }
                    //     return goto();
                    // })
                    // .on("mouseover", d => show_tooltip(d))
                    // .on("mousemove", d => move_tooltip(d))
                    // .on("mouseout", d => hide_tooltip(d))
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

        // if (selected_region.classed('active-region')) {
        //     // d3.selectAll(".active-region").classed('active-region', false);
        //     // d3.selectAll(".countySelected").remove();
        //     // REGION = "Statewide";
        //     // let pass

        // } else {
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
                    let v = +choro_data.filter(
                        e => e.region == d.properties.region)[0][that.choro_label];
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
                .html(`<h5>${current_region}</h5>`)

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
                    <td>${max_d.region}<span class="roi-tooltip-small">&nbsp(most in state)</span></td>
                    <td>${that.labelFormatter(max_d.choro_value)}</td>
                </tr>
                <tr>
                    <td>State Average</td>
                    <td>${that.labelFormatter(statewide_d[that.choro_label])}</td>
                </tr>
                <tr class="roi-tooltip-active">
                    <td>${d.properties.region}</td>
                    <td>${that.labelFormatter(d.properties.choro_value)}</td>
                </tr>
                <tr>
                    <td>${min_d.region}<span class="roi-tooltip-small">&nbsp(least in state)</span></td>
                    <td>${that.labelFormatter(min_d.choro_value)}</td>
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
        // TODO: make this unclickable if hidden!!!
        this.tooltip.interrupt().transition()
            .style('opacity', 0)

    }

    clear_roi_tooltips() {
        // TODO: make this unclickable if hidden!!!
        d3.selectAll('.roi-tooltip')
            .style('opacity', 0);
    }

    on_touch(d) {
        let that = this;
        // var goto = this.breakdown.bind(this)
        var hide_tooltip = this.clear_roi_tooltips; //tooltip_hide.bind(this)
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
                        <td><h5 class="region-button">Click For ${region} Details</h5></td>
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




        // this.tooltip.select('.roi-tooltip-content .breakdown-note').remove()

        // if (this.state == 'overview') {
        //     let table_html = this.tooltip.select('.roi-tooltip-content table').node().innerHTML
        //     this.tooltip.select('.roi-tooltip-content table tbody')
        //         .html(`
        //             ${table_html}
        //             <tr>
        //                 <td><h5 class="breakdown-button">Click Here for Demographic Breakdown</h5></td>
        //             </tr>
        //             `)

        //     this.tooltip.select(".breakdown-button")
        //         .style("pointer-events", 'all')
        //         .on('click', function(d) {
        //             that.clear_roi_tooltips();
        //             return goto();
        //         })
        // }
        return false;
    }

}
