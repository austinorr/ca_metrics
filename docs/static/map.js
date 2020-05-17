function RegionMap(container_id, url, ) {

    // console.log('initializing map...')

    this.container_id = container_id;
    this.url = url;

    this.width = 600;
    this.height = 600;
    this.pad = 20;
    this.svg = d3.select(this.container_id)
        .append('svg')
        .attr('viewBox', "0 0" + " " + this.width + " " + this.height)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .classed(container_id, true);

    this.projection = d3.geoConicEqualArea()
        .parallels([34, 40.5])
        .rotate([120, 0]);

    this.path = d3.geoPath()
        .projection(this.projection);

    this.colors = REGION_COLORS || ["#1f77b4"];
    this.feature_obj = null;
}


RegionMap.prototype.init = function() {
    this.loadJson();
    // console.log('map initialized')
}

RegionMap.prototype.loadJson = async function() {

    let that = this

    d3.json(that.url, function(error, ca) {
        if (error) throw error;
        that.feature_obj = topojson.feature(ca, ca.objects.data)

        that.projection.fitExtent([
            [that.pad, that.pad],
            [that.width - that.pad, that.height - that.pad]
        ], that.feature_obj)

        let nRegions = d3.max(that.feature_obj.features, d => d.properties.region_id)

        for (var i = 0; i < nRegions + 1; i++) {
            var region_features = that.feature_obj.features.filter(d => d.properties.region_id == i);
            that.svg.append("g")
                .attr("class", "counties region_" + i)
                .selectAll("path")
                .data(region_features)
                .enter().append("path")
                .attr("d", that.path)
                .style("fill", (d) => that.colors[d.properties.region_id])
                .on("click", that.clicked);
        }
    });
}

RegionMap.prototype.clicked = function() {

    let region_id = d3.select(this).data()[0].properties.region_id,
        selected_region = d3.select("svg .counties.region_" + region_id);

    if (selected_region.classed('active-region')) {
        d3.selectAll(".active-region").classed('active-region', false);
        d3.selectAll(".countySelected").remove();
        REGION = "Statewide";

    } else {
        d3.selectAll(".active-region").classed('active-region', false);
        d3.selectAll(".countySelected").remove();

        selected_region.classed('active-region', true)
        REGION = d3.select(this).data()[0].properties.region

        let bbox = d3.select(this).node().getBBox(),

            cx = bbox.x + bbox.width / 2,
            cy = bbox.y + bbox.height / 2,
            scaler = REGION_POP_SCALER,
            color = d3.select(this).style('fill');


        let shadow = addDropShadowFilter(selected_region.clone(true), 5, 0, 0)
            .classed('countySelected', true)
            .raise()
            .style('color', color)
            .style('opacity', .8)
            .style('pointer-events', 'none')
            .style("filter", "url(#drop-shadow)");


        let pop_region = selected_region.clone(true)
            .classed('countySelected', true)
            .raise()
            .style('fill', color)
            .style('fill-opacity', 1)
            .style('pointer-events', 'none')
            .transition()
            .duration(50)
            .attr(
                "transform",
                "translate(" + (1 - scaler) * cx + ", " + (1 - scaler) * cy + ") scale(" + scaler + ")");

    }

}
