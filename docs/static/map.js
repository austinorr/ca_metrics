class BaseMap {
    constructor(container_id) {

        this.container_id = container_id;
        this.container = d3.select(container_id);
        this.url = this.container.attr("_viz_source");
        this.chart_uid = container_id + "-" + this.url;
        this.container_width = parseInt(d3.select(this.container_id).style("width"))
        this.container_height = parseInt(d3.select(this.container_id).style("height"))
        this.width = 600;
        this.height = 600;
        this.pad = 20;
        this.svg = d3.select(this.container_id)
            .append('svg')
            .attr('viewBox', "0 0" + " " + this.width + " " + this.height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .classed(container_id, true);

    }

    log(message) {
        if (DEBUG || false) {
            console.log(message + ": " + this.chart_uid)
        }
    }

    init() {
        this.log('initializing map')
        this.loadData();
    }

    update() {
        this.log('updating map')
    }

    loadData() {
        this.log('loading map data')
    }

    choropleth(id) {
        this.log('loading data for choropleth ' + id)
    }

}

class RegionMap extends BaseMap {
    constructor(container_id) {
        super(container_id);

        this.projection = d3.geoConicEqualArea()
            .parallels([34, 40.5])
            .rotate([120, 0]);

        this.path = d3.geoPath()
            .projection(this.projection);

        this.colors = REGION_COLORS || ["#1f77b4"];
        this.feature_obj = null;
        this.selected_region = null

    }

    loadData() {

        let that = this
        let goto = this.selectRegion.bind(this);

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
                    .style('fill-opacity', 0.5)
                    .attr("data-region", d => d.properties.region)
                    .on("click", function(d) {
                        that.selected_region = d3.select(this).data()[0].properties.region;
                        return goto();
                    })
            }
        });
    }

    selectRegion() {


        let region_id = this.feature_obj.features.filter(d => d.properties.region == this.selected_region)[0].properties.region_id,
            selected_region = d3.select("svg .counties.region_" + region_id),
            region_features = this.feature_obj.features.filter(d => d.properties.region_id == region_id);

        if (selected_region.classed('active-region')) {
            d3.selectAll(".active-region").classed('active-region', false);
            d3.selectAll(".countySelected").remove();
            REGION = "Statewide";

        } else {
            d3.selectAll(".active-region").classed('active-region', false);
            d3.selectAll(".countySelected").remove();

            selected_region.classed('active-region', true)
            REGION = region_features[0].properties.region

            let bbox = selected_region.node().getBBox(),

                cx = bbox.x + bbox.width / 2,
                cy = bbox.y + bbox.height / 2,
                scaler = REGION_POP_SCALER,
                color = selected_region.style('fill');

            let shadow_id = this.container_id + "_drop_shadow"

            var shadow = addDropShadowFilter(selected_region.clone(true), shadow_id, 5, 0, 0)

                .classed('countySelected', true)
                .raise()
                .selectAll('path')
                .data(region_features)
                .style('color', color)
                .style('opacity', .8)
                .style('pointer-events', 'none')
                .style("filter", `url(#${shadow_id})`);

            var pop_region = selected_region.clone(true)
                .classed('countySelected', true)
                .raise()
                .selectAll('path')
                .data(region_features)
                .style('color', color)
                .style('fill-opacity', 1)
                .style('pointer-events', 'none')
                .transition()
                .duration(50)
                .attr(
                    "transform",
                    "translate(" + (1 - scaler) * cx + ", " + (1 - scaler) * cy + ") scale(" + scaler + ")");
        }
    }

    baseColors() {

        d3.selectAll(this.container_id + ' svg .counties path')
            .filter(function() {
                return !this.classList.contains('drop-shadow');
            })
            .transition()
            .ease(d3.easeExp)
            .style('fill', d => this.colors[d.properties.region_id])
            .style('fill-opacity', 0.5)
    }

    choroplethColors(id) {
        // id is a correctly formatted id string prefixed with "#"
        let button_element = d3.select(id);
        let url = button_element.attr("_viz_source");
        let that = this;

        let choropleth_data = [];
        let cmap = d3.scaleSequential(d3.interpolateViridis);

        d3.csv(url, function(error, data) {
            if (error) throw error;
            that.choro_label = Object.keys(data[0]).slice(3, 4); // keys after region, group, and subgroup are values

            let lookup_table = data.filter(d => d.group == "All");
            that.lookup_table = lookup_table

            let vmin = 1,
                vmax = 0;

            that.feature_obj.features
                .forEach(function(d) {
                    let v = +lookup_table.filter(
                        e => e.region == d.properties.region)[0][that.choro_label];
                    d.properties.choro_value = v;
                    if (v < vmin) {
                        vmin = v;
                    }
                    if (v > vmax) {
                        vmax = v;
                    }
                })

            cmap.domain([vmin, vmax])

            let _sel = d3.selectAll(that.container_id + ' svg .counties path')

            d3.selectAll(that.container_id + ' svg .counties path')
                .transition()
                .ease(d3.easeExp)
                .style('fill-opacity', 0)
                .duration(200)

            d3.selectAll(that.container_id + ' svg .counties path')
                .transition()
                .ease(d3.easeExp)
                .style('fill-opacity', 1)
                .style('fill', d => cmap(d.properties.choro_value))
                .duration(500)
        })

    }

}
