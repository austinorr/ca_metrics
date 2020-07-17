class RegionStatsBarChart extends BaseChart {
    constructor(container_id) {
        super(container_id);

        this.selected_bar = null;
        this.state = null;
    }

    resize() {
        super.resize();
        this.update();
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

    update() {
        super.update()
        switch (this.state) {
            case "overview":
                this.log("resize overview")
                this.draw_overview();
                break;
            case "breakdown":
                this.log("resize breakdown")
                this.breakdown();
                break;
        }

    }

    draw_overview() {
        try {
            this.overview();
        } catch (error) {
            console.error(error)
        }
    }

    loadOverviewData() {
        let that = this;
        this.state = 'overview';
        this.data = this.data_tidy
            .filter(d => (d.region == REGION && d.demographic == 'All'));

        this.checkData(this.data)
        this.data
            .forEach(
                function(d) {
                    d.hasBreakdown = that.checkIfBreakdown(d);
                }
            );
        if (this.sort == 'ascending') {
            this.data.sort(function(a, b) { return d3.ascending(a.value, b.value); });
        } else if (this.sort == 'descending') {
            this.data.sort(function(a, b) { return d3.descending(a.value, b.value); });
        }
        if (this.limit_to > 0) {
            this.data = this.data.slice(0, this.limit_to)
        } else {
            this.data = this.data.slice(this.limit_to)
        }
    }

    overview() {
        this.loadOverviewData();
        let that = this;

        let data = this.data;

        if (data.length == 1 && (this.title == "null" || this.title === null)) {
            this.title = this.label_map[data[0].label].label_short;
        } else if (this.title == "null" || this.title === null) {
            this.title = null;
        }

        let margin = {
            top: data.length > 1 ? 30 : 30,
            right: 100,
            bottom: 5,
            left: 150
        };
        let width = Math.max(0, this.container_width - margin.left - margin.right);
        let bar_height = 50;
        bar_height = data.length == 1 ? bar_height : bar_height * .66;
        let height = bar_height * data.length;

        let icon_group = this.svg.selectAll(".icon-g")
        let icons = this.svg.selectAll(".icon")
        let title = this.svg.selectAll('.title')

        if (icon_group.empty()) {
            icon_group = this.svg.append('g')
                .classed('icon-g', true)
                .classed('overview', true);

            title = icon_group.append('text')
                .classed("title", true)
                .classed('overview', true)
            title.exit().remove();

            icons = icon_group.append("svg:image")
                .classed('icon', true)
                .classed('overview', true)
        }

        let title_center = margin.left / 2;
        let title_text_anchor = 'middle';
        let title_text_dy = "1em";
        let title_text_y = height / 2;
        let title_text_x = -title_center;
        let text_wrap_width = margin.left * 0.95;
        let text_alignment_baseline = 'bottom';
        let text_wrap_direction = 1;

        if (data.length > 1) {
            title_text_anchor = 'start';
            title_text_dy = "0em";
            title_text_y = -margin.top / 2;
            title_text_x = -title_center + Math.min((bar_height / 2 + margin.top), margin.left / 2) / 2 + 6;
            text_wrap_width = width + margin.left/2 + margin.right - 25;
            text_alignment_baseline = 'middle';
            text_wrap_direction = 1;
        }

        title
            .attr("fill", that.color)
            .attr("y", title_text_y)
            .attr("dy", title_text_dy)
            .attr("text-anchor", title_text_anchor)
            .attr('dominant-baseline', text_alignment_baseline)
            .merge(title)
            .text(d => that.title)
            .attr("x", title_text_x)

        wrap(title, text_wrap_width, text_wrap_direction) // text object and width in pixels, direction up or down


        let title_text_bbox = title.node().getBBox();
        // let lineheight = title.selectAll('tspan').nodes()[0].getClientHeight();
        // console.log(lineheight)
        let svg_stretch = 0;
        let constraint = 0;

        let icon_width = this.icon_url_list.length > 0 ? Math.min((bar_height / 2 + margin.top), margin.left / 2) : 1,
            icon_height = icon_width,
            icon_vert_translate = -icon_height,
            icon_y = height / 2;

        if (data.length > 1) {
            // icon_width = Math.min((bar_height / 2 + margin.top), margin.left / 2);
            icon_height = icon_width;
            icon_vert_translate = -icon_height / 2;
            icon_y = title_text_bbox.y + title_text_bbox.height / 2;
        }

        icons
            .style("pointer-events", "none")
            .attr('xlink:href', that.icon_url_list[0])
            .attr('x', -title_center)
            .attr('y', icon_y)
            .attr('width', icon_width)
            .attr('height', icon_height)
            .attr('transform', `translate(${-(icon_width)/2}, ${icon_vert_translate})`)

        let icon_bbox = icons.node().getBBox();

        if (data.length > 1) {
            svg_stretch = Math.max(icon_bbox.height, title_text_bbox.height);
            constraint = margin.top;
            margin.top = Math.max(constraint, svg_stretch);
            title.selectAll('tspan').attr('y', -margin.top / 2)
            icons.attr('y', -svg_stretch / 2)

        } else {
            svg_stretch = this.container_height - title_text_bbox.y + title_text_bbox.height;
            constraint = this.container_height;
            margin.bottom += Math.max(0, svg_stretch - constraint)
        }

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
        this.y.domain(data.map(d => d.label));

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

        bar.enter().append("rect")
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color))
            .classed('overview', true)
            .classed('bar', true)
            .attr("x", function(d) { return 0; })
            .attr("y", d => y(d.label))
            .attr("height", y.bandwidth())
            .style("fill", d3.color(that.color))
            .merge(bar)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            })

            .interrupt()
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", d => Math.max(0, x(d.value)))
            .delay(delay);

        bars.selectAll('.bar').classed('has-breakdown', d => d.hasBreakdown)

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();

        value_labels.enter().append("text")
            .attr("class", "value")
            .classed('overview', true)
            
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color))
            .attr("fill", "white")
            .attr("opacity", 0)
            .attr("y", d => y(d.label) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .attr("font-size", Math.min(18, y.bandwidth() * 0.95))
            .merge(value_labels)
            .classed('has-breakdown', d => d.hasBreakdown)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                if (d._no_tts) {
                    return false;
                }
                that.overviewPointerHandler(d, this);
            })
            .interrupt()
            .transition(t)
            .attr("opacity", 1)
            .text(function(d) {
                let label = null;
                if (d.value == 'null' || d.value == null || d.value == "undefined") {
                    d._no_tts = true;
                    d3.select(this).classed('data-unavailable', true)
                    return that.no_data_text;
                } else {
                    return that.labelFormatter(d.value);
                }
            })
            .attr("text-anchor", "start")
            .attr("x", d => Math.max(0, x(d.value)) + 7)
            .attr("fill", d => "rgb(51, 51, 51)")
            .delay(delay);


        let _max_width = margin.left - 20

        if (data.length > 1) {
            let titles = bars.selectAll(".titles")
                .data(data);

            titles.exit().remove();

            titles.enter().append("text")
                .classed("titles", true)
                .classed('overview', true)
                .attr("fill", this.color)
                .attr("y", d => y(d.label) + y.bandwidth() / 2)
                .attr("x", d => -15)
                .attr("dominant-baseline", "middle")
                // .attr("dy", "0.35em")
                .attr("text-anchor", "end")

                .merge(titles)
                .text(d => that.label_map[d.label].label_short)
                .each(function(d) {
                    let _t = d3.select(this);
                    let _t_width = _t.node().getBBox().width;
                    d.too_long = _t_width > _max_width;
                })
                .attr("opacity", 1)
                .each(function(d) {
                    let _t = d3.select(this);

                    if (d.too_long) {
                        _t
                            .attr("y", d => y(d.label))
                            .attr("dominant-baseline", 'hanging')
                    } else {
                        _t
                            .attr("y", d => y(d.label) + y.bandwidth() / 2)
                            .attr("dominant-baseline", "middle")
                    }
                    wrap(_t, _max_width);
                })
        }
    }

    breakdown() {
        let selected_bar = this.selected_bar,
            that = this,
            data = this.data_tidy.filter(d => d.region == REGION && d.label == selected_bar && d.demographic != 'All' && d.value != null),
            margin = { top: 30, right: 100, bottom: 10, left: 200 },
            width = this.container_width - margin.left - margin.right,
            height = 35 * data.length;

        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)

        if (!data.length) {
            console.warn(`No demographic breakdown data provided for selection: ${this.selected_bar}`);
            return
        } else {
            this.state = "breakdown";
        }

        var padding = 0.3,
            outerPadding = 0.05;

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

        var a = alpha(data, v), // scale factor between value and bar width
            mid = Midi(data, v, a), // mid-point displacement of bar i
            w = Wi(data, v, a); // width of bar i

        this.y = d3.scaleOrdinal()
            .range(data.map(mid))
            .domain(data.map(function(d) { return d.demographic; }));

        let y = this.y
        let z = (this.color_cycle) || (i => ["#eee"][i]);

        const t = d3.transition().duration(500);

        const delay = function(d, i) {
            return i * 10;
        };

        this.svg.selectAll(".overview").remove();

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
        let _max_width = margin.left-15;

        demo_labels.enter().append("text")
            .classed("demo_labels", true)
            .classed('breakdown', true)
            .attr('fill', d => z(d.ix))
            .attr("y", d => y(d.demographic))
            .attr("x", d => -15)
            .attr("dominant-baseline", "middle")
            // .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "end")
            .attr("font-size", d => Math.max(12, Math.min(16, a * v(d) * 0.95)))
            .merge(demo_labels)
            .attr("opacity", 1)
            .text(d => d.demographic)
            .each(function(d) {
                let _t = d3.select(this);
                let _t_width = _t.node().getBBox().width;
                d.too_long = _t_width > _max_width;
            })
            .each(function(d) {
                let _t = d3.select(this);

                if (d.too_long) {
                    _t
                        .attr("y", d => y(d.demographic) - a * v(d) / 2)
                        .attr("dominant-baseline", 'hanging')
                } else {
                    _t
                        .attr("y", d => y(d.demographic))
                        .attr("dominant-baseline", "middle")
                }
                wrap(_t, _max_width);
            })

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
            .attr("x", 0)
            .attr("y", d => y(d.demographic) - a * v(d) / 2) //center the bar on the tick
            .attr("height", (d, i) => w(i))//a * v(d)) //`a` already accounts for both types of padding
            .attr('fill', d => z(d.ix))
            .merge(bar)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.breakdownPointerHandler(d, this);
            })
            .interrupt()
            .transition(t)
            .ease(d3.easeExp)
            .attr("width", d => Math.max(0, x(d.value)))
            .delay(delay);

        let value_labels = bars.selectAll(".value")
            .data(data);

        value_labels.exit().remove();

        value_labels.enter().append("text")
            .classed('value', true)
            .classed('breakdown', true)
            .attr("fill", "rgb(51, 51, 51)")
            .attr("opacity", 0)
            .attr("y", d => y(d.demographic))
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "start")
            .attr("font-size", d => Math.max(14, Math.min(18, a * v(d) * 0.95)))
            .merge(value_labels)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.breakdownPointerHandler(d, this);
            })
            .interrupt()
            .transition(t)
            .attr("opacity", 1)
            .text(d => this.labelFormatter(d.value))
            .attr("x", d => Math.max(0, x(d.value)) + 7)
            .delay(delay);


        let goto = this.overview.bind(this)
        let backbutton = this.svg.selectAll('.backbutton');
        if (backbutton.empty()) {
            backbutton = this.svg.append('g').classed('breakdown', true);
            backbutton.exit().remove();
            backbutton.append('text')
                .classed('backbutton', true)
                .classed('breakdown', true)
                .attr('fill', "rgb(51, 51, 51)")
                .attr("text-anchor", "end")
                .text("\u276E back")
                .attr('dominant-baseline', 'hanging')
                .attr("x", width + margin.right - 10)
                .attr("y", 0 - margin.top)
                .on("click", goto)
        }
        backbutton
            .transition(t)
            .ease(d3.easeExp)
            .attr("x", width + margin.right - 10)
            .delay(delay);


        this.svg.selectAll('.demoTitle-group').remove();
        let title = this.svg.append('g').classed('breakdown', true).classed('demoTitle-group', true);
        let title_text = this.label_map[selected_bar].label_short;

        title.exit().remove();
        title.append('text')
            .classed('breakdown', true)
            .classed('demoTitle', true)
            .attr('dominant-baseline', 'hanging')
            .attr('fill', that.breakdownTitleColor || that.color)
            .attr("text-anchor", "start")
            .text(title_text)
            .attr("x", 0)
            .attr("y", 0 - margin.top);

        wrap(title.select('text.demoTitle'), width)
    }
}

class StackedBarChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
        this.z = (this.color_cycle) || (i => ["#eee"][i]);
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.labels = toLabels(data); // keys after region, group, and subgroup are values 
            that.label_map = toLabelMap(that.labels);
            that.data_tidy = that.toTidy(data, that.labels)

            let dataGrouped = [];
            let data_tidy_slice = that.data_tidy.filter(d => (d.demographic == 'All'))
            let regions = d3.map(that.data_tidy, d => d.region).keys()
            let columns = d3.map(that.data_tidy, d => that.label_map[d.label].column).keys()
            let maxGroupedValue = -1;
            for (let region of regions) {
                for (let column of columns) {
                    let _gdata = data_tidy_slice.filter(
                        d => d.region == region && that.label_map[d.label].column == column
                    )
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

            that.draw_overview()
            // that.resize()

        });
    }

    // update() {
    //     super.update();
    // }

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
        let legend_entries = {}

        this.layers
            .forEach(function(d) {
                if (d.column in legend_entries) {
                    legend_entries[d.column].push(d.label)
                } else {
                    legend_entries[d.column] = [d.label]
                }
            })

        for (let entry in legend_entries) {
            legend_entries[entry].reverse()
        }

        let size = 11;
        let padding = 6;
        let itemHeight = size + padding;

        this.svg.selectAll('.legend').remove()
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
            .data(that.layers)
            .enter()
            .append("g")
            .classed('has-breakdown', d => d.hasBreakdown)

        legend_items.exit().remove();

        var rects = legend_items.append('rect');

        this.legend_height_required = -1;

        rects.merge(rects)
            .classed('legend-patch', true)
            .attr("width", size)
            .attr("height", size)
            .attr("transform", function(d, i) {
                let xoff = that.x(d.column);
                let yoff = (
                    (legend_entries[d.column].indexOf(d.label) *
                        itemHeight) + that.height + (2 * padding + size)
                );
                if (yoff > that.legend_height_required) {
                    that.legend_height_required = yoff;
                }
                return "translate(" + xoff + "," + yoff + ")";
            })
            .attr("fill", function(d, i) { return that.z(i); })
            .attr("data_label", (d, i) => d.key)
            .attr("data_color", function(d, i) { return that.z(i); })
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            });


        that.legend_height_required += padding

        var text = legend_items.append('text');
        text.merge(text)
            .classed('legend-text', true)
            .attr("x", size + padding)
            .attr("y", size / 2)
            .attr('dy', '0.35em')
            .attr("transform", function(d, i) {
                let xoff = that.x(d.column);
                let yoff = (
                    (legend_entries[d.column].indexOf(d.label) *
                        itemHeight) + that.height + (2 * padding + size)
                );
                return "translate(" + xoff + "," + yoff + ")";
            })
            .text(d => d.label_short)
            .attr("data_label", (d, i) => d.key)
            .attr("data_color", function(d, i) { return that.z(i); })
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            });

    }

    overview() {
        this.state = 'overview';
        let that = this;
        this.data = this.dataGrouped.filter(d => d.region == REGION);

        this.checkData(this.data)

        this.margin = { top: 20, right: 2, bottom: 20, left: 2 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;
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
            d.hasBreakdown = that.checkIfBreakdown(d);
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
        this.container.select('svg')
            .attr("height", Math.max(that.height, that.legend_height_required) + that.margin.top + that.margin.bottom)

        var show_tooltip = this.tooltip_show.bind(this)
        var move_tooltip = this.tooltip_move.bind(this)
        var hide_tooltip = this.tooltip_hide.bind(this)
        var on_touch = this.on_touch.bind(this)

        this.bars = this.svg.selectAll(".bar-g")

        if (this.bars.empty()) {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers)
                .enter()
                .append('g')
                .classed('bar-g', true)
                .classed('overview', true)
                // .classed('has-breakdown', d=>that.checkIfBreakdown(d.label))
                .attr('fill', (d, i) => (z(i)))
                .attr("data_label", (d, i) => d.key)
                .attr("data_color", (d, i) => (z(i)))

                .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                    that.overviewPointerHandler(d, this);
                })

        } else {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers);
        }
        this.bars
            .classed('has-breakdown', d => d.hasBreakdown);

        let goto = this.breakdown.bind(this);

        this.bar = this.bars.selectAll('rect')

        this.bar.exit().remove();

        this.bar
            .data((d, i) => that.layers[i].filter(d => (d[1] - d[0] > 0)))
            .enter()
            .append('rect')
            .classed('stacked-bars', true)
            .classed('bar', true)
            .classed('overview', true)
            .attr('y', d => that.height)

            .merge(that.bar)

            .attr('x', d => x(d.data.column))
            .attr('width', x.bandwidth())

            .attr('data-xloc-left', d => x(d.data.column))
            .attr('data-xloc-right', d => x(d.data.column) + x.bandwidth())
            .attr('data-yloc-top', d => y(d[1]))
            .attr('data-yloc-bottom', d => y(d[0]))
            .interrupt()
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
    }

    resize() {
        this.svg.selectAll(".link-group").remove();
        super.resize();

    }

    overview() {


        let that = this
        this.z = i => [
            "#36768B",
            "#8A9337",
            "#C64241",
            "#c66f2c",
            "#834778",
            "#C7A630",
            "#878787",
        ][i];

        super.overview()

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
            // .delay(that.delay);

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
            // .delay(that.delay);
        }
    }
}
