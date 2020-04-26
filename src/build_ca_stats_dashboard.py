from pathlib import Path
import altair as alt


selector_map = alt.selection_single(
    init={"properties.region": "Statewide"}, fields=["properties.region"]
)

data_url = (
    "https://raw.githubusercontent.com/austinorr/ca_metrics/master/data/data_geo.json"
)
shape_url = "https://raw.githubusercontent.com/austinorr/ca_metrics/master/data/ca-counties.json"


columns = [
    "grocery_pct",
    "gas_pct",
    "bank_pct",
    "doc_pct",
    "dent_pct",
    "hair_pct",
]

CA_map = (
    alt.Chart(
        alt.Data(
            url=shape_url, format=alt.TopoDataFormat(feature="data", type="topojson")
        )
    )
    .mark_geoshape(stroke="white")
    .encode(
        color=alt.condition(
            selector_map,
            alt.Color("properties.region:N", scale=alt.Scale(scheme="category20")),
            alt.value("lightgray"),
        ),
        tooltip=[
            alt.Tooltip("properties.name:N", title="County"),
            alt.Tooltip("properties.region:N", title="Region"),
        ],
    )
    .add_selection(selector_map)
    .properties(width=500, height=800)
)

bar_chart = (
    alt.Chart(
        alt.Data(url=data_url, format=alt.DataFormat(property="features", type="json"))
    )
    .transform_fold(["properties." + c for c in columns], as_=["metric", "value"])
    .mark_bar()
    .encode(
        x=alt.X("metric:N"),
        y=alt.Y("value:Q", axis=alt.Axis(format="%")),
        color="properties.region:N",
    )
    .add_selection(selector_map)
    .transform_filter(selector_map)
    .properties(width=200, height=200)
)

chart = CA_map | bar_chart

if __name__ == "__main__":

    docs_dir = Path(__file__).parent.parent.absolute()

    with open(docs_dir / "docs" / "index.html", "w") as f:
        f.write(chart.to_html())
