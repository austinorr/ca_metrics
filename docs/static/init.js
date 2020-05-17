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

const CA_COUNTIES_REGIONS_TOPOJSON_URL = "https://raw.githubusercontent.com/austinorr/ca_metrics/master/data/ca-counties.json"

const UNITS = ["units=percent", "units=count", "units=usd"]
