class BubbleChart extends RegionStatsBarChart {
    constructor(container_id) {
        super(container_id);
        this.selected_bubble = null;
        this.t = d3.transition().duration(750);
        this.delay = function(d, i) {
            return i * 60;
        };
    }

    loadData() {
        this.log('loading data')
        let that = this

        d3.csv(this.url, function(error, data) {
            if (error) throw error;
            that.raw_data = data;
            that.labels = toLabels(data);
            that.label_map = toLabelMap(that.labels);
            that.data_tidy = that.toTidy(data, that.labels);
            if (that.icon_url_list.length>0) {
                that.labels.map(function(e, i) {
                    that.icon_urls[e] = that.icon_url_list[i];
                });
            }
            that.draw_overview();

        });
    }

    loadOverviewData() {
        this.state = 'overview';
        let that = this;
        this.data = this.data_tidy.filter(d => (d.region == REGION) && (d.demographic == 'All'));
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

        let margin = { top: 10, right: 20, bottom: 10, left: 20 };
        let width = this.container_width - margin.left - margin.right;
        let max_height = 350;

        let max_bubble_dia = Math.min(max_height, (width / data.length) * 0.98);
        let height = max_bubble_dia * 1.05;
        let max_bubble_area = Math.PI * Math.pow(max_bubble_dia / 2, 2);
        let min_bubble_area = Math.PI * Math.pow(10, 2); // 10 px radius
        let max_data_value = d3.max(this.data_tidy.filter(d => d.demographic == 'All'), d => d.value)

        this.svg = this.container.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        this.svg.selectAll(".breakdown").remove();

        // set the x range
        this.x = d3.scaleBand()
            .range([0, width])

        this.x.domain(data.map(d => that.label_map[d.label].label_short))

        let bubbles = this.svg.selectAll(".bar-g")

        if (bubbles.empty()) {
            bubbles = this.svg.append('g')
                .classed('bar-g', true)
                .classed('overview', true);
        }

        data.forEach(function(d) {
            d.radius = Math.sqrt(map_range(d.value, 0, max_data_value, min_bubble_area, max_bubble_area) / Math.PI);
            d.cx = that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2;
            d.area = Math.PI * d.radius * d.radius;
            d.scaler = .6 * d.radius * 2;
        })

        let bubble = bubbles.selectAll('.bubble')
            .data(data)

        bubble.exit().remove();

        bubble.enter().append("circle")

            .classed('overview', true)
            .classed('bubble', true)

            .attr("cx", d => d.cx)
            .attr('cy', height - height / 2)
            .attr('r', 0)
            .attr('fill-opacity', 0.0)
            .merge(bubble)
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color) || "steelblue")
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            })
            .interrupt()
            .transition(that.t)
            .ease(d3.easeExp)
            .attr('r', d => d.radius)
            .attr("cx", d => d.cx)
            .attr('cy', height - height / 2)
            .attr('fill', d3.color(that.color || "steelblue"))
            .attr('fill-opacity', 1)
            .delay(that.delay);

        bubbles.selectAll('.bubble').classed('has-breakdown', d => d.hasBreakdown)

        
        if (Object.keys(that.icon_urls).length > 0) {
            let icons = bubbles.selectAll('.icon')
                .data(data)

            icons.exit().remove();

            icons.enter()
                .append("svg:image")
                .classed('icon', true)
                .classed('overview', true)
                .style("pointer-events", "none")
                .attr('xlink:href', (d, i) => that.icon_urls[d.label])
                .attr('x', d => d.cx - d.scaler / 2)
                .attr('y', d => (height - height / 2) - d.scaler / 2)
                .attr('width', d => d.scaler)
                .attr('height', d => d.scaler)
                .merge(icons)
                .interrupt()
                .transition(that.t)
                .ease(d3.easeExp)
                .attr('x', d => d.cx - d.scaler / 2)
                .attr('y', d => (height - height / 2) - d.scaler / 2)
                .attr('xlink:href', (d, i) => that.icon_urls[d.label])
                .attr('width', d => d.scaler)
                .attr('height', d => d.scaler)
                .delay(that.delay)

        } else {
            let value_labels = bubbles.selectAll(".value")
                .data(data);

            value_labels.exit().remove();

            value_labels.enter().append("text")
                .attr("class", "value")
                .classed('overview', true)
                .style("pointer-events", "none")
                .attr("fill", "white")
                .attr("fill-opacity", 0)
                .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
                .attr("y", height - height / 2)
                .attr("dy", "0.35em") //vertical align middle
                .attr("text-anchor", "middle")
                .merge(value_labels)
                .interrupt()
                .transition(that.t)
                .attr("fill-opacity", 1)
                .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
                .attr('y', height - height / 2)
                .attr("font-size", d => Math.min(0.45 * d.radius, 22))
                .text(d => that.labelFormatter(d.value))
                .delay(that.delay);

        }
        
        let text_labels = bubbles.selectAll(".text-labels")
            .data(data);

        text_labels.exit().remove();

        text_labels.enter().append("text")
            .classed("text-labels", true)
            .classed('overview', true)
            .attr("data_label", d => d.label)
            .attr("data_color", d => d3.color(that.color) || "steelblue")
            .attr("fill", " white")
            .attr("opacity", 0)
            .attr("y", e => (height - height / 2) + e.radius + 25)
            .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            .attr("font-size", Math.min(18, 250 * 0.95))
            .attr('dominant-baseline', 'middle')
            .attr("text-anchor", "middle")

            .each(function(d) {
                d = d3.select(this)
                    .text(e => that.label_map[e.label].label_short)
                   
                wrap(d, that.x.bandwidth() / 2);

                d = d3.select(this).selectAll('text,tspan')
                    .attr("y", e => (height - height / 2) + e.radius + 25)
                    .attr("x", e => that.x(that.label_map[e.label].label_short) + that.x.bandwidth() / 2)
            })

            .merge(text_labels)
            .on('touchstart touchend click mouseover mousemove mouseout', function(d) {
                that.overviewPointerHandler(d, this);
            })
            .interrupt()
            .transition(that.t)
            .ease(d3.easeExp)

            .attr("opacity", 1)
            
            .attr('fill', d3.color(that.color || "rgb(51, 51, 51)"))
            .attr("y", e => (height - height / 2) + e.radius + 25)
            .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            
            .delay(that.delay)
            .each(function(d) {
                d = d3.select(this)
                    .text(e => that.label_map[e.label].label_short)
                
                wrap(d, that.x.bandwidth() / 2);
            })
            .selectAll('text,tspan')
            .attr("y", e => (height - height / 2) + e.radius + 25)
            .attr("x", e => that.x(that.label_map[e.label].label_short) + that.x.bandwidth() / 2)
            
        let max_text_height = -1
        text_labels.each(
            function(d) {
                let _h = this.getBBox().height;
                max_text_height = _h > max_text_height ? _h : max_text_height;
            })

        // resize for label wraps.
        this.container.select('svg')
            .attr("height", height + margin.top + Math.max(margin.bottom, max_text_height * 1.15))
    }
}
