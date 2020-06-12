class BaseChart {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select("#" + container_id);
        this.url = this.container.attr("_viz_source");
        this.color = this.container.attr("_viz_color");
        this.title = JSON.parse(`"${this.container.attr("_viz_title")}"`);
        this.chart_uid = container_id + "-" + this.url;
        this.units = UNITS.filter(d => d == this.container.attr('_viz_units'));
        this.unitFormatter = getAxisTickLabelFormatter(this.units);
        this.labelFormatter = getLabelFormatter(this.units)
        this.touched = false;

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
            .style('height', 0)

        this.tooltip.append('div')
            .classed('roi-tooltip-header', true);

        this.tooltip.append('div')
            .classed('roi-tooltip-content', true)
            .append('table')
        this.tooltip.append('div')
            .classed('roi-tooltip-footer', true)

        let that = this;
        let div_icons = this.container.selectAll("[_viz_icon^=icon-]")
        let icon_urls = []
        if (!div_icons.empty()) {
            div_icons.nodes().forEach(function(d) {
                icon_urls.push(d.getAttribute('src'))
                that.container.selectAll("[_viz_icon^=icon-]").remove()
            })
        }
        this.icon_urls = icon_urls;

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

    toTidy(data, labels) {
        let that = this;
        let tidy = [];
        let group_cache = {};
        let group_cache_ix = -1;
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
                    if (!(d.group in group_cache)) {
                        group_cache_ix += 1;
                        group_cache[d.group] = group_cache_ix;

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

    rescale(data, units) {
        // make this static?
        this.log('rescaling data')

        if (units == "percent") {
            return 1;
        } else {
            return d3.max(data, d => d.value)
        }
    }

    tooltip_show(d) {
        // d3.selectAll('.roi-tooltip').style('opacity', 0);
        let that = this;
        let header = that.label_map[d.label].label_long || d.label
        let current_bar = d.label
        let current_demo = d.demographic
        let header_demo = '';
        if (current_demo != 'All') {
            header_demo = "(" + current_demo + ")";

        }
        let mostly_filtered_data = that.data_tidy.filter(
            d => (d.demographic == current_demo) && (d.label == current_bar)
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

        this.tooltip.style('height', null);
        this.tooltip
            .interrupt().transition()
            .style('opacity', 1);

        this.tooltip.select('.roi-tooltip-header')
            .html(`<h5>${header}<span class="roi-tooltip-small-header">&nbsp${header_demo}</span></h5>`)

        this.tooltip.select('.roi-tooltip-content table')
            .html(
                `
                <tr>
                    <td>${max_d.region}<span class="roi-tooltip-small">&nbsp(most in state)</span></td>
                    <td>${that.labelFormatter(max_d.value)}</td>
                </tr>
                <tr>
                    <td>State Average</td>
                    <td>${that.labelFormatter(statewide_d.value)}</td>
                </tr>
                <tr class="roi-tooltip-active">
                    <td>${d.region}</td>
                    <td>${that.labelFormatter(d.value)}</td>
                </tr>
                <tr>
                    <td>${min_d.region}<span class="roi-tooltip-small">&nbsp(least in state)</span></td>
                    <td>${that.labelFormatter(min_d.value)}</td>
                </tr>
                `
            )
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

        let anchorPt = (window.innerWidth - px - 10 < tt_width) ? px - tt_width : px

        this.tooltip
            .style("left", (anchorPt) + "px")
            .style("top", (py - 28) + "px")

    }

    tooltip_hide(d) {
        this.tooltip.interrupt().transition()
            .style('opacity', 0).on("end", function() {
                d3.select(this).style('height', 0);
            })
    }

    clear_roi_tooltips() {
        d3.selectAll('.roi-tooltip')
            .style('height', 0)
            .style('opacity', 0);
    }

    on_touch(d) {
        let that = this;
        var goto = this.breakdown.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)

        if (this.touched) {
            this.tooltip_hide(d)
            this.touched = false;

        } else {
            this.tooltip_move(d)
            this.tooltip_show(d)
            this.tooltip.style("pointer-events", null)

            let table_html = this.tooltip.select('.roi-tooltip-content table').node().innerHTML

            this.tooltip.select('.roi-tooltip-content table')
                .html(`
                    ${table_html}
                    <tr>
                        <button class="breakdown-button">Click for Demographic Breakdown</button>
                    </tr>
                    `)

            this.tooltip.select("button.breakdown-button")
                .on('click', function(d) {
                    hide_tooltip(d);
                    return goto();
                })

            this.touched = true;

        }
    }


    // let 
    // <div class="roi-tooltip">
    //     <div class="roi-tooltip-header">
    //       <h5>Long Chart Title</h5>
    //     </div>
    //     <div class="roi-tooltip-content">
    //       <table>
    //         <tr>
    //           <td>High Region <span class="roi-tooltip-small">(most in state)</span></td>
    //           <td>00%</td>
    //         </tr>
    //         <tr>
    //           <td>State Average</td>
    //           <td>00%</td>
    //         </tr>
    //         <tr class="roi-tooltip-active">
    //           <td>Active Region</td>
    //           <td>00%</td>
    //         </tr>
    //         <tr>
    //           <td>Low Region <span class="roi-tooltip-small">(least in state)</span></td>
    //           <td>00%</td>
    //         </tr>
    //       </table>
    //     </div>
    //     <div class="roi-tooltip-footer">
    //       <h5>Click chart for demographic info</h5>
    //     </div>
    // </div>



}