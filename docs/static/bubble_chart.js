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
            that.labels = that.toLabels(data);
            that.label_map = that.toLabelMap(that.labels);
            that.data_tidy = that.toTidy(data, that.labels);
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

        let margin = { top: 2, right: 2, bottom: 20, left: 2 };
        that.width = this.container_width - margin.left - margin.right;
        let height = 200; //this.container_height - margin.top - margin.bottom;
        let max_bubble_area = Math.PI * Math.pow((height * 0.90) / 2, 2);
        let min_bubble_area = Math.PI * Math.pow(10, 2); // 10 px radius
        let max_data_value = d3.max(data, d => d.value);

        this.svg = this.container.select("svg")
            .attr("width", that.width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .select("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // set the x range
        this.x = d3.scaleBand()
            .range([0, that.width])
            .padding(0.6);

        this.x.domain(data.map(d => that.label_map[d.label].label_short))

        let bubbles = this.svg.selectAll(".bubble-g")

        if (bubbles.empty()) {
            bubbles = this.svg.append('g')
                .classed('bubble-g', true)
                .classed('overview', true);
        }

        let bubble = bubbles.selectAll('.bubble')
            .data(data)

        bubble.exit().remove();

        var goto = this.breakdown.bind(this);

        bubble.enter().append("circle")
            .attr("data_label", d => d.label)
            .on("click", function(d) {
                that.selected_bar = that.selected_bubble = d3.select(this).attr('data_label') ;
                console.log('selected bubble ', that.selected_bubble)
                return goto();
            })
            .classed('overview', true)
            .classed('bubble', true)
            .attr("cx", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            .attr('cy', height - height / 2)
            .attr('r', 0)
            .attr('fill-opacity', 0.0)
            .merge(bubble)
            .transition(that.t)
            .ease(d3.easeExp)
            .attr('r', d => Math.sqrt(
                map_range(d.value, 0, max_data_value, min_bubble_area, max_bubble_area) / Math.PI))
            .attr('fill', d3.color(that.color || "steelblue"))
            .attr('fill-opacity', 1)
            .delay(that.delay);

        let value_labels = bubbles.selectAll(".value")
            .data(data);

        value_labels.exit().remove();

        value_labels.enter().append("text")
            .attr("class", "value")
            .classed('overview', true)
            .attr("fill", "white")
            .attr("opacity", 0)
            .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            .attr("y", height - height / 2)
            .attr("dy", "0.35em") //vertical align middle
            .attr("text-anchor", "middle")
            
            .merge(value_labels)
            .transition(this.t)
            .attr("opacity", 1)
            .attr("font-size", d=>Math.min(
                0.85 * Math.sqrt(map_range(d.value, 0, max_data_value, min_bubble_area, max_bubble_area) / Math.PI)
                , 18))
            .text(d => this.labelFormatter(d.value))
            .delay(this.delay);

        let text_labels = bubbles.selectAll(".text-labels")
            .data(data);

        text_labels.exit().remove();

        text_labels.enter().append("text")
            .classed("text-labels", true)
            .classed('overview', true)
            .attr("fill", "black")
            .attr("opacity", 0)
            .attr("x", d => that.x(that.label_map[d.label].label_short) + that.x.bandwidth() / 2)
            
            .attr("dy", "1.0em") //vertical align middle
            .attr("text-anchor", "middle")
            .attr("font-size", Math.min(18, 250 * 0.95))
            .merge(text_labels)
            .transition(this.t)
            .attr("opacity", 1)
            .attr("y", d => height - height / 2 + Math.sqrt(
                map_range(d.value, 0, max_data_value, min_bubble_area, max_bubble_area) / Math.PI))
            .text(d => that.label_map[d.label].label_short)
            .delay(this.delay);

        // this.svg.append("g")
        //     .attr('transform', `translate(0,${height})`)
        //     .attr("stroke-width", 0)
        //     .classed('axis', true)
        //     .classed('x--axis', true)
        //     .classed('breakdown', true)
        //     .call(d3.axisBottom(this.x));
    }
}
