class RegionStatsBarChart extends BaseChart {
    constructor(container_id) {
        super(container_id);

        this.selected_bar = null;
        // this.breakdown_data = null;
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
            that.resize();
            that.update();

        });
    }

    update() {
        this.log('updating bar chart')
        this.overview();
    }

    overview() {
        this.data = this.data_tidy.filter(d => (d.region == REGION) && (d.demographic == 'All'));
        let data = this.data;
        let that = this;

        let margin = { top: 2, right: 2, bottom: 2, left: 200 };
        let width = this.container_width - margin.left - margin.right;
        let height = 80; //this.container_height - margin.top - margin.bottom;

        this.svg = this.container.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // set the y range
        this.y = d3.scaleBand()
            .range([0, height])
            .padding(0.6);
        this.y.domain(data.map(function(d) { return d.label; }));

        // set the x range
        this.x = d3.scaleLinear()
            .range([0, width]);

        this.rescale(this.x, this.data_tidy);

        // layout the chart
        // let width = this.width
        // let height = this.height
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

        bar.enter().append("rect")
            .attr("data_label", d => d.label)
            .on("click", function(d) {
                that.selected_bar = d3.select(this).attr('data_label');
                return goto();
            })
            .classed('overview', true)
            .classed('bar', true)
            .attr("x", function(d) { return 0; })
            .attr("y", function(d) { return y(d.label); })
            .attr("height", y.bandwidth())
            .style("fill", d3.color(that.color))
            .merge(bar)
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", function(d) { return x(d.value); })
            .delay(delay);

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
            .attr("fill", "rgb(51, 51, 51)")
            .attr("y", function(d) { return y(d.label) + y.bandwidth() / 2; })
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "end")
            .merge(titles)
            .attr("opacity", 1)
            .text(d => that.label_map[d.label].label_short)
            .attr("x", d => -15)

    }

    breakdown() {
        let new_container_height = 1900;
        d3.select(this.container_id).style('height', new_container_height)

        let selected_bar = this.selected_bar,
            data = this.data_tidy
            .filter(d => d.region == REGION && d.label == selected_bar && d.demographic != 'All'),
            margin = { top: 20, right: 2, bottom: 10, left: parseInt(this.container_width / 2) },
            width = this.container_width - margin.left - margin.right,
            // height = this.container_height - margin.top - margin.bottom,
            
            height = 25 *  data.length - margin.top - margin.bottom,
            bar_height = (height / data.length);

        if (!data.length) {
            console.warn(`No demographic breakdown data provided for selection: ${this.selected_bar}`);
            return 
        }

        var padding = 0.3,
            outerPadding = 0.3;

        this.svg = this.container.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

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

        this.x = d3.scaleLinear()
            .range([0, width]);

        this.rescale(this.x, data)

        this.z = d3.scaleOrdinal(d3.schemeCategory10);

        let x = this.x
        let y = this.y
        let z = this.z


        const t = d3.transition().duration(500);

        const delay = function(d, i) {
            return i * 10;
        };

        this.svg.selectAll(".overview").remove();
        this.svg.selectAll(".bar-g").remove()
        let bars = this.svg.append('g')
            .classed('bar-g', true)
            .classed('breakdown', true);


        let bar = bars.selectAll('.bar')
            .data(data)

        bar.exit().remove();

        bar.enter().append("rect")
            .classed('bar', true)
            .classed('breakdown', true)
            .attr("x", function(d) { return 0; })
            // .attr("y", function(d) { return y(d.demographic); })
            .attr("y", function(d, i) {
                return y(d.demographic) - a * v(d) / 2; //center the bar on the tick
            })
            // .attr("height", d => d.width * y.bandwidth())
            .attr("height", function(d) {
                return a * v(d); //`a` already accounts for both types of padding
            })
            .attr('fill', d => z(d.ix % 10))
            .merge(bar)
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", d=>x(d.value))
            .delay(delay);

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();


        value_labels.enter().append("text")
            .classed('value', true)
            .classed('breakdown', true)
            .attr("fill", "white")
            .attr("opacity", 0)
            .attr("y", function(d) { return y(d.demographic) ; })
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "end")
            .attr("font-size", d=>Math.min(18, a * v(d) * 0.95))
            .merge(value_labels)
            .transition(t)
            .attr("opacity", 1)
            .text(d => this.labelFormatter(d.value))
            .attr("x", d => x(d.value) - 7)
            .delay(delay);


        // this.svg.selectAll(".x--axis").remove()
        // // add the x Axis
        // this.svg.append("g")
        //     .attr("transform", "translate(0," + height + ")")
        //     .classed('axis', true)
        //     .classed('x--axis', true)
        //     .classed('breakdown', true)
        //     .call(d3.axisBottom(this.x).tickFormat(this.unitFormatter));


        this.svg.selectAll(".y--axis").remove()
        // add the y Axis
        this.svg.append("g")
            .attr("transform", "translate(-10, 0)")
            .attr("stroke-width", 0)
            .classed('axis', true)
            .classed('y--axis', true)
            .classed('breakdown', true)
            .call(d3.axisLeft(this.y));


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
            .text("\u276E back")
            .attr("x", 0)
            .attr("y", 0)
            .on("click", goto)


        this.svg.selectAll('.demoTitle').remove();
        let title = this.svg.append('g')
        let title_text = this.label_map[selected_bar].label_long || this.label_map[selected_bar].label_short;
        title.exit().remove();
        title.append('text')
            .classed('breakdown', true)
            .classed('.demoTitle', true)
            .attr('fill', "rgb(51, 51, 51)")
            .attr("text-anchor", "end")
            .text(title_text)
            .attr("x", width)
            .attr("y", 0);
    }
}

class StackedBarChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);

        this.selected_bar = null;
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.labels = Object.keys(data[0]).slice(3); // keys after region, group, and subgroup are values 
            // that.columns = [];
            that.label_map = that.toLabelMap(that.labels); //{};

            // for (let label of that.labels) {
            //     let obj = {}

            //     obj.label_list = label.split(";");
            //     obj.label_short = obj.label_list[0];
            //     obj.label_long = obj.label_list[1];
            //     obj.group = obj.label_list.slice(2).join('').trim();

            //     that.label_map[label] = obj;

            //     // if (!that.columns.includes(obj.group)) {
            //     //     that.columns.push(obj.group);
            //     // }
            // }

            // data.forEach(function(d) {
            //     for (let label of that.labels) {
            //         d[label] = +d[label];
            //     }

            //     d['concat_label'] = d.group + "-" + d.subgroup;
            //     if (!d.subgroup) {
            //         d['width'] = "large";
            //         d['label'] = d.group;
            //     } else {
            //         d['width'] = "normal";
            //         d['label'] = d.subgroup;
            //     }
            // });


            that.data_tidy = that.toTidy(data, that.labels)
            // data //.filter(d => d.group == "All")
            //     .forEach(function(d) {
            //         for (let label of that.labels) {
            //             var obj = {};
            //             obj['region'] = d['region'];
            //             obj['label'] = label;
            //             obj['value'] = d[label];
            //             obj['concat_label'] = d.group + "-" + d.subgroup;
            //             obj['column'] = that.label_map[label].group;
            //             if (!d.subgroup) {
            //                 obj['width'] = 1.5; // x times normal
            //                 obj['demographic'] = d.group;
            //             } else {
            //                 obj['width'] = 1; // x times normal
            //                 obj['demographic'] = d.subgroup;
            //             }
            //             data_tidy.push(obj)
            //         }
            //     })

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
            that.resize()
            that.update()

        });
    }

    update() {
        this.overview()

    }

    overview() {
        let that = this;
        this.data = this.dataGrouped.filter(d => d.region == REGION);


        this.margin = { top: 20, right: 70, bottom: 60, left: 20 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = 300; //this.container_height - this.margin.top - this.margin.bottom;
        this.layers = d3.stack()
            .keys(that.labels)
            (that.data)

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
        this.y = d3.scaleLinear().range([that.height, 0])
        // this.y.domain([0, d3.max(data, d => d3.sum(that.labels, k => +d[k]))]).nice();
        this.y.domain([0, d3.max(that.data, d => d.total)])

        // set the x range
        this.x = d3.scaleBand()
            .range([0, that.width])
            .padding(0.6);

        this.x.domain(that.layers[0].map(d => d.data.column))

        this.z = d3.scaleOrdinal(d3.schemeCategory10);

        let x = this.x;
        let y = this.y;
        let z = this.z;

        let n = Math.ceil(this.labels.length / 2)
        let size = 11;
        let padding = 6;
        let text_width = this.width / n;
        let itemWidth = size + padding + text_width + 5;
        let itemHeight = size + padding;

        this.legend = this.svg.selectAll('.legend');

        if (this.legend.empty()) {
            this.legend = this.svg
                .append("g")
                .classed('legend', 'true')
                .classed('overview', 'true')

            var legend_items = this.legend.selectAll('g')
                .data(that.labels)
                .enter()
                .append("g")
                .attr("transform", function(d, i) {
                    let xoff = i % n * itemWidth;
                    let yoff = ((Math.floor(i / n) * itemHeight) + that.height + 20);
                    return "translate(" + xoff + "," + yoff + ")";
                })

            var rects = legend_items.append('rect')
                .classed('legend-patch', true)
                .attr("width", size)
                .attr("height", size)

                .attr("fill", function(d, i) { return z(i); });

            var text = legend_items.append('text')
                .classed('legend-text', true)
                .attr("x", size + padding)
                .attr("y", size / 2)
                .attr('dy', '0.35em')
                .text(d => that.label_map[d].label_short);


            // legend = this.svg
            //     .append('g')
            //     .classed('legend', 'true')
            //     .classed('overview', 'true')



            // legend
            //     .append('g')
            //     .classed('legend-boxes', true)
            //     .selectAll('rect')
            //     .data(that.labels)
            //     .enter()
            //     .append("rect")
            //     .attr("x", function(d, i) { return i * (size + padding + text_width) })
            //     .attr("y", height + 20) // 100 is where the first dot appears. 25 is the distance between dots
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
            //     // .style("alignment-baseline", "middle")
            //     .attr("text-anchor", "start")
            //     .attr("font-size", "12pt")
            //     .attr("x", function(d, i) { return (size + padding) + i * (size + padding + text_width) })
            //     .attr("y", height + 20 + size / 2) // 100 is where the first dot appears. 25 is the distance between dots
            //     .attr("dy",  "0.35em" )
            //     .style("fill", function(d, i) { return z(i) })
            //     .text(function(d) { return that.label_map[d].label_short })


            // // vertical legend orientation
            // legend
            //     .append('g')
            //     .classed('legend-boxes', true)
            //     .selectAll('rect')
            //     .data(that.labels)
            //     .enter()
            //     .append("rect")
            //     .attr("x", (width) - 5)
            //     .attr("y", function(d, i) { return 0 + i * (size + padding) }) // 100 is where the first dot appears. 25 is the distance between dots
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
            //     .attr("y", function(d, i) { return 0 + i * (size + padding) }) // 100 is where the first dot appears. 25 is the distance between dots
            //     .attr("dy", function(d, i) { return 0 + ((size + padding) / 2) })
            //     .style("fill", function(d, i) { return z(i) })
            //     .text(function(d) { return that.label_map[d].label_short })
            //     .attr("text-anchor", "end")
            //     .style("alignment-baseline", "middle")
        }

        // let legend_width = -1
        // d3.selectAll('.legend-text text').nodes().forEach(
        //     function(d) {
        //         let bbox = d.getBBox()
        //         legend_width = legend_width < bbox.width ? bbox.width : legend_width;

        //     }
        // )
        // legend_width += (size + padding + 5)

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

        } else {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers);
        }

        let goto = this.breakdown.bind(this);

        this.bar = this.bars.selectAll('rect')

        this.bar.exit().remove();

        this.bar.data((d, i) => that.layers[i].filter(d => (d[1] - d[0] > 0)))
            .enter()
            .append('rect')
            .classed('stacked-bars', true)
            .classed('overview', true)
            .attr('x', d => x(d.data.column))
            .attr('y', d => that.height)
            .attr('height', d => 0)
            .attr('width', x.bandwidth())
            // .attr('data-xloc-left', d => x(d.data.column))
            // .attr('data-xloc-right', d => x(d.data.column) + x.bandwidth())
            // .attr('data-yloc-top', d => y(d[1]))
            // .attr('data-yloc-bottom', d => y(d[0]))
            .merge(that.bar)
            .attr('data-xloc-left', d => x(d.data.column))
            .attr('data-xloc-right', d => x(d.data.column) + x.bandwidth())
            .attr('data-yloc-top', d => y(d[1]))
            .attr('data-yloc-bottom', d => y(d[0]))
            .transition(that.t)
            .ease(d3.easeExp)
            .attr('y', d => (y(d[1])))
            .attr("height", d => y(d[0]) - y(d[1]))

            .delay(that.delay);

        this.xAxis = d3.axisBottom()
            .scale(x)

        this.yAxis = d3.axisRight()
            .scale(y)
            .ticks(5)

        this.svg.selectAll('.axis--y').remove()

        // this.svg.append('g')
        //     .attr('class', 'axis axis--x')
        //     .classed('overview', true)
        //     .attr('transform', `translate(0,${height/2})`)
        //     .call(that.xAxis)

        this.svg.append('g')
            .attr('class', 'axis axis--y')
            .classed('overview', true)
            .attr('transform', `translate(${that.width},0)`)
            .call(that.yAxis)

        // create a list of keys
        // console.log(keys)

        // Usually you have a color scale in your chart already

        // d3.scaleOrdinal()
        //   .domain(keys)
        //   .range(d3.schemeSet1);

        // Add one dot in the legend for each name.

        // this.svg.append("g")
        //     .classed('axis', true)
        //     .classed('y--axis', true)
        //     .classed('overview', true)
        //     .call(d3.axisLeft(this.y));




    }

}

