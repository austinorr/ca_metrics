var DEBUG = false;

var REGION = "Bay Area"

// ----- Map Constants -------

// the indices of this list align with the "region_id" attribute in the topojson file(s)
const REGION_COLORS = [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
];

// increases size of region on click/hover/whatever
const REGION_POP_SCALER = 1.01;

const CA_COUNTIES_REGIONS_TOPOJSON_URL = "./data/ca-counties.json"

const UNITS = ["percent", "count", "usd"]

var CHARTS = []

var REGION_MAP

function onLoad() {

    d3.select("._navbar").text(REGION).classed('region_label', true);

    // REGION_MAP= new RegionMap("#_viz_map_container1", CA_COUNTIES_REGIONS_TOPOJSON_URL);
    // REGION_MAP.init();

    d3.selectAll(".chart-wrapper-map").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        REGION_MAP = new RegionMap(divId);
        REGION_MAP.init();

    })

    d3.selectAll(".chart-wrapper-bar").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        var bar_chart = new RegionStatsBarChart(divId);
        bar_chart.init();
        CHARTS.push(bar_chart);

    })

    d3.selectAll(".chart-wrapper-stacked-bar").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        var bar_chart = new StackedBarChart(divId);
        bar_chart.init();
        CHARTS.push(bar_chart);

    })

    d3.selectAll(".chart-wrapper-edu-stacked-bar").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        var bar_chart = new EduStackedBarChart(divId);
        bar_chart.init();
        CHARTS.push(bar_chart);

    })


    // var bar_chart = new StackedBarChart("#_viz_edubar_container1", );
    // bar_chart.init();
    // CHARTS.push(bar_chart);

}

function mapDataToggle(id) {
    let elem = '#' + id
    let state = d3.select(elem).classed('active')
    if (state) {
        REGION_MAP.baseColors()
        d3.select(elem).classed('active', false)
    } else {
        REGION_MAP.choroplethColors(elem);
        d3.select(elem).classed('active', true)
    }
    
}
