# Pedestrian network attribution

`pedestrian-network.json` is a filtered derivative of OpenStreetMap data.

Copyright OpenStreetMap contributors. This database is made available under the
[Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).
This notice applies to the network database, not to the application source code.
Preserve attribution and the ODbL terms when redistributing the database or a
derivative database. The JSON is the machine-readable database source.

Snapshot: 2026-11-12; exact source timestamp and SHA-256 are embedded in the JSON.
Extraction bounds: south 37.945, west -91.787, north 37.965, east -91.765.
Export: `scripts/export-pedestrian-network.cjs` from the local reference graph.
The exporter excludes restricted/conditional access and unsupported barriers.
Topology uses shared OSM node IDs, not inferred crossings or proximity joins.

The official S&T wayfinder KML and USGS reference image are **not** included in
this routing database. No accessibility or field verification is asserted.
