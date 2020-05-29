class BaseChart {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select(container_id);
        this.url = this.container.attr("_viz_source");
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
