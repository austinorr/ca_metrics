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
