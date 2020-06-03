var DEBUG = false;

var REGION = "Bay Area"
var REGION_TAG = regionTag(REGION);

function regionTag(region) {
    return region.toLowerCase().split(' ').join('-');
}

// ----- Map Constants -------

// the indices of this list align with the "region_id" attribute in the topojson file(s)
const REGION_COLORS_ = [
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

var REGION_COLORS = (typeof REGION_COLORS == 'undefined') ? {
    "bay-area": "#34778c", // hs
    "central-coast": "#c7a630",
    "central-sierra": "#c54241",
    "greater-sacramento": "#6b7130",
    "imperial": "#c7a630",
    "inland-empire": "#34778c",
    "los-angeles": "#6b7130", // ag
    "northern-california": "#c7a630",
    "northern-sacramento-valley": "#c66f2c",
    "orange": "#c66f2c", // csu
    "san-diego": "#c54241", // ccc
    "san-joaquin-valley": "#834778", // uc
} : REGION_COLORS

var COLOR_CYCLE = i => Object.values(REGION_COLORS)[i]

// increases size of region on click/hover/whatever
const REGION_POP_SCALER = 1.01;

const CA_COUNTIES_REGIONS_TOPOJSON_URL = "./data/ca-counties.json"

const UNITS = ["percent", "count", "usd"]

let CHARTS = []

var REGION_MAP

function chartBuilder(chart_mapping) {
    let classes = Object.keys(chart_mapping)
    chart_objects = []
    for (let _class of classes) {
        d3.selectAll(_class).each(function(d) {
            let divId = "#" + this.getAttribute("id");

            let chart = new chart_mapping[_class](divId);
            chart.init();
            chart_objects.push(chart);

        })
    }

    return chart_objects
}


function onLoad() {

    let CHART_MAPPING = {
        ".chart-wrapper-bar": RegionStatsBarChart,
        ".chart-wrapper-stacked-bar": StackedBarChart,
        ".chart-wrapper-edu-stacked-bar": EduStackedBarChart,
        ".chart-wrapper-bubble": BubbleChart,
        ".chart-wrapper-radial": RadialChart,
    }

    d3.select("._navbar").text(REGION).classed('region_label', true);

    d3.selectAll(".chart-wrapper-map").each(function(d) {
        let divId = "#" + this.getAttribute("id");
        REGION_MAP = new RegionMap(divId);
        REGION_MAP.init();

    })

    CHARTS = chartBuilder(CHART_MAPPING);
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

d3.select("#region-map-123456").on("click", function() {
    d3.select("._navbar").text(REGION).classed('region_label', true)

    REGION_TAG = regionTag(REGION);
    d3.selectAll(".tab-content .tab-pane.active").classed('active', false)
    if (d3.selectAll(".tab-content .tab-pane.tab-" + REGION_TAG).empty()) {
        console.log(REGION_TAG, 'Missing!!')
    }
    d3.selectAll(".tab-content .tab-pane.tab-" + REGION_TAG).classed('active', true)

    d3.selectAll(".roi-collapse-heading[class*=-color]").attr('class', "roi-collapse-heading")
    d3.selectAll(".roi-collapse-heading").classed(REGION_TAG + '-color', true)


    for (var i = 0; i < CHARTS.length; i++) {
        CHARTS[i].update()
    }

});

window.onresize = function() {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function() {
        resize();
    }, 500);
};

function resize() {
    for (var i = 0; i < CHARTS.length; i++) {
        CHARTS[i].resize()
    }
}
