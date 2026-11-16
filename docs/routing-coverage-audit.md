# Campus routing audit — November 16, 2026

User reported a twelve-stop housing/CS/EE tour incorrectly failing despite
visible pedestrian connections. This audit distinguishes missing graph coverage
from a statement about real-world walkability.

## General fixes

- Approach selection now considers nodes reachable from the tour start, instead
  of choosing a closer isolated sidewalk fragment. The existing 80 m approach
  bound and explicit unverified entrance gap are retained; no gap edge is added.
- Restores University Commons, Rolla Suites 1 and 2, Straumanis-James Hall, and
  University Police approaches.
- If endpoints are too distant but an existing connected path segment passes
  within the approach bound, split that segment at the projected approach.
  Preserve direction, source, length proportions, crossing and tunnel metadata.
  This restores EcoVillage and Fitness Center. The shared graph is not mutated.
- The reported housing/CS/EE selection returns all twelve stops and eleven legs.
  Ordering, stop numbering and walking-route order are tested together.

## Systematic regression coverage

The full campus catalog is tested from Havener. A regression test explicitly
lists the remaining seven coverage failures, so additional failures cannot hide
behind a passing test of the original example. Synthetic tests cover isolated
fragments, long segments, retained graph geometry and direction constraints.

## Still unresolved — not evidence of non-walkability

209 E. 8th St.; Allgood-Bailey Stadium; Athletic Fields; General Services Building;
Kennedy Experimental Mine; Miner Dome Indoor Practice Facility; Missouri Protoplex.

Their available mapped approaches remain beyond the existing bound. They require
geographic entrance/path coverage, not a larger arbitrary snapping radius.
The user's marked illustration is useful evidence of connectivity but is not
georeferenced sidewalk geometry. Illustration-layer gaps are a separate task;
these backend repairs do not claim to have traced the marked artwork connectors.

No physical walking or accessibility tests performed. These changes are local
until explicitly released; build 22 does not include them yet.
