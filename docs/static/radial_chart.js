class RadialChart extends StackedBarChart {
    constructor(container_id) {
        super(container_id);
    }

    loadData() {
        super.loadData()

    }

    overview() {
        this.state = 'overview';
        let that = this;
        this.data = this.dataGrouped.filter(d => d.region == REGION);

        console.log(this.labels, this.label_map)


        this.margin = { top: 2, right: 2, bottom: 60, left: 2 };
        this.width = this.container_width - this.margin.left - this.margin.right;
        this.height = 300; //this.container_height - this.margin.top - this.margin.bottom;
        this.layers = d3.stack()
            .keys(that.labels)
            (that.data)


        this.layers2 = d3.nest()
		    .key(function(d) { return d.column; })
		    .entries(that.data_tidy.filter(d=>d.region==REGION && d.demographic=='All'))
		    .reverse();

		var pie = d3.pie()
		  .value(function(d) { return d.count; })
		  .sort(null);

		this.pie_data = d3.pie()

        // this.inner = [];
        // this.outer = [];


        // for (let l of this.data) {
        //     let inner_data = [];
        //     for (let label of this.labels) {
        //         if (l[label] > 0) {
        //             _data.push(l[label])
        //         }
        //     }
        //     this.layers['inner'] = _data;


        //     let outer_data = [];
        //     for (let label of this.labels) {
        //         _data.push(l[label])
        //     }
        //     this.layers['outer'] = _data;

        // }

        // return;


        var width = 460,
            height = 300,
            cwidth = 25;


        // // d3.v4
        // var color = d3.scaleOrdinal(d3.schemeCategory10);
        var pie = d3.pie().sort(null);
        var arc = d3.arc();

        // this.svg = this.container.select("svg")
        //     .attr("width", width)
        //     .attr("height", height)
        //     .append("g")
        //     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // var gs = this.svg.selectAll("g")
        //     .data(d3.values(that.layers))
        //     .enter()
        //     .append("g");

        // var path = gs.selectAll("path")
        //     .data(function(d, i) {
        //         return pie(d).map(function(item) {
        //             return { data: item, parentIndex: i };
        //         });
        //     })
        //     .enter().append("path")
        //     .attr("fill", function(d, i) { return color(i); })
        //     .attr("d", function(d, i) {
        //         return arc
        //             .innerRadius(10 + cwidth * d.parentIndex)
        //             .outerRadius(cwidth * (d.parentIndex + 1))(d.data);
        //     })
        //     .on('click', function(d, i) { console.log(that.labels[i]) });

        this.bars = this.svg.selectAll(".bar-g")

        if (this.bars.empty()) {
            this.bars = this.svg.selectAll(".bar-g")
                .data(that.layers)
                .enter()
                .append('g')
                .classed('bar-g', true)
                .classed('overview', true)
                .style('fill', (d, i) => (that.z(i)))
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

        this.bar
            // .data((d, i) => that.layers[i].filter(d => (d[1] - d[0] > 0)))
            .data(function(d, i) {
		        return pie(that.layers[i].filter(d => (d[1] - d[0] > 0))).map(function(item) {
		        	console.log(d, i)
		            return { data: (d[1] - d[0]), parentIndex: i };
		        });
		    })
            .enter()
            .append("path")
            .classed('stacked-bars', true)
            .classed('overview', true)
            // .attr("fill", function(d, i) { return that.z(i); })
            .attr("d", function(d, i) {
            	// console.log(d)
                return arc
                    .innerRadius(10 + cwidth * i)
                    .outerRadius(cwidth * (i + 1))(d.data);
            })


        // .append('rect')
        // .classed('stacked-bars', true)
        // .classed('overview', true)
        // .attr('y', d => that.height)

        // .merge(that.bar)
        // .interrupt()
        // .attr('x', d => x(d.data.column))
        // .attr('width', x.bandwidth())

        // .attr('data-xloc-left', d => x(d.data.column))
        // .attr('data-xloc-right', d => x(d.data.column) + x.bandwidth())
        // .attr('data-yloc-top', d => y(d[1]))
        // .attr('data-yloc-bottom', d => y(d[0]))
        // .transition(that.t)
        // .ease(d3.easeExp)
        // .attr('x', d => x(d.data.column))
        // .attr('width', x.bandwidth())
        // .attr('y', d => (y(d[1])))
        // .attr("height", d => y(d[0]) - y(d[1]))
        // .delay(that.delay);



    }


}
