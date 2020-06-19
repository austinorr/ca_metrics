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

            that.labels = toLabels(data) // Object.keys(data[0]).slice(3); // keys after region, group, and subgroup are values 
            that.label_map = toLabelMap(that.labels)
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
        this.checkData(this.data)

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
        this.height = Math.min(300, this.width); //this.container_height - this.margin.top - this.margin.bottom;

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
        var on_touch = this.on_touch.bind(this)


        this.z = i => [
            "#C64241",
            "#c66f2c",
            "#834778",
            "#C7A630",
            "#878787",
            "#8A9337",
            "#36768B",
        ][i]

        this.drawLegend()

        let radius = Math.min(this.width, this.height) / 2;

        let arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(radius * .66 - 10)
            .cornerRadius(0)
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
                // .on("click", function(d, i) {
                //     that.selected_bar = d3.select(this).attr('data_label');
                //     return goto();
                // })
                // .on("mouseover", d => show_tooltip(d.data))
                // .on("mousemove", d => move_tooltip(d.data))
                // .on("mouseout", d => hide_tooltip(d.data))
                .on('touchstart touchend click mouseover mousemove mouseout', function(ele) {
                    let d = ele.data;
                
                    if (d3.event.type == 'touchstart') {
                        console.log('touched')
                        d3.event.preventDefault();
                        d3.event.stopPropagation();
                        that.selected_bar = d3.select(this).attr('data_label');
                        return on_touch(d);

                    } else if (d3.event.type == 'touchend') {
                        d3.event.preventDefault();
                        d3.event.stopPropagation();

                    } else if (d3.event.type == 'click') {
                        console.log('click fired')
                        hide_tooltip(d);
                        that.selected_bar = d3.select(this).attr('data_label');
                        return goto();
                    } else if (d3.event.type == "mouseover") {
                        return show_tooltip(d);
                    } else if (d3.event.type == "mousemove") {
                        return move_tooltip(d);
                    } else if (d3.event.type == "mouseout") {
                        return hide_tooltip(d);
                    }
            })

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
            .outerRadius(radius * .66 - 4 - 10)
            .innerRadius(1.5)
            .cornerRadius(0)
            .padAngle(0.04)


        let innerPie = d3.pie()
            .sort(null)
            .value(function(d) { return d.value; })(that.innerData)

        let innerPiechart = this.svg.selectAll('.innerpie')
        let innerPath = innerPiechart.selectAll('path')

        if (innerPiechart.empty()) {
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
                    return that.z(i + pie.length);
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
