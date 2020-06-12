var DEBUG = false;
var qparam = regionTitleCase(getParameterByName('region'))
var REGION = qparam ? qparam : ""
var REGION_TAG = regionTag(REGION);

// ----- Map Constants -------

// the indices of this list align with the "region_id" attribute in the topojson file(s)
// const REGION_COLORS_ = [
//     "#1f77b4",
//     "#aec7e8",
//     "#ff7f0e",
//     "#ffbb78",
//     "#2ca02c",
//     "#98df8a",
//     "#d62728",
//     "#ff9896",
//     "#9467bd",
//     "#c5b0d5",
//     "#8c564b",
//     "#c49c94",
//     "#e377c2",
//     "#f7b6d2",
//     "#bcbd22",
//     "#dbdb8d",
//     "#17becf",
//     "#9edae5",
// ];

var REGION_COLORS = (typeof REGION_COLORS == 'undefined') || (REGION_COLORS == null) ? {
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

var CHARTS = []

var REGION_MAP

function chartBuilder(container, chart_mapping, chart_registry) {
    let classes = Object.keys(chart_mapping)
    // chart_objects = []
    for (let _class of classes) {
        d3.select(container).selectAll(_class).each(function(d) {
            let divId = this.getAttribute("id");
            let has_no_chart = d3.select("#" + divId).selectAll('._viz-svg-container').empty()

            if (has_no_chart) {
                let chart = new chart_mapping[_class](divId);
                chart.init();
                // chart.update();
                chart_registry.push(chart);
            }
        })
    }
    // return chart_objects
}

let CHART_MAPPING = {
    ".chart-wrapper-bar": RegionStatsBarChart,
    ".chart-wrapper-stacked-bar": StackedBarChart,
    ".chart-wrapper-edu-stacked-bar": EduStackedBarChart,
    ".chart-wrapper-bubble": BubbleChart,
    ".chart-wrapper-radial": RadialChart,
}

function onLoad() {

    selectTabContent(REGION_TAG)

    d3.select("._navbar").text(REGION).classed('region_label', true);

    d3.selectAll(".chart-wrapper-map").each(function(d) {
        let divId = this.getAttribute("id");
        REGION_MAP = new RegionMap(divId);
        REGION_MAP.init();
    })
    initDataLabels();

    chartBuilder(document, CHART_MAPPING, CHARTS);

    d3.selectAll(".chart-wrapper-map").on("click", function() {
        d3.select("._navbar").text(REGION).classed('region_label', true)

        selectTabContent(regionTag(REGION));

        for (var i = 0; i < CHARTS.length; i++) {
            CHARTS[i].update()
        }

    });
}

function mapDataToggle(id) {
    let elem = '#' + id
    let state = d3.select(elem).classed('selected')
    if (state) {
        REGION_MAP.baseColors()
        d3.select(elem).classed('selected', false)
        console.log("was active", d3.select(elem))
    } else {
        REGION_MAP.choroplethColors(elem);
        d3.select(elem).classed('selected', true)
        console.log("was not active", d3.select(elem))
    }
}

function initDataLabels() {
    let button_elements = d3.selectAll(".stat-btn");
    button_elements.each(function() {
        let button_element = d3.select(this)
        let url = button_element.attr("_viz_source");

        if (url) {
            d3.csv(url, function(error, data) {
                if (error) throw error;
                let labelFormatter = getLabelFormatter(button_element.attr("_viz_units"))
                let labels = toLabels(data)
                let statewide_stat = data.filter(d => (d.group == "All") && (d.region == 'Statewide'))[0][labels[0]];
                button_element.select("h4.stat-value")
                    .html(labelFormatter(statewide_stat))
            })
        }
    })
}

function selectTabContent(region_tag) {

    d3.selectAll(".tab-content .tab-pane.active").classed('active', false)
    if (d3.selectAll(".tab-content .tab-pane.tab-" + region_tag).empty()) {
        console.log(region_tag, 'Missing!!')
    }
    d3.selectAll(".tab-content .tab-pane.tab-" + region_tag).classed('active', true)

    d3.selectAll(".roi-collapse-heading[class*=-color]").attr('class', "roi-collapse-heading")
    d3.selectAll(".roi-collapse-heading").classed(region_tag + '-color', true)
}

window.onresize = function() {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function() {
        resize();
    }, 500);
};


// window.touched=false;
// window.ontouchstart = function () {
//     clearTimeout(window.touchfinished);
//     window.touchfinished = setTimeout(function() {
//         window.touched = window.touched ? false : true;
//     }, 500);

// }

function resize() {
    d3.selectAll('.roi-tooltip').style('opacity', 0);
    for (var i = 0; i < CHARTS.length; i++) {
        CHARTS[i].resize();
        CHARTS[i].tooltip_hide(null);
    }
}