class EduStackedBarChart extends StackedBarChart {
    constructor(container_id) {
        super(container_id);
    }

    overview() {
        super.overview()
        let that = this

        function cornerGetter(label, which) {

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

            return that.svg.select("g[data_label='" + label + "']").select('.stacked-bars').attr(corner) || null


        }

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
            var x0 = cornerGetter(d.source.top, 'right'),
                x1 = cornerGetter(d.target.top, 'left'),
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = cornerGetter(d.source.top, 'top'),
                y1 = cornerGetter(d.target.top, 'top'),
                // return trip
                x10 = cornerGetter(d.target.bottom, 'left'),
                x11 = cornerGetter(d.source.bottom, 'right'),
                x1i = d3.interpolateNumber(x10, x11),
                x12 = x1i(curvature),
                x13 = x1i(1 - curvature),
                y10 = cornerGetter(d.target.bottom, 'bottom'),
                y11 = cornerGetter(d.source.bottom, 'bottom');


            return (
                "M" + x0 + "," + y0 +
                "C" + x2 + "," + y0 +
                " " + x3 + "," + y1 +
                " " + x1 + "," + y1 +
                "L" + cornerGetter(d.target.bottom, 'left') + "," + cornerGetter(d.target.bottom, 'bottom') +
                "C" + x12 + "," + y10 +
                " " + x13 + "," + y11 +
                " " + x11 + "," + y11 +
                "L" + cornerGetter(d.source.bottom, 'right') + "," + cornerGetter(d.source.top, 'top')
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
                .style("opacity", 0)
                .attr("d", d => link(d))
                .transition(that.t)
                .ease(d3.easeExp)
                .style('opacity', 0.5)
                .delay(300);

        } else {
            var links = link_group.selectAll('.link')

            links.exit().remove()

            links.data(graph).enter().append("path")
                .classed("link", true)
                .merge(links)
                .transition(that.t)
                .ease(d3.easeExp)
                .attr("d", d => link(d))
                .style('opacity', 0.5)
                .delay(0);

        }
    }
}
