function RegionBarChart(container_id, url, ) {

    this.container_id = container_id;
    this.container = d3.select(container_id);
    this.url = url;
    this.chart_uid = container_id + "-" + url;
    this.units = UNITS.filter(d => this.container.node().classList.contains(d))[0].split("=")[1];
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

    this.view = "top";
}

RegionBarChart.prototype.init = function() {
    this.loadCSV();
}

RegionBarChart.prototype.update = function() {
    if (this.view == "top") {
        this.allDemographicsChart();
    } else {
        this.demographicBreakDownChart();
    };
}

RegionBarChart.prototype.gotoAllDemo = function() {
    this.view = "top";
    this.svg.selectAll(".demo").remove()
    this.update()
}

RegionBarChart.prototype.gotoDemoBreakDown = function() {
    this.view = "breakdown";
    this.svg.selectAll(".top").remove()
    this.update()
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

    let data = this.dataset.filter(d => d.region == REGION && d.supergroup == "All");

    // set the ranges
    // set the ranges
    this.y = d3.scaleBand()
        .range([0, this.height])
        .padding(0.2);

    this.x = d3.scaleLinear()
        .range([0, this.width]);

    if (this.units == "percent") {
        this.x.domain([0, 1]); //d3.max(data, function(d){ return d.values; })])
    } else {
        this.x.domain([0, Math.max([
            d3.max(this.dataset, d => d["values"]),
        ])])
    }
    // this.y.domain(data.map(function(d) { return d.region; })); // for top level region
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
        .on("click", goto)
        .classed('top', true)
        .classed('bar', true)
        .attr("x", function(d) { return 0; })
        .attr("y", function(d) { return y(d.label); })
        .attr("height", y.bandwidth())
        .merge(bar).transition(t)
        .ease(d3.easeExp)
        .attr("width", function(d) { return x(d.values); })
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
        .merge(value_labels).transition(t)
        .attr("opacity", 1)
        .text(d => this.labelFormatter(d.values))
        .attr("x", d => x(d.values) - 7)
        .delay(delay);

    if (this.svg.selectAll(".axis").empty()) {
        // only add if it's missing

        // add the x Axis
        this.svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .classed('axis', true)
            .classed('top', true)
            .call(d3.axisBottom(this.x).tickFormat(this.unitFormatter));

        // add the y Axis
        this.svg.append("g")
            .classed('axis', true)
            .classed('top', true)
            .call(d3.axisLeft(this.y));
    }
}

RegionBarChart.prototype.demographicBreakDownChart = function() {

    let data = this.dataset.filter(d => d.region == REGION && d.supergroup != "All");

    // set the ranges
    // set the ranges
    this.y = d3.scaleBand()
        .range([0, this.height])
        .padding(0.2);

    this.x = d3.scaleLinear()
        .range([0, this.width]);

    if (this.units == "percent") {
        this.x.domain([0, 1]); //d3.max(data, function(d){ return d.values; })])
    } else {
        this.x.domain([0, Math.max([
            d3.max(this.dataset, d => d["values"]),
        ])])
    }
    // this.y.domain(data.map(function(d) { return d.region; })); // for top level region
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
            .classed('demo', true);
    }

    let bar = bars.selectAll('.bar')
        .data(data)

    bar.exit().remove();

    bar.enter().append("rect")
        .classed('bar', true)
        .classed('demo', true)
        .attr("x", function(d) { return 0; })
        .attr("y", function(d) { return y(d.label); })
        .attr("height", y.bandwidth())
        .merge(bar).transition(t)
        .ease(d3.easeExp)
        .attr("width", function(d) { return x(d.values); })
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
        .merge(value_labels).transition(t)
        .attr("opacity", 1)
        .text(d => this.labelFormatter(d.values))
        .attr("x", d => x(d.values) - 7)
        .delay(delay);

    if (this.svg.selectAll(".axis").empty()) {
        // only add if it's missing

        // add the x Axis
        this.svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .classed('axis', true)
            .classed('demo', true)
            .call(d3.axisBottom(this.x).tickFormat(this.unitFormatter));

        // add the y Axis
        this.svg.append("g")
            .classed('axis', true)
            .classed('demo', true)
            .call(d3.axisLeft(this.y));
    }
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
        .attr("y", -5)
        .on("click", goto)
}


RegionBarChart.prototype.loadCSV = async function() {

    let that = this

    d3.csv(this.url, function(error, data) {
        if (error) throw error;
        data.forEach(function(d) {
            d.values = +d.values;
            d['label'] = d.supergroup + "-" + d.subgroup;
        });
        that.dataset = data;
        that.resize()
        that.update()
    });
}
