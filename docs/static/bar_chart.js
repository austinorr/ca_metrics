function RegionBarChart(container_id, ) {

    this.container_id = container_id;
    this.container = d3.select(container_id);
    this.url = this.container.attr("_viz_source");
    this.chart_uid = container_id + "-" + this.url;
    this.units = UNITS.filter(d => d == this.container.attr('_viz_units'));
    this.unitFormatter = getAxisFormatter(this.units);
    this.labelFormatter = getLabelFormatter(this.units)

    this.margin = { top: 20, right: 40, bottom: 30, left: 100 };
    this.width = parseInt(d3.select(this.container_id).style("width")) - this.margin.left - this.margin.right;
    this.height = parseInt(d3.select(this.container_id).style("height")) - this.margin.top - this.margin.bottom;

    this.svg = this.container.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + this.margin.left + "," + this.margin.top + ")");

    // this.view = "top";
    this.selected_bar = null;
}

RegionBarChart.prototype.init = function() {
    this.loadCSV();
}

RegionBarChart.prototype.update = function() {
    if (DEBUG) {
        console.log('updating bar chart: ' + this.container_id)
    }
    // if (this.view == "top") {
    //     this.allDemographicsChart();
    // } else {
    //     this.demographicBreakDownChart();
    // };

    // force updates to return to the summary rather than re-rendering the demographic breakdown.
    this.gotoAllDemo()
}

RegionBarChart.prototype.gotoAllDemo = function() {
    // this.view = "top";
    this.svg.selectAll(".demo").remove();
    // this.update();
    this.allDemographicsChart();
}

RegionBarChart.prototype.gotoDemoBreakDown = function() {
    // this.view = "breakdown";
    this.svg.selectAll(".top").remove();
    // this.update();
    this.demographicBreakDownChart();
}

RegionBarChart.prototype.resize = function() {
    // console.log('resized!')

    // this.container.selectAll("svg").remove()

    // this.width = parseInt(d3.select(this.container_id).style("width")) - this.margin.left - this.margin.right;
    // this.height = parseInt(d3.select(this.container_id).style("height")) - this.margin.top - this.margin.bottom;

    // this.svg = this.svg
    //     .attr("width", this.width + this.margin.left + this.margin.right)
    //     .attr("height", this.height + this.margin.top + this.margin.bottom)
    //     .append("g")
    //     .attr("transform",
    //         "translate(" + this.margin.left + "," + this.margin.top + ")");
    // this.update()
}

RegionBarChart.prototype.allDemographicsChart = function() {

    let data = this.dataAllLong.filter(d => d.region == REGION);
    let that = this;

    // set the ranges
    // set the ranges
    this.y = d3.scaleBand()
        .range([0, this.height])
        .padding(0.6);

    this.x = d3.scaleLinear()
        .range([0, this.width]);

    if (this.units == "percent") {
        this.x.domain([0, 1]); //d3.max(data, function(d){ return d.values; })])
    } else {
        this.x.domain([0, Math.max([
            d3.max(this.dataset, d => d["values"]), // use the max from the whole dataset
        ])])
    }
    this.y.domain(data.map(function(d) { return d.label; })); // for demographics

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin

    let width = this.width
    let height = this.height
    let x = this.x
    let y = this.y

    const t = d3.transition().duration(500);

    const delay = function(d, i) {
        return i * 10;
    };

    let bars = this.svg.selectAll(".bar-g")

    if (bars.empty()) {
        bars = this.svg.append('g')
            .classed('bar-g', true)
            .classed('top', true);
    }

    let bar = bars.selectAll('.bar')
        .data(data)

    bar.exit().remove();

    var goto = this.gotoDemoBreakDown.bind(this)

    bar.enter().append("rect")
        .on("click", function(d) {
            that.selected_bar = d3.select(this).attr('data_label');
            return goto();
        })
        .classed('top', true)
        .classed('bar', true)
        .attr("x", function(d) { return 0; })
        .attr("y", function(d) { return y(d.label); })
        .attr("data_label", d => d.label)
        .attr("height", y.bandwidth())
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
        .classed('top', true)
        .attr("fill", "white")
        .attr("opacity", 0)
        .attr("y", function(d) { return y(d.label) + y.bandwidth() / 2; })
        .attr("dy", "0.35em") //vertical align middle
        .attr("text-anchor", "end")
        .attr("font-size", Math.max([40, y.bandwidth() * 0.8]))
        .merge(value_labels)
        .transition(t)
        .attr("opacity", 1)
        .text(d => this.labelFormatter(d.value))
        .attr("x", d => x(d.value) - 7)
        .delay(delay);

    this.svg.selectAll(".x--axis").remove()
    // add the x Axis
    // this.svg.append("g")
    //     .attr("transform", "translate(0," + this.height + ")")
    //     .classed('axis', true)
    //     .classed('x--axis', true)
    //     .classed('top', true)
    //     .call(d3.axisBottom(this.x).tickFormat(this.unitFormatter));


    // this.svg.selectAll(".y--axis").remove()
    // // add the y Axis
    // this.svg.append("g")
    //     .classed('axis', true)
    //     .classed('y--axis', true)
    //     .classed('top', true)
    //     .call(d3.axisLeft(this.y));

    let titles = bars.selectAll(".title")
        .data(data);

    titles.exit().remove();

    titles.enter().append("text")
        .classed("title", true)
        .classed('top', true)
        .attr("fill", "rgb(51, 51, 51)")
        .attr("y", function(d) { return y(d.label) - y.bandwidth() / 2; })
        .attr("dy", "0.35em") //vertical align middle
        .attr("text-anchor", "start")
        .merge(titles)
        .attr("opacity", 1)
        .text(d => d.label)
        .attr("x", d => 0)

}

