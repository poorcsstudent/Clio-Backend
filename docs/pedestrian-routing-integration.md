# Pedestrian-network routing integration

Status: implemented locally; not deployed or submitted to Expo. No physical
glasses test or campus route verification was performed for this integration.

## Route generation

- Catalog GET routes now use the geographic OSM snapshot (2,111 nodes and 2,274
  edges), retaining each catalog tour's existing stop order.
- `POST /navigation/walking-route` accepts 2–11 distinct known stop IDs with
  Havener first. It finds the minimum-distance open-tour ordering for those
  chosen network approaches (fixed start; no return leg).
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
