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
    }

    get container_width() {
        return parseInt(d3.select(this.container_id).node().clientWidth);
    }

    get container_height() {
        return parseInt(d3.select(this.container_id).node().clientHeight);
    }

    toTidy(data, labels) {
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

        if (!(first_row.includes("subgroup"))) {
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
                obj.label_long = obj.label_list.slice(1).join('');
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

    rescale(ax, data) {
        // make this static?
        this.log('rescaling data')

        if (this.units == "percent") {
            ax.domain([0, 1]);
        } else {
            ax.domain([0, d3.max(data, d => d.value)]).nice()
        }
    }
}
