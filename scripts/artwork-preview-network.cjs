// Explicit, review-only joins. Do not export these as surveyed GPS navigation.
const source=require('../preview/path-review/graph-draft.json');
// User-identified underpasses, corroborated by the OSM reference snapshot.
// Only the mouths join the surface graph; the road above is never a junction.
const tunnelEvidence='User identified this underground pedestrian passage on the campus illustration. OSM corroborates the tunnel; artwork placement is schematic. Current access, stairs and accessibility remain unverified.';
const havenerPortal={id:'preview-havener-west-portal',x:1760.75,y:754.17,gps:null};
const residential=source.edges.find(e=>e.id==='E036');
const split=residential.points.findIndex(([x,y])=>x===havenerPortal.x&&y===havenerPortal.y);
if(split<1)throw Error('Havener tunnel approach trace changed');
const baseEdges=source.edges.flatMap(e=>e.id==='E036'?[
  {...e,id:e.id+'-west',to:havenerPortal.id,points:e.points.slice(0,split+1)},
  {...e,id:e.id+'-east',from:havenerPortal.id,points:e.points.slice(split)},
]:e.id==='E135'?[{...e,label:'Thomas Jefferson pedestrian tunnel',structure:'tunnel',level:-1,
  reference:{url:'https://www.openstreetmap.org/way/518671101'},
  assumption:{rationale:tunnelEvidence},evidence:'user-identified-and-osm',accessibility:'unverified'}]:[e]).map(e=>e.id.startsWith('E036-')?{...e,lengthPixels:e.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-e.points[i][0],p[1]-e.points[i][1]),0)}:e);
const joins=[
  {id:'preview-havener-underpass',from:havenerPortal.id,to:'N155',points:[[1760.75,754.17],[1776,762],[1796,772]],
    label:'Havener / Highway 63 pedestrian underpass',structure:'tunnel',level:-1,
    reference:{url:'https://www.openstreetmap.org/way/1434828176',officialUrl:'https://masterplan.mst.edu/pedestrianunderpass/'},
    rationale:tunnelEvidence},
  {id:'preview-havener-underpass-plaza',from:'N173',to:'N010',points:[[1863,797],[1877,802],[1893,813],[1902,827],[1901,846],[1881,867]],
    rationale:'Assume the open plaza east of Havener connects the tunnel-side frontage to the existing east approach. This follows the artwork around the building, not through it; verify paving, grade and tree-obscured sections.'},
  {id:'preview-library-west-plaza',from:'N013',to:'N157',points:[[2001,881],[1994,860],[1998,840],[2010,826],[2029,816]],
    rationale:'Assume the visible plaza along the west side of the library joins the quad to the northern academic path; tree cover and elevation require review.'},
  {id:'preview-cs-west-corner',from:'N163',to:'N164',points:[[2144,805],[2132,821],[2132,835],[2144,844],[2158,852]],
    rationale:'Assume the west-side Computer Science approach continues around the building corner to the southern strip; verify the obscured corner and any stairs.'},
  {id:'preview-havener-roundabout-sidewalk',from:'N110',to:'N107',points:[[1643,951],[1635,957],[1627,963],[1619,968]],
    rationale:'Assume the two visible sidewalk ends around the south-east roundabout approach join through the short intervening paved area.'},
  {id:'preview-bishop-crossing-approaches',from:'N106',to:'N115',points:[[1517,981],[1500,999],[1480,1015],[1454,989],[1430,1011],[1405,1032],[1383,1050],[1360,1068],[1344,1081]],
    reference:{url:'https://www.openstreetmap.org/way/1309060994',coordinates:[[-91.7772324,37.9532334],[-91.7769947,37.9532449]],artworkPlacement:'approximate; not surveyed'},
    rationale:'User confirms street-side sidewalks and Bishop Avenue crosswalks. OSM way 1309060994 records a crossing on the geographic CS–Kummer route. This artwork crossing placement and its sidewalk joins are approximate; use the actual marked crossing, not this schematic line, and verify location before navigation release.'},
  {id:'preview-kummer-east-sidewalk',from:'N115',to:'N194',points:[[1344,1081],[1330,1091],[1315,1101],[1295,1113]],
    rationale:'Assume the visible street-side sidewalk continues to the east end of the Kummer frontage trace. Verify the curb/driveway transitions and the final entrance.'},
  {id:'preview-cs-east-court',from:'N166',to:'N167',points:[[2290,893],[2310,880],[2326,871],[2340,860],[2365,855]],
    rationale:'Assume the paved passage at the east end of the CS frontage connects to the Straumanis-James approach. Confirm the alley boundary, vehicle access and any crossing controls.'},
  {id:'preview-library-west-court',from:'N166',to:'N092',points:[[2290,893],[2270,902],[2260,917],[2254,937]],
    rationale:'Assume the visible passage between the building frontages reaches the west courtyard entrance; confirm the narrow and tree-obscured sections.'},
  {id:'preview-library-south-court',from:'N057',to:'N077',points:[[2298,960],[2325,969],[2350,974],[2380,969],[2405,971],[2427,970]],
    rationale:'Assume the paved courtyard around the south side of the library joins the Emerson-side walk beneath the trees. Verify planting boundaries and stairs.'},
  {id:'preview-south-fountain-join',from:'N061',to:'N064',points:[[2150,1077],[2147,1087],[2142,1098]],
    rationale:'Assume the short visible plaza interval joins the garden path to the fountain loop; verify the landscaping edge.'},
  {id:'preview-schrenk-east-diagonal',from:'N063',to:'N216',points:[[2093,1117],[2070,1137],[2045,1159],[2020,1178],[1991,1199]],
    rationale:'Assume the southeast-court diagonal continues along the visible path toward the Schrenk-side frontage; confirm tree-obscured continuity and entrance access.'},
];
const previewNodes=[...source.nodes,havenerPortal];
const nodes=new Map(previewNodes.map(n=>[n.id,n]));
for(const j of joins){const a=nodes.get(j.from),b=nodes.get(j.to);if(!a||!b||j.points[0][0]!==a.x||j.points[0][1]!==a.y||j.points.at(-1)[0]!==b.x||j.points.at(-1)[1]!==b.y)throw Error('Artwork preview join no longer matches reviewed endpoints: '+j.id);}
const graph={...source,nodes:previewNodes,edges:[...baseEdges,...joins.map(j=>({...j,frame:'main',reviewKey:j.id,status:'needs-geometry-review',routingEligible:false,accessibility:'unverified',evidence:j.structure==='tunnel'?'user-identified-and-osm':'inferred-connection',assumption:{rationale:j.rationale,verify:'On-campus entrance, paving, grade and access check required.'}}))]};
// Label centers on roofs are not entrances. These explicit nearby approach
// associations supersede nearest-roof-label matching for the reviewed CS core.
const approaches={'havener-center':'N010','computer-science-building':'N175'};
module.exports={graph,approaches};
