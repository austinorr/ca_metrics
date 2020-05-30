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

// const REGION_COLORS = REGION_COLORS==null ? {
//         "bay-area": "#34778c",
//         "central-coast": "#c7a630",
//         "central-sierra": "#c54241",
//         "greater-sacramento": "#6b7130",
//         "imperial": "#c7a630",
//         "inland-empire": "#34778c",
//         "los-angeles": "#6b7130",
//         "northern-california": "#c7a630",
//         "northern-sacramento-valley": "#c66f2c",
//         "orange": "#c66f2c",
//         "san-diego": "#c54241",
//         "san-joaquin-valley": "#834778",
//     } : REGIN_COLORS


// increases size of region on click/hover/whatever
const REGION_POP_SCALER = 1.01;

const CA_COUNTIES_REGIONS_TOPOJSON_URL = "./data/ca-counties.json"

const UNITS = ["percent", "count", "usd"]

let CHARTS = []

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
        
        let chart = new RegionStatsBarChart(divId);
        chart.init();
        CHARTS.push(chart);

    })

    d3.selectAll(".chart-wrapper-stacked-bar").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        let chart = new StackedBarChart(divId);
        chart.init();
        CHARTS.push(chart);

    })

    d3.selectAll(".chart-wrapper-edu-stacked-bar").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        let chart = new EduStackedBarChart(divId);
        chart.init();
        CHARTS.push(chart);

    })

    d3.selectAll(".chart-wrapper-bubble").each( function (d) {
        let divId = "#" + this.getAttribute("id");
        
        let chart = new BubbleChart(divId);
        chart.init();
        CHARTS.push(chart);

    })

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
