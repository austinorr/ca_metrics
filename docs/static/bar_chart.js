class RegionStatsBarChart extends BaseChart {
    constructor(container_id) {
        super(container_id);

        this.selected_bar = null;
        this.state = null
        // this.breakdown_data = null;
    }

    resize() {
        this.log('in resize')
        switch (this.state) {
            case "overview":
                this.log("resize overview")
                this.overview();
                break;
            case "breakdown":
                this.log("resize breakdown")
                this.breakdown();
                break;
        }
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

    update() {
        this.log('updating bar chart')
        this.overview();
    }

    overview() {
        this.state = 'overview';
        this.data = this.data_tidy.filter(d => (d.region == REGION) && (d.demographic == 'All'));
        let data = this.data;
        let that = this;

        let margin = { top: 20, right: 2, bottom: 10, left: 200 };
        let width = this.container_width - margin.left - margin.right;
        let bar_height = 45;
        let height = this.labels.length == 1 ? bar_height : this.labels.length * bar_height * .66;

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
        this.y.domain(data.map(function(d) { return d.label; }));

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

        var goto = this.breakdown.bind(this)
        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)

        bar.enter().append("rect")
            .attr("data_label", d => d.label)

            .classed('overview', true)
            .classed('bar', true)
            .attr("x", function(d) { return 0; })
            .attr("y", function(d) { return y(d.label); })
            .attr("height", y.bandwidth())
            .style("fill", d3.color(that.color))
            .merge(bar)
            .on("click", function(d) {
                hide_tooltip(d);
                that.selected_bar = d3.select(this).attr('data_label');
                return goto();
            })
            .on("mouseover", d => show_tooltip(d))
            .on("mousemove", d => move_tooltip(d))
            .on("mouseout", d => hide_tooltip(d))
            .interrupt()
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", function(d) { return x(d.value); })
            .delay(delay);

        // bar.enter().nodes().forEach(function (d){})

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();

        value_labels.enter().append("text")
            .attr("class", "value")
            .classed('overview', true)
            .attr("fill", "white")
            .attr("opacity", 0)
            .attr("y", function(d) { return y(d.label) + y.bandwidth() / 2; })
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "end")
            .attr("font-size", Math.min(18, y.bandwidth() * 0.95))
            .merge(value_labels)
            .interrupt()
            .transition(t)
            .attr("opacity", 1)
            .text(d => this.labelFormatter(d.value))
            .attr("x", d => x(d.value) - 7)
            .delay(delay);

        // this.svg.selectAll(".x--axis").remove()
        // add the x Axis
        // this.svg.append("g")
        //     .attr("transform", "translate(0," + this.height + ")")
        //     .classed('axis', true)
        //     .classed('x--axis', true)
        //     .classed('overview', true)
        //     .call(d3.axisBottom(this.x).tickFormat(this.unitFormatter));


        // this.svg.selectAll(".y--axis").remove()
        // // add the y Axis
        // this.svg.append("g")
        //     .classed('axis', true)
        //     .classed('y--axis', true)
        //     .classed('overview', true)
        //     .call(d3.axisLeft(this.y));

        let titles = bars.selectAll(".title")
            .data(data);

        titles.exit().remove();

        titles.enter().append("text")
            .classed("title", true)
            .classed('overview', true)
            .attr("fill", this.color)
            .attr("y", function(d) { return y(d.label) + y.bandwidth() / 2; })
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "end")
            .merge(titles)
            .attr("opacity", 1)
            .text(d => that.label_map[d.label].label_short)
            .attr("x", d => -15)

    }

    breakdown() {
        this.state = "breakdown";
        let selected_bar = this.selected_bar,
            data = this.data_tidy
            .filter(d => d.region == REGION && d.label == selected_bar && d.demographic != 'All'),
            margin = { top: 20, right: 100, bottom: 10, left: 20 },
            width = this.container_width - margin.left - margin.right,
            height = 25 * data.length - margin.top - margin.bottom,
            bar_height = (height / data.length);

        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)


        if (!data.length) {
            console.warn(`No demographic breakdown data provided for selection: ${this.selected_bar}`);
            return
        }

        var padding = 0.3,
            outerPadding = 0.3;

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

        var a = alpha(data, v), //scale factor between value and bar width
            mid = Midi(data, v, a), //mid-point displacement of bar i
            w = Wi(data, v, a); //width of bar i

        this.y = d3.scaleOrdinal()
            .range(data.map(mid))
            .domain(data.map(function(d) { return d.demographic; }));


        this.z = COLOR_CYCLE; //d3.scaleOrdinal(d3.schemeCategory10);

        let y = this.y
        let z = this.z

        const t = d3.transition().duration(500);

        const delay = function(d, i) {
            return i * 10;
        };

        this.svg.selectAll(".overview").remove();

        // this.svg.selectAll(".bar-g").remove();
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
            .attr('fill', d => z(d.ix % 10))
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
            .attr("x", function(d) { return 0; })
            .attr("y", d => y(d.demographic) - a * v(d) / 2) //center the bar on the tick
            .attr("height", function(d) {
                return a * v(d); //`a` already accounts for both types of padding
            })
            .attr('fill', d => z(d.ix % 10))
            .merge(bar)
            // .on("click", function(d) {
            //     hide_tooltip(d);
            //     that.selected_bar = d3.select(this).attr('data_label');
            //     return goto();
            // })
            .on("mouseover", d => show_tooltip(d))
            .on("mousemove", d => move_tooltip(d))
            .on("mouseout", d => hide_tooltip(d))
            .interrupt()
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", d => x(d.value))
            .delay(delay);

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();


        value_labels.enter().append("text")
            .classed('value', true)
            .classed('breakdown', true)
            // .attr("fill", "white")
            .attr("fill", "rgb(51, 51, 51)")
            .attr("opacity", 0)
            .attr("y", d => y(d.demographic))
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "start")
            .attr("font-size", d => Math.max(14, Math.min(18, a * v(d) * 0.95)))
            .merge(value_labels)
            .interrupt()
            .transition(t)
            .attr("opacity", 1)
            .text(d => this.labelFormatter(d.value))
            .attr("x", d => x(d.value) + 7)
            .delay(delay);

        let goto = this.overview.bind(this)
        let backbutton = this.svg.selectAll('.backbutton');
        if (backbutton.empty()) {
            backbutton = this.svg.append('g');
        }
        backbutton.exit().remove();
        backbutton.append('text')
            .classed('backbutton', true)
            .classed('breakdown', true)
            .attr('fill', "rgb(51, 51, 51)")
            .attr("text-anchor", "end")
            .text("\u276E back")
            .attr("x", width - 50)
            .attr("y", 0)
            .on("click", goto)


        this.svg.selectAll('.demoTitle').remove();
        let title = this.svg.append('g')
        let title_text = this.label_map[selected_bar].label_long || this.label_map[selected_bar].label_short;
        title.exit().remove();
        title.append('text')
            .classed('breakdown', true)
            .classed('demoTitle', true)
            .attr('fill', "rgb(51, 51, 51)")
            .attr("text-anchor", "start")
            .text(title_text)
            .attr("x", 0 - margin.left + 50)
            .attr("y", 0);
    }
}

class StackedBarChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
        this.z = (COLOR_CYCLE) || (i => ["#eee"][i]);
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.labels = that.toLabels(data); // keys after region, group, and subgroup are values 
            that.label_map = that.toLabelMap(that.labels);
            that.data_tidy = that.toTidy(data, that.labels)

            let dataGrouped = [];
            let data_tidy_slice = that.data_tidy.filter(d => (d.demographic == 'All'))
            let regions = d3.map(that.data_tidy, d => d.region).keys()
            let columns = d3.map(that.data_tidy, d => that.label_map[d.label].column).keys()
            let maxGroupedValue = -1;
            for (let region of regions) {
                for (let column of columns) {
                    let _gdata = data_tidy_slice.filter(d => d.region == region && that.label_map[d.label].column == column)
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

            that.update()
            that.resize()

        });
    }

    update() {
        this.overview()
    }

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
        this.legend = this.svg.selectAll('.legend').remove()
        let n = this.columns.length
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
                let xoff = that.x(that.columns[i % n]);
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
                let xoff = that.x(that.columns[i % n]);
                let yoff = ((Math.floor(i / n) * itemHeight) + that.height + (2 * padding + size));
                return "translate(" + xoff + "," + yoff + ")";
            })
            .text(d => that.label_map[d].label_short);

    }

    overview() {
        this.state = 'overview';
        let that = this;
        this.data = this.dataGrouped.filter(d => d.region == REGION);


        this.margin = { top: 2, right: 2, bottom: 60, left: 2 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = 300; //this.container_height - this.margin.top - this.margin.bottom;
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
        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)


        // // vertical legend orientation
        // legend
        //     .append('g')
        //     .classed('legend-boxes', true)
        //     .selectAll('rect')
        //     .data(that.labels)
        //     .enter()
        //     .append("rect")
        //     .attr("x", (width) - 5)
        // // 100 is where the first dot appears. 25 is the distance between dots
        //     .attr("y", function(d, i) { return 0 + i * (size + padding) }) 
        //     .attr("width", size)
        //     .attr("height", size)
        //     .style("fill", function(d, i) { return z(i) })

        // // Add one dot in the legend for each name.
        // legend
        //     .append('g')
        //     .classed('legend-text', true)
        //     .selectAll('text')
        //     .data(that.labels)
        //     .enter()
        //     .append("text")
        //     .attr("x", width - 5 - padding)
        // // 100 is where the first dot appears. 25 is the distance between dots
        //     .attr("y", function(d, i) { return 0 + i * (size + padding) }) 
        //     .attr("dy", function(d, i) { return 0 + ((size + padding) / 2) })
        //     .style("fill", function(d, i) { return z(i) })
        //     .text(function(d) { return that.label_map[d].label_short })
        //     .attr("text-anchor", "end")
        //     .style("alignment-baseline", "middle")


        this.bars = this.svg.selectAll(".bar-g")

        if (this.bars.empty()) {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers)
                .enter()
                .append('g')
                .classed('bar-g', true)
                .classed('overview', true)
                .style('fill', (d, i) => (z(i)))
                .attr("data_label", (d, i) => d.key)
                .on("click", function(d, i) {
                    that.selected_bar = d3.select(this).attr('data_label');
                    return goto();
                })
                .on("mouseover", d => show_tooltip(d))
                .on("mousemove", d => move_tooltip(d))
                .on("mouseout", d => hide_tooltip(d))

        } else {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers);
        }

        let goto = this.breakdown.bind(this);

        this.bar = this.bars.selectAll('rect')

        this.bar.exit().remove();

        this.bar
            .data((d, i) => that.layers[i].filter(d => (d[1] - d[0] > 0)))
            .enter()
            .append('rect')
            .classed('stacked-bars', true)
            .classed('overview', true)
            .attr('y', d => that.height)

            .merge(that.bar)
            .interrupt()
            .attr('x', d => x(d.data.column))
            .attr('width', x.bandwidth())

            .attr('data-xloc-left', d => x(d.data.column))
            .attr('data-xloc-right', d => x(d.data.column) + x.bandwidth())
            .attr('data-yloc-top', d => y(d[1]))
            .attr('data-yloc-bottom', d => y(d[0]))
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
        this.z = i => [
            "#36768B",
            "#8A9337",
            "#C64241",
            "#c66f2c",
            "#834778",
            "#878787",
        ][i]
    }

    resize() {
        this.svg.selectAll(".link-group").remove();
        super.resize();

    }

    overview() {
        this.state = 'overview';

        super.overview()
        let that = this

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
                .delay(that.delay);

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
                .delay(that.delay);
        }
    }
}
