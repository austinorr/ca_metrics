class BaseChart {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select(container_id);
        this.url = this.container.attr("_viz_source");
        this.color = this.container.attr("_viz_color");
        this.chart_uid = container_id + "-" + this.url;
        this.units = UNITS.filter(d => d == this.container.attr('_viz_units'));
        this.unitFormatter = getAxisTickLabelFormatter(this.units);
        this.labelFormatter = getLabelFormatter(this.units)

        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = this.container_height - this.margin.top - this.margin.bottom;

        this.svg = this.container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.container.select(".roi-tooltip").remove()

        this.tooltip = this.container
            .append("div")
            .classed("roi-tooltip", true)
            .classed("clearfix", true)
            .style("position","absolute")
            .style("pointer-events", "none")
            .style("opacity", 0)

        this.tooltip.append('div')
            .classed('roi-tooltip-header', true);

        this.tooltip.append('div')
            .classed('roi-tooltip-content', true)
            .append('table')
        this.tooltip.append('div')
            .classed('roi-tooltip-footer', true)
    }

    get container_width() {
        return parseInt(d3.select(this.container_id).node().clientWidth);
    }

    get container_height() {
        return parseInt(d3.select(this.container_id).node().clientHeight);
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
                    obj['value'] = +d[label];
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

    toLabels(data) {
        let first_row = Object.keys(data[0]); // keys after region, group, and subgroup are values 
        if (!(first_row.includes("group"))) {
            return first_row.slice(1)
        } else if (!(first_row.includes("subgroup"))) {
            return first_row.slice(2)
        }
        return first_row.slice(3)
    }

    toLabelMap(labels) {
        let label_map = {};
        for (let label of labels) {
            let obj = {};
            obj.label_list = label.split(";");
            obj.label_short = obj.label_list[0];
            if (obj.label_list.length == 2) {
                obj.label_long = obj.label_list.slice(1).join('').trim();
            } else if (obj.label_list.length == 3) {
                obj.label_long = obj.label_list[1];
                obj.column = obj.label_list.slice(2).join('').trim();
            }
            label_map[label] = obj;
        }

        return label_map;
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
        this.log('no method for updating bar chart')
    }

    resize() {
        this.log('no method for resizing bar chart')
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
        let that = this;
        let current_bar = d.label
        let current_demo = d.demographic
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

        this.tooltip
            .interrupt().transition()
            .style('opacity', 1);

        this.tooltip.select('.roi-tooltip-header')
            .html(`<h5>${that.label_map[d.label].label_long}</h5>`)

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

        // .style("left", (d3.event.pageX) + "px")
        // .style("top", (d3.event.pageY-28) + "px");
    }

    tooltip_move(d) {
        this.tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px")

        // console.log(d3.mouse(d3.event.currentTarget))
    }

    tooltip_hide(d) {
        this.tooltip.interrupt().transition()
            .style('opacity', 0);

        // console.log(d3.mouse(d3.event.currentTarget))
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
