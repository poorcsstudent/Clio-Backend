# Pedestrian-network routing integration

Status: implemented locally; not deployed or submitted to Expo. No physical
glasses test or campus route verification was performed for this integration.

## Route generation

- Catalog GET routes now use the geographic OSM snapshot (2,111 nodes and 2,274
  edges), retaining each catalog tour's existing stop order.
- `POST /navigation/walking-route` accepts two or more distinct known stop IDs
  with Havener first, without an artificial stop-count cap. Up to eleven total
  stops use exact minimum-distance open-tour ordering for the chosen network
  approaches. Larger selections use deterministic nearest-neighbor ordering,
  retaining every stop; this heuristic is not guaranteed shortest. The start is
  fixed and no return leg is added. A directed-network dead end can still return
  422; that is not proof that every possible ordering is disconnected.
- Dijkstra follows connected, access-filtered edges. Foot-specific one-way
  restrictions are honored. No disconnected components are joined by proximity.
- Each building uses its nearest network node within 80 metres. This is an
  explicit assumption, **not** a verified entrance. Final approach gaps are
  returned to the client, excluded from distance, and never drawn as shortcuts.
- Missing coverage or disconnected approaches return HTTP 422. There is no
  silent straight-line or legacy pilot fallback. Missing routes show stops only.
- Walking duration assumes 1.35 m/s; it is an estimate. Legs containing mapped
  stairs are labeled. Accessibility routing is not implemented.
- Saved legacy app routes are not reused; an updated route is requested while
  the saved tour remains paused. Existing network-route snapshots can still be
  restored offline and are labeled potentially outdated.

## Preview

### Underground pedestrian passages (2026-11-12)

The two user-marked tunnels are now explicitly represented in the local preview:

- Havener / Highway 63 underpass: a new schematic underground edge joins an
  existing vertex on the residential garden trace to the east-side plaza.
  A disclosed plaza approach connects it to Havener's existing approach. Havener
  to Residential Commons 1 and 2 now connects through this underpass.
- Thomas Jefferson tunnel: existing E135 was mislabeled as a bridge. It retains
  its geometry and endpoints, but now carries `structure: tunnel` and `level: -1`.
  The separate campus-side approach gap remains explicit; adding this tunnel
  does not make the entire illustrated route to Thomas Jefferson complete.

Cyan dotted lines, entrance dots, tooltips and a legend identify underground
passages even when background traces are hidden. Buildings cannot snap to the
middle of a tunnel. Only portal endpoints join the surface network; no node is
added at an apparent artwork crossing with the road above.

The geographic snapshot already included OSM ways 1434828176 (Havener) and
518671101 (Thomas Jefferson). Its exporter now preserves their tunnel/level
metadata, and route instructions explicitly say to use the underground passage
rather than the roadway above. No geographic node, distance or connectivity was
changed. This adds viable alternatives; it does not impose a blanket ban on all
surface crossings or certify either tunnel's current access/accessibility.

