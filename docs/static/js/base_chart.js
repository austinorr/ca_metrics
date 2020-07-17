class BaseChart {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select("#" + container_id);

        this.url = this.container.attr("_viz_source");
        this.color = this.container.attr("_viz_color");
        this.limit_to = parseInt(this.container.attr("_viz_limit"))
        this.sort = this.container.attr("_viz_sort")
        this.no_data_text = this.container.attr("_viz_no_data_text") || "Reliable Data Not Available";
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
                    if (!d.subgroup || d.group == d.subgroup) {
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
