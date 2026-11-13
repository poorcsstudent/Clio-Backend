# External geographic reference workflow

Local-only evidence layers. Neither this geographic graph nor the illustrated graph is imported into app routing.

## Reproduce

From the repository root, with network access for the two fetch commands:

```text
node preview/path-review/reference/fetch-sources.cjs
python preview/path-review/reference/normalize.py
node preview/path-review/reference/fetch-aerial.cjs
python preview/path-review/reference/test_normalize.py
python preview/path-review/reference/render-reference.py
```

Only the final render needs Pillow. The bundled Codex Python was used for local validation. Serve `preview/` on localhost, then open `/path-review/reference/index.html`. Scripts and manifests are committed; downloaded source datasets, derivative geometry and imagery remain local/ignored pending redistribution review. Do not expect the viewer to work on a fresh clone until the imports run. Do not overwrite valid snapshots after a failed refresh without checking the manifest.

## Sources and observed contents

- [S&T Facilities wayfinding](https://facilities.mst.edu/wayfindingmaps/): 270 features including 46 entrance records, 33 labeled ADA, and six **detour** lines. The downloaded filename is dated 2024-05-16. This does not establish that the detours or entrance conditions are current. Raw HTML descriptions are not imported. No redistribution license has been established; keep the material local/reference-only.
- [OpenStreetMap](https://www.openstreetmap.org/copyright), fetched with Overpass: 515 pedestrian-reference ways within/intersecting the main-campus-area search box, converted into 2,277 adjacent-node segments and 2,114 nodes. This region includes surrounding streets; it is not a campus boundary. Attribution and ODbL apply; retain source identity and review licensing before distributing a combined database.
- [USGS NAIP Plus](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer): local 1,200 × 1,200 aerial image with returned EPSG:4326 extent. Service attribution is saved. Acquisition date for the mosaic is not established; download date is not capture date.

Downloads include SHA-256 checksums and retrieval timestamps. `summary.json` is the reproducible inventory, not a quality score.

## Separate coordinate systems

1. `../graph-draft.json`: original artwork pixel coordinates, retained unchanged.
2. `reference-graph.json`: WGS84 longitude/latitude, OSM shared-node topology, geodesic segment length estimates. No proximity snapping or intersection joining.
3. Future reviewed correspondence records will connect geographic source IDs to artwork `reviewKey` values. Currently `displayTraceKeys` is empty on every geographic edge. Building-center coordinates must not be substituted for entrances or sidewalk junctions. No global affine warp of the perspective artwork is assumed.

Only footway/path/pedestrian/steps and explicitly foot-permitted cycleways enter the reference graph. Restricted paths and area polygons are excluded. Roads remain context, even if tagged with sidewalks; road centerlines are not sidewalk geometries. Source tags (including layers, bridges, barriers on nodes, access and stairs) require review before route calculation. This prototype does not evaluate conditional access, directionality, opening hours, closures, or accessibility and is intentionally not a routing engine.

## Entrance gap queue

`entrance-candidates.json` lists up to three distinct OSM ways within 30 m per entrance, ranked by local projected point-to-segment distance. 45/46 entrances have candidates. **Zero are automatically joined.** Proximity can cross a building wall, street, fence or elevation change. A source ADA label is not an accessible route certification.

UI smoke test: selecting “Computer Science Building North ADA Entrance” shows a 2.62 m gap to way/625362571, plus alternatives at 6.87 m and 11.21 m. Selecting the first candidate highlights its geographic segment without adding a connector. This is evidence of working comparison controls, not route verification.

## Next review pass

Visual discrepancy recorded: the downloaded aerial shows paved/parking surfaces south of Havener where the illustration and OSM path pattern depict a different landscape. The sources therefore must not be treated as contemporaneous. Capture-date research and recent local observations are needed before choosing which geometry reflects current conditions. `comparison.png` preserves the geographic overlay used for this visual inspection.

- Inspect candidate junctions against aerial imagery and official entrances; record source IDs, evidence and limitations per decision.
- Establish pilot correspondences for Havener → academic quad → Computer Science using ground-level junctions, not roofs or illustrated number positions.
- Compare the linked chains in both coordinate systems; preserve display bends without treating image pixels as metres.
- Retain uncertain connections in the assumption register; request field observations for gaps hidden in both sources.
- Review current access, stairs, crossings and licensing before enabling any production route import.

No deployment, Expo build, upstream OSM edits, or physical campus tests were performed.