Evidence: user-marked artwork; [OSM Havener way](https://www.openstreetmap.org/way/1434828176);
[OSM Thomas Jefferson way](https://www.openstreetmap.org/way/518671101); and the
[S&T underpass project](https://masterplan.mst.edu/pedestrianunderpass/), which
describes the replacement under Highway 63 and reports it opened. Artwork
placement remains schematic, not a survey or current-closure feed.

Validation: 48 app, 35 backend and 10 artwork tests pass, including bidirectional
Havener tunnel routing, retaining the Thomas Jefferson approach gap, and both
backend tunnel instructions. Browser review confirmed the housing route and
underground legend. Local changes only: no deployment, Expo submission, physical
glasses test or campus verification performed.

### Stop-limit removal (2026-11-12)

The 4/6/10-destination selector and server-side eleven-stop rejection are removed.
Every matching building is included unless the user explicitly removes it.
Large artwork selections use nearest-connected ordering, retain unmatched or
disconnected stops, and disclose gaps. Eleven stops is only an exact-optimization
threshold, not a selection limit. Both routers reuse one Dijkstra search per
source approach to avoid repeating full graph searches for every stop pair.
Request-size, known-ID, uniqueness, and rate-limit protections remain in place.
These changes are local only; no deployment or Expo build has been submitted.

Validation: 48 app tests, 34 backend tests, and 8 artwork tests pass. Regression
coverage includes 40-stop ordering and a 12-stop API request. A local request for
all 69 catalog places returned all 69 unique stops and 68 legs in approximately
875 ms, with missing connections explicitly reported. Browser testing with six
interests retained 47 destinations plus Havener on the same illustration; 22
connection gaps remained visible. These are software checks, not field tests.

### Single-map correction (2026-11-12)

The separate geographic route panel described below has been superseded. The
interest preview now draws the traced image-space edges directly over the S&T
illustration. It does not warp OSM geometry onto the artwork. The geographic
router remains a reference for stop ordering when all requested stops connect.
If it cannot connect them, the preview preserves their suggested order and
shows every stop; it does not claim an optimized tour in that case.

Multi-interest requests now return an explicit artwork review even when network
connections are missing. A live status beside the button reports completion or
gaps. Colored path portions end at red gap rings; no line is invented between
disconnected components. Errors, loading, and a 30-second timeout are visible
beside the button. Dashed portions are candidate traces, not verified paving.

`scripts/artwork-preview-network.cjs` adds ten explicitly inferred, review-only
joins (library west plaza, CS west corner, Havener roundabout sidewalk,
Bishop crossing approaches, Kummer east sidewalk, CS east court, library west
and south courts, south fountain join, and Schrenk east diagonal) and selects path-side
approaches for Havener and CS instead of using the nearest roof-label fragment.
These additions do not alter the locked source trace graph, production GPS
network, or its field-verification status. The user confirmed sidewalks on both
street sides and several Bishop Avenue crosswalks. The local OSM snapshot has
crossing way 1309060994 on the CS–Kummer geographic route. Its illustration
placement is approximate and explicitly disclosed, not a surveyed registration.
The full Havener–CS–Kummer illustration preview now connects using that candidate
crossing and sidewalk approaches. The CS + Chemistry + Electrical Engineering
combination also connects all six stops in the draft using candidate courtyard
joins. Browser testing confirmed one illustration map, correctly aligned stop
markers, five connected legs, and disclosure of assumptions. Other combinations
can still expose missing connections, which remain explicit.
This is not a verified walking-navigation route. Do not deploy it as such.

When the GPS reference cannot order all stops, the preview groups connected
artwork sections first (fixed Havener start), minimizing disconnected transitions
before image-space length. This retains all requested stops and does not claim
the shortest real-world walk. It is covered by a disconnected-interest regression.

Validation: `node --test scripts/artwork-routing.test.cjs` covers preserved bends,
multi-stop gaps, unmatched labels, source immutability, and the CS core join.
The screenshot/review crop helper is `scripts/render-artwork-route-review.py`.

### Previous geographic-only preview (superseded)

Run `npm --prefix backend run build`, then `node scripts/interest-preview.cjs`.
Open http://localhost:4174/interests and choose interests, then Preview my route.
The official illustration retains numbered/category-colored stops. The generated
path appears in a separate geographic network panel. Geographic paths have not
yet been registered to illustration pixels; they are deliberately not warped
onto the artwork. Source availability requires internet access for the artwork.

## Coverage audit (2026-11-12)

24 of 34 catalog tours connect with current approach assumptions. The following
10 fail explicitly, pending reviewed coverage/entrance connections:

- Ceramic Engineering, Chemistry, Metallurgical Engineering, Physics, and
  Semiconductor Engineering: Straumanis-James Hall's nearest approach is on a
  disconnected component.
- Environmental Science: EcoVillage has no approach within 80 m.
- Geological Engineering, Geology and Geophysics, Mining Engineering, and
  Petroleum Engineering: Kennedy Experimental Mine is outside approach coverage.

The Computer Science route is approximately 987 m, with reference-point gaps
of 22 m (Havener), 13 m (Computer Science), and 25 m (Kummer Design Center).
These numbers are calculated from mapped geometry, not measured during a walk.

## Remaining release gates

Review final entrance connections, source disagreements, and missing campus
coverage. Test route/arrival behavior on a phone and campus before claiming
navigation accuracy. Obtain explicit release approval before deployment/build.
The illustration-trace review graph remains separate reference work; its
candidate connections are not silently promoted to geographic route edges.

The network's ODbL notice is in `backend/src/data/PEDESTRIAN-NETWORK-NOTICE.md`.
