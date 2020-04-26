from pathlib import Path

import pandas
import requests
import topojson

DATAPATH = Path(__file__).parent.parent / "data"
CA_TOPO_URL = "https://raw.githubusercontent.com/scottpham/california-counties/master/caCountiesTopo.json"


county_region_map = (
    pandas.read_csv(DATAPATH / "regions.csv", index_col=0)
    .assign(region=lambda df: df["region"].str.strip())
    .set_index("name")["region"]
)


def _fetch_ca_counties_gdf():

    req = requests.get(CA_TOPO_URL)
    jdata = req.json()

    gdf = topojson.utils.serialize_as_geodataframe(jdata).assign(
        geometry=lambda df: df.geometry.buffer(0)
    )

    assert all(gdf.geometry.is_valid)

    return gdf


def _join_regions(gdf):
    return gdf.merge(county_region_map, on="name")


def _make_topology(
    gdf, presimplify=False, topoquantize=True, toposimplify=True, **kwargs
):

    topo = topojson.Topology(
        gdf,
        presimplify=presimplify,
        topoquantize=topoquantize,
        toposimplify=toposimplify,
        **kwargs
    )
    return topo


def main(**kwargs):
    topo = _fetch_ca_counties_gdf().pipe(_join_regions).pipe(_make_topology, **kwargs)
    return topo


if __name__ == "__main__":

    topo = main(toposimplify=0.005)

    with open(DATAPATH / "ca-counties.json", "w") as f:
        f.write(topo.to_json())
