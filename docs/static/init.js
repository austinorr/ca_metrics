var REGION = "Statewide"

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

const UNITS = ["units=percent", "units=count", "units=usd"]

var CHARTS = []

function onLoad() {

    d3.select("._navbar").text(REGION).classed('region_label', true);

    var region_map = new RegionMap("#_viz_map_container1", CA_COUNTIES_REGIONS_TOPOJSON_URL);
    region_map.init();


    var bar_chart = new RegionBarChart("#_viz_bar_container1", "./data/employment2col.csv");
    bar_chart.init();
    CHARTS.push(bar_chart);

    var bar_chart = new RegionBarChart("#_viz_bar_container2", "./data/employment.csv");
    bar_chart.init();
    CHARTS.push(bar_chart);

}
