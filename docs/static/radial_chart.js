class RadialChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
        this.z = i => [
            "#36768B",
            "#8A9337",
            "#C64241",
            "#c66f2c",
            "#834778",
            "#878787",
        ][i]
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;

            that.raw_data = data;

            that.labels = that.toLabels(data) // Object.keys(data[0]).slice(3); // keys after region, group, and subgroup are values 
            that.label_map = that.toLabelMap(that.labels)
            that.data_tidy = that.toTidy(data, that.labels)
            that.update();
            // that.resize();

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
            .data(that.labels)
            .enter()
            .append("g")

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
            .text(d => that.label_map[d].label_short);

    }

    overview() {
        this.state = 'overview';
        let that = this;
        this.data = this.data_tidy.filter(d => d.region == REGION && (d.demographic == 'All'));

        this.innerData = d3.nest()
            .key(d => d.column)
            .rollup(
                function(totals) {
                    return d3.sum(totals, d => d.value)
                })
            .entries(that.data)
        this.innerData.forEach(function(d) { d.label = d.key })

        if (!(that.labels.includes(that.innerData[0].label))) {
            that.innerData.forEach(function(d) {
                that.labels.push(d.label);
                that.label_map[d.label] = {
                    "label_short": d.label,
                    "label_long": d.label,
                };
            })
        }


        this.margin = { top: 2, right: 2, bottom: 80, left: 2 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = 300; //this.container_height - this.margin.top - this.margin.bottom;

        this.svg = this.container.select("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")");

        let show_tooltip = this.tooltip_show.bind(this)
        let move_tooltip = this.tooltip_move.bind(this)
        let hide_tooltip = this.tooltip_hide.bind(this)
        let goto = this.breakdown.bind(this);

        this.drawLegend()

        let radius = Math.min(this.width, this.height) / 2;

        let arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(radius - 70)
            .cornerRadius(1)
            .padAngle(0.02)


        let pie = d3.pie()
            .sort(null)
            .value(function(d) { return d.value; })(that.data)

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
                .attr('d', arc)
                .attr('fill', function(d, i) {
                    return that.z(i);
                })
                .attr("data_label", d => d.data.label)
                .on("click", function(d, i) {
                    that.selected_bar = d3.select(this).attr('data_label');
                    return goto();
                })
                .on("mouseover", d => show_tooltip(d.data))
                .on("mousemove", d => move_tooltip(d.data))
                .on("mouseout", d => hide_tooltip(d.data))

        }

        piechart
            .transition(that.t).duration(500)
            .ease(d3.easeExp)
            .attr("transform", "translate(" + that.width / 2 + "," + that.height / 2 + ")");

        path = piechart
            .selectAll("path")
            .data(pie); // Compute the new angles

        path.transition(that.t).ease(d3.easeExp).attrTween("d", arcTween); // Smooth transition with arcTween

        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        }

        let innerArc = d3.arc()
            .outerRadius(radius - 74)
            .innerRadius(1.5)
            .cornerRadius(1)
            .padAngle(0.04)


        let innerPie = d3.pie()
            .sort(null)
            .value(function(d) { return d.value; })(that.innerData)

        let innerPiechart = this.svg.selectAll('.innerpie')
        let innerPath = innerPiechart.selectAll('path')

        if (innerPiechart.empty()) {
        	console.log('populating inner pie')
            innerPiechart = this.svg
                .append("g")
                .classed('innerpie', true)
                .classed('overview', true)
                .attr("transform", "translate(" + that.width / 2 + "," + that.height / 2 + ")"); // Moving the center point

            innerPath = innerPiechart.selectAll('path')
                .data(innerPie)
                .enter()
                .append('path')
                .attr('d', innerArc)
                .attr('fill', function(d, i) {
                    return that.z(i);
                })
                // .attr("data_label", d => d.data.label)
                // .on("click", function(d, i) {
                //     that.selected_bar = d3.select(this).attr('data_label');
                //     return goto();
                // })
                // .on("mouseover", d => show_tooltip(d.data))
                // .on("mousemove", d => move_tooltip(d.data))
                // .on("mouseout", d => hide_tooltip(d.data))

        }

        innerPiechart
            .transition(that.t).duration(500)
            .ease(d3.easeExp)
            .attr("transform", "translate(" + that.width / 2 + "," + that.height / 2 + ")");

        innerPath = innerPiechart.selectAll("path")
            .data(innerPie); // Compute the new angles

        innerPath.transition(that.t).ease(d3.easeExp).attrTween("d", innerArcTween); // Smo

        function innerArcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return innerArc(i(t));
            };
        }
        
    }
}
