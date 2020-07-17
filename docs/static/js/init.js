export var DEBUG = false;
var qparam = regionTitleCase(getParameterByName('region'))
var REGION = qparam ? qparam : ""
var REGION_TAG = regionTag(REGION);

// ----- Map Constants -------

export var REGION_COLORS = (typeof REGION_COLORS == 'undefined') || (REGION_COLORS == null) ? {
    "bay-area": "#34778c", // hs
    "central-coast": "#c7a630",
    "central-sierra": "#c54241",
    "sacramento-tahoe": "#6b7130", 
    "imperial": "#c7a630",
    "inland-empire": "#34778c",
    "los-angeles": "#6b7130", // ag
    "north-far-north": "#c7a630", 
    "upper-sacramento-valley": "#c66f2c",
    "orange": "#c66f2c", // csu
    "san-diego": "#c54241", // ccc
    "san-joaquin-valley": "#834778", // uc
} : REGION_COLORS

export var REGION_NAME_MAPPING = (typeof REGION_NAME_MAPPING == 'undefined') || (REGION_NAME_MAPPING == null) ? {
    "north-far-north": "North- -- -Far North", 
    "statewide": "Statewide",
} : REGION_NAME_MAPPING

var COLOR_CYCLE = i => Object.values(REGION_COLORS)[i]

// increases size of region on click/hover/whatever
const REGION_POP_SCALER = 1.01;

const CA_COUNTIES_REGIONS_TOPOJSON_URL = "./data/ca-counties.json"

const UNITS = ["percent", "count", "usd"]

export var CHARTS = [];

var REGION_MAP

function chartBuilder(container, chart_mapping, chart_registry) {
    let classes = Object.keys(chart_mapping)
    for (let _class of classes) {
        d3.select(container).selectAll(_class).each(function(d) {
            let divId = this.getAttribute("id");
            if (is_visible(divId, 300)) {
                let has_no_chart = d3.select("#" + divId).selectAll('._viz-svg-container').empty()

                if (has_no_chart) {
                    let chart = new chart_mapping[_class](divId);
                    
                    try {
                        chart.init().catch(console.error);
                    } catch (error) {
                        if (error instanceof InitializationError) {
                            console.error(error)
                        }
                    }
                    
                    chart_registry.push(chart);

                }
            }
        })
    }
}

let CHART_MAPPING = {
    ".chart-wrapper-bar": RegionStatsBarChart,
    ".chart-wrapper-stacked-bar": StackedBarChart,
    ".chart-wrapper-edu-stacked-bar": EduStackedBarChart,
    ".chart-wrapper-bubble": BubbleChart,
    ".chart-wrapper-radial": RadialChart,
}

function updateVisibleCharts() {
    for (let chart of CHARTS) {
        if (chart.is_visible) {
            chart.update();
        }
    }
}

function resetCharts() {
    for (let chart of CHARTS) {
        chart.state = 'overview';
    }
}

function onLoad() {

    selectTabContent(REGION_TAG)
    toggleRegionAndStateSubheading(REGION_TAG)

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

        // selectTabContent(regionTag(REGION));
        // updateVisibleCharts();
    });
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
    d3.selectAll(".tab-content .tab-pane.tab-" + region_tag).classed('active', true)

    d3.selectAll(".roi-collapse-heading[class*=-color]").attr('class', "roi-collapse-heading")
    d3.selectAll(".roi-collapse-heading").classed(region_tag + '-color', true)
}

function toggleRegionAndStateSubheading(region_tag) {
    d3.selectAll('.roi-subheading').classed('hidden', true);
    if (region_tag == 'statewide') {
        d3.selectAll('.roi-subheading.statewide-only-heading').classed('hidden', null);
    } else {
        d3.selectAll('.roi-subheading.region-only-heading').classed('hidden', null);
    }

}


window.onresize = function() {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function() {
        resize();
    }, 500);
};

window.ontouchstart = function() {
    d3.selectAll('.roi-tooltip').style('opacity', 0);
}

function resize() {
    d3.selectAll('.roi-tooltip').style('opacity', 0);
    for (var i = 0; i < CHARTS.length; i++) {
        CHARTS[i].resize();
    }
}

window.onscroll = function() {
    clearTimeout(window.scrollFinished);
    window.scrollFinished = setTimeout(function() {
        updateVisibleCharts();
        chartBuilder(document, CHART_MAPPING, CHARTS);

    }, 50);
}

window.onload = function() {
    var qparam = regionTitleCase(getParameterByName('region'));
    var REGION = qparam ? qparam : "Bay Area";
    var REGION_TAG = regionTag(REGION);
    onLoad();
};

export function init_on_expand() {
    chartBuilder(document, CHART_MAPPING, CHARTS)
}

export function mapDataToggle(id) {
    let elem = '#' + id
    let state = d3.select(elem).classed('_viz-map-selected')
    if (state) {
        REGION_MAP.baseColors()
        d3.select(elem).classed('_viz-map-selected', false)
    } else {
        REGION_MAP.choroplethColors(elem);
        d3.selectAll('._viz-map-selected').classed('_viz-map-selected', false)
        d3.select(elem).classed('_viz-map-selected', true)
    }
}

export function setRegion(region_tag) {
    REGION_TAG = region_tag;
    REGION = regionTitleCase(REGION_TAG)
    
    REGION_MAP.clear_roi_tooltips();

    if (REGION_MAP.redirect_url) {
        window.location.href = REGION_MAP.redirect_url + `?region=${REGION_TAG}`;

    } else {

        window.history.pushState(
            "", document.title,
            window.location.href.split('?')[0] + `?region=${REGION_TAG}`
        );
        REGION_MAP.drawMap();
        selectTabContent(REGION_TAG);
        toggleRegionAndStateSubheading(REGION_TAG)
        resetCharts();
        updateVisibleCharts();
    }
}


