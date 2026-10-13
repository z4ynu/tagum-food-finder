# Tagum Boundary Fixture Provenance

## Status

`tagum-boundary-osm-15986415-v8.json` is approved for the Stage 0 Tagum place-coverage audit. Production use remains subject to the same attribution, provenance, and ODbL controls recorded here.

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

The source data is © OpenStreetMap contributors and is available under the Open Database License 1.0. The project owner accepted the following handling on 13 October 2026:

- public use of the boundary or other OSM-derived data displays `© OpenStreetMap contributors` and links to the OSM copyright and license page;
- the application provides a durable data-attribution surface identifying OSM, ODbL 1.0, the source version, and the extraction date;
- any adapted OSM database that the project publicly uses or distributes is offered under ODbL 1.0 as required;
- technological restrictions are not applied to the only redistributed copy of an ODbL database;
- application source code, original editorial content, private user data, and independently sourced records are kept logically and operationally distinguishable from the ODbL database.

- OSM copyright and attribution: `https://www.openstreetmap.org/copyright`
- ODbL 1.0: `https://opendatacommons.org/licenses/odbl/1-0/`
- Geofabrik download and license notes: `https://www.geofabrik.de/data/download.html`

## Approval decision

The fixture was approved on 13 October 2026 after source checksum verification, jurisdiction identity matching, independent visual corroboration, PostGIS validity checking, and owner acceptance of the ODbL handling above. Approval applies to this exact checksummed source version and must not be inherited automatically by a refreshed geometry.
