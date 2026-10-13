# Tagum Boundary Fixture Provenance

## Status

`tagum-boundary-osm-15986415-v8.json` is a pending Stage 0 audit fixture. It is committed for reproducible review and testing, but it is not approved for a production boundary or a real place-coverage audit.

## Source and extraction

- Source: Geofabrik Philippines OpenStreetMap extract dated 12 October 2026 at 23:01 UTC
- Source URL: `https://download.geofabrik.de/asia/philippines-261012.osm.pbf`
- Source MD5: `d12ded513809afc929b74573c2c28f57`
- OSM record: relation `15986415`, version `8`
- Extractor: Osmium `1.19.0`
- Container: `docker.io/iboates/osmium@sha256:a67987f7d822d951ae1979de656ab7bd8051605f79d2751ea4800cc6057124be`
- Derived GeoJSON SHA-256: `6b4633950b60c7402d0e8373354eb2df34ffe7e460464e934800f304543e2af0`
- Derived PBF SHA-256: `f4c272ae6ce91f107ecf39c72add71eb93dce7bab26d8f0c9263bd0c823a6ccd`

The checksum stored in the fixture is the checksum of the extracted GeoJSON source artifact, not the formatted fixture JSON.

## Geometry review facts

- Geometry type: `MultiPolygon`
- Polygons: 1
- Rings: 1
- Positions: 548
- Bounding box: `125.7338476, 7.2464576, 125.8872506, 7.5105777`
- OSM `official_name`: `City of Tagum`
- OSM `ref`: `1102319000`
- PSA verification code: `1102319000`

## License and attribution

The source data is © OpenStreetMap contributors and is available under the Open Database License 1.0. Any public use must provide OpenStreetMap attribution. Distribution of a derived database may also trigger the ODbL share-alike obligations; that product-level handling must be confirmed before this fixture is approved.

- OSM copyright and attribution: `https://www.openstreetmap.org/copyright`
- ODbL 1.0: `https://opendatacommons.org/licenses/odbl/1-0/`
- Geofabrik download and license notes: `https://www.geofabrik.de/data/download.html`

## Remaining approval gate

The fixture must remain `pending` until the geometry is visually compared with an independent reference, ring validity is confirmed, and the project's ODbL attribution and derived-database obligations are accepted.
