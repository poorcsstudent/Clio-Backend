# Campus pedestrian tracing checkpoint

Status: fourth-pass draft, incomplete, not approved, not routable. Requested 90% accuracy target has NOT been measured or achieved.

Generated from `generate.cjs`; current exact counts are in `validation.json`. Coverage includes academic core, residential lawn, partial southern/athletics approaches and a candidate bridge approach. Source artwork is 3114 × 1746 pixels. Coordinates are image coordinates, not GPS. The trace was manually sampled from a 2048-pixel-wide rendering and scaled uniformly to original dimensions. This preserves the source frame, but does not establish surveyed centerline precision.

Outputs:
- `index.html`: artwork visibility toggle, labels, core/full-frame views.
- `network.svg`: isolated paths and points.
- `visible-network.svg`: visible-path drafts only, excluding candidate connections.
- `overlay.svg`: same coordinates over the source artwork.
- `graph-draft.json`: editable node/edge records; distances/GPS deliberately unset.

User confirms visible paths are walkable. Accessibility is unknown. Dashed orange segments require closer geometry review, not a claim of non-walkability. All other segments also await review of the tracing itself.

Remaining work before a complete review delivery:
1. Inspect core at full resolution; refine curves and entrance placement.
2. Shared endpoint splitting is implemented and structurally checked. Examine other crossings for actual junctions versus bridges; never infer a connection solely from visual overlap.
3. Trace remaining academic/east campus, residential/north campus, athletics/west campus and separate insets.
4. Keep inset coordinate frames separate; do not create geographic connections from artwork proximity.
5. Validate graph connectivity, bounds, duplicate geometry and unresolved entrance associations.
6. Render and visually inspect network-only and overlay outputs at useful zoom levels.
7. Obtain user approval before connecting any graph to tour generation.

No application routing, backend deployment, or Expo build was changed. No physical field testing was performed by the agent. No automated resumption or usage-reset credit action was configured.

Second-pass validation checks endpoint references, exact endpoint coordinates, bounds, duplicate/reversed geometry, self-loops, and unsplit explicit junctions. It reports components and potential interior crossings. Passing these checks is not evidence of geographical correctness. Uncertain geometry has an independent visibility toggle and every edge explicitly has `routingEligible: false`.

The previous SVGs remain review artifacts, including uncertain traces across obscured artwork. Do not interpret them as established sidewalks. Use the visible-only output for the conservative network view. Larger portions of campus and the geographically separate insets still need tracing.

Third pass: full-resolution inspection crops were used to refine the Havener lawn/plaza curves and courtyard, and add southern and eastern sidewalk segments. Superseded rough traces were removed. Explicit junction correspondences move connected endpoints together. Every edge records `sampling` and a descriptive `reviewKey`; numeric IDs can change between draft revisions. One candidate crossing still requires review; disconnected components are retained rather than guessed connections.

`render.py` generates full-size network and overlay PNGs plus academic-core crops. `inspect-regions.py` generates lossless local inspection crops (ignored in Git). The final PNGs are generated from graph coordinates, not painted independently. Source artwork remains unchanged. Neither the linework nor building entrances have been approved by the user yet.

Fourth pass: ten unsupported roof-crossing/occluded approximations removed from the active draft and archived in `rejected-traces.json`. Overlapping superseded courtyard/circle traces removed. Added full-resolution east courtyard loops and southern library garden paths. Candidate geometry is hidden by default in the reviewer. Validation now carries an explicit unachieved 90% target, null measured accuracy and null campus-coverage percentage. Image-space lengths are for draft auditing only, not physical walking distances. Do not present the percentage of visible-status edges as an accuracy score.