RegionBarChart.prototype.demographicBreakDownChart = function() {

    let data = this.dataset.filter(d => d.region == REGION);
    let value = this.selected_bar

    // set the ranges
    this.y = d3.scaleBand()
        .range([10, this.height])
        .padding(0.2);

    this.x = d3.scaleLinear()
        .range([0, this.width]);

    if (this.units == "percent") {
        this.x.domain([0, 1]);
    } else {
        this.x.domain([0, Math.max([
            d3.max(this.dataset, d => d[values]),
        ])])
    }
    this.y.domain(data.map(function(d) { return d.label; })); // for demographics

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin

    let width = this.width
    let height = this.height
    let x = this.x
    let y = this.y

    const t = d3.transition().duration(500);

    const delay = function(d, i) {
        return i * 10;
    };

    this.svg.selectAll(".bar-g").remove()
    let bars = this.svg.append('g')
        .classed('bar-g', true)
        .classed('demo', true);


    let bar = bars.selectAll('.bar')
        .data(data)

    bar.exit().remove();

    bar.enter().append("rect")
        .classed('bar', true)
        .classed('demo', true)
        .attr("x", function(d) { return 0; })
        .attr("y", function(d) { return y(d.label); })
        .attr("height", y.bandwidth())
        .merge(bar)
        .transition(t)
        .ease(d3.easeExp)
        .attr("width", function(d) { return x(d[value]); })
        .delay(delay);

    let value_labels = bars.selectAll(".value")
        .data(data);

    value_labels.exit().remove();

    value_labels.enter().append("text")
        .classed('value', true)
        .classed('demo', true)
        .attr("fill", "white")
        .attr("opacity", 0)
        .attr("y", function(d) { return y(d.label) + y.bandwidth() / 2; })
        .attr("dy", "0.35em") //vertical align middle
        .attr("text-anchor", "end")
        .attr("font-size", y.bandwidth() * 0.8)
        .merge(value_labels)
        .transition(t)
        .attr("opacity", 1)
        .text(d => this.labelFormatter(d[value]))
        .attr("x", d => x(d[value]) - 7)
        .delay(delay);


    this.svg.selectAll(".x--axis").remove()
    // add the x Axis
    // this.svg.append("g")
    //     .attr("transform", "translate(0," + this.height + ")")
    //     .classed('axis', true)
    //     .classed('x--axis', true)
    //     .classed('demo', true)
    //     .call(d3.axisBottom(this.x).tickFormat(this.unitFormatter));


    this.svg.selectAll(".y--axis").remove()
    // add the y Axis
    this.svg.append("g")
        .classed('axis', true)
        .classed('y--axis', true)
        .classed('demo', true)
        .call(d3.axisLeft(this.y));


    let goto = this.gotoAllDemo.bind(this)
    let backbutton = this.svg.selectAll('.backbutton');
    if (backbutton.empty()) {
        backbutton = this.svg.append('g');
    }
    backbutton.exit().remove();
    backbutton.append('text')
        .classed('backbutton', true)
        .classed('demo', true)
        .attr('fill', "rgb(51, 51, 51)")
        .text("\u276E back")
        .attr("x", 0)
        .attr("y", 0)
        .on("click", goto)


    this.svg.selectAll('.demoTitle').remove();
    let title = this.svg.append('g')
    title.exit().remove();
    title.append('text')
        .classed('demo', true)
        .classed('.demoTitle', true)
        .attr('fill', "rgb(51, 51, 51)")
        .attr("text-anchor", "end")
        .text(value)
        .attr("x", width)
        .attr("y", 0);


}


RegionBarChart.prototype.loadCSV = async function() {

    let that = this

    d3.csv(this.url, function(error, data) {
        if (error) throw error;


        var labels = Object.keys(data[0]).slice(3); // keys after region, supergroup, and subgroup are values 

        data.forEach(function(d) {
            for (label of labels) {
                d[label] = +d[label];
            }

            d['concat_label'] = d.supergroup + "-" + d.subgroup;
            if (!d.subgroup) {
                d['width'] = "large";
                d['label'] = d.supergroup;
            } else {
                d['width'] = "normal";
                d['label'] = d.subgroup;
            }
        });

        var dataAllLong = [];
        data.filter(d => d.supergroup == "All")
            .forEach(function(d) {
                for (label of labels) {
                    var obj = {};
                    obj['region'] = d['region']
                    obj['label'] = label;
                    obj['value'] = d[label];
                    dataAllLong.push(obj)
                }
            })

        that.dataset = data.filter(d => d.supergroup != "All");
        that.labels = labels;
        that.dataAllLong = dataAllLong
        that.resize()
        that.update()
        if (DEBUG) {
            console.log('load data and redraw bar from scratch: ' + that.container_id)
        }
    });
}
