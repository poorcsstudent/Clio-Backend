// Explicit, review-only joins. Do not export these as surveyed GPS navigation.
const source=require('../preview/path-review/graph-draft.json');
// User-identified underpasses, corroborated by the OSM reference snapshot.
// Only the mouths join the surface graph; the road above is never a junction.
const tunnelEvidence='User identified this underground pedestrian passage on the campus illustration. OSM corroborates the tunnel; artwork placement is schematic. Current access, stairs and accessibility remain unverified.';
const havenerPortal={id:'preview-havener-west-portal',x:1760.75,y:754.17,gps:null};
const tjSouthPortal={id:'preview-tj-south-portal',x:2758,y:797,gps:null};
const tjNorthPortal={id:'preview-tj-north-portal',x:2781,y:767,gps:null};
const residential=source.edges.find(e=>e.id==='E036');
const split=residential.points.findIndex(([x,y])=>x===havenerPortal.x&&y===havenerPortal.y);
if(split<1)throw Error('Havener tunnel approach trace changed');
const baseEdges=source.edges.flatMap(e=>e.id==='E036'?[
  {...e,id:e.id+'-west',to:havenerPortal.id,points:e.points.slice(0,split+1)},
  {...e,id:e.id+'-east',from:havenerPortal.id,points:e.points.slice(split)},
]:['E135','E136','E137'].includes(e.id)?[]:[e]).map(e=>e.id.startsWith('E036-')?{...e,lengthPixels:e.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-e.points[i][0],p[1]-e.points[i][1]),0)}:e);
const joins=[
  // November 16: user-marked walking-preview connections, traced on the artwork.
  // These joins are schematic visual aids, not new surveyed GPS geometry.
  {id:'preview-residential-west-walk',from:'N035',to:'N268',points:[[1664.96,743.53],[1610,727],[1620,698],[1540,676],[1460,652],[1515,636],[1570,622],[1600,599]],
    rationale:'User identifies the residential pedestrian connections. Follow the visible courtyard walks around the housing, with tree-obscured corners approximated; accessibility unverified.'},
  {id:'preview-commons-bridge-south',from:'N265',to:'N044',points:[[1380,509],[1340,508],[1290,511],[1255,523],[1237,539]],
    rationale:'User marks the Commons-to-bridge approach. This schematic follows the south-side path around the interchange planting, not an I-44 crossing at grade.'},
  {id:'preview-i44-pedestrian-bridge',from:'N043',to:'N045',points:[[1186,476],[1174,453],[1158,424],[1138,388]],structure:'bridge',level:1,
    rationale:'User confirms the pedestrian bridge crossing over I-44. The artwork shows the separate bridge-side walkway; grade and accessibility remain unverified.'},
  {id:'preview-bridge-north-collegiate',from:'N046',to:'N254',points:[[1123,357],[1155,325],[1210,303],[1270,277],[1345,246],[1402,259],[1460,278],[1515,296]],
    rationale:'User-marked route from the bridge around the roundabout to Collegiate Boulevard and Miner Village. Sidewalk alignment is schematic, with obscured joins inferred from the illustration.'},
  {id:'preview-miner-village-court-join',from:'N260',to:'N255',points:[[1556,297],[1546,301],[1536,302]],
    rationale:'Connect the visible Miner Village courtyard spur to its adjacent frontage walkway; small planting-edge offset is schematic.'},
  {id:'preview-rolla-west-approach',from:'N218',to:'N252',points:[[2029,1231],[2019,1256],[2052,1272],[2082,1293],[2111,1314]],
    rationale:'User-marked southern housing approach follows the visible street-side walk around the block. Corner and crossing placement require field review.'},
  {id:'preview-rolla-between-buildings',from:'N251',to:'N221',points:[[2225,1323],[2244,1305],[2260,1283],[2279,1254]],
    rationale:'User identifies the walk between the Rolla Suites blocks. Schematic street-side connection follows the illustrated corridor, not a building interior.'},
  {id:'preview-south-east-block-join',from:'N224',to:'N086',points:[[2425,1206],[2437,1186],[2448,1158]],
    rationale:'Continue the user-marked street-side walk along the short southern campus block; curb transitions and accessibility unverified.'},
  {id:'preview-elm-campus-approach',from:'N080',to:'N083',points:[[2470,968],[2482,996],[2487,1020],[2470,1044],[2506,1061],[2550,1075]],
    rationale:'User-marked Elm housing approach follows the illustrated campus paths and street-side corner around buildings. Tree-obscured bends are approximate.'},
  {id:'preview-tj-campus-sidewalk',from:'N080',to:'N151',points:[[2470,968],[2500,957],[2530,944],[2553,927],[2576,907],[2600,887],[2630,865],[2660,848],[2690,843]],
    rationale:'User identifies the continuous campus-side approach toward the TJ tunnel. Follow the illustrated diagonal sidewalk to the existing descending ramp; this does not cross the highway at grade.'},
  // Replace the old lateral bridge trace, not merely its label. Portal locations
  // follow the artwork's lower ramp mouth and opposite, partly obscured mouth.
  {id:'preview-tj-underpass',from:tjSouthPortal.id,to:tjNorthPortal.id,points:[[2758,797],[2769,782],[2781,767]],
    label:'Thomas Jefferson pedestrian tunnel',structure:'tunnel',level:-1,
    reference:{url:'https://www.openstreetmap.org/way/518671101'},
    rationale:tunnelEvidence+' Revised diagonal alignment replaces the incorrect road-top bridge trace; the concealed bore and north mouth are approximate.'},
  {id:'preview-tj-south-ramp',from:'N151',to:tjSouthPortal.id,points:[[2690,843],[2710,842],[2736,817],[2758,797]],
    rationale:'Schematic approach follows the descending path toward the lower tunnel mouth, not the former road-top bridge endpoint. The existing campus-side tracing gap remains unresolved.'},
  {id:'preview-tj-north-ramp',from:tjNorthPortal.id,to:'N143',points:[[2781,767],[2790,771],[2805,777]],
    rationale:'Approximate north tunnel-mouth connection to the residence garden walk; trees obscure the ramp edge. Confirm entrance placement and accessibility on site.'},
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
const previewNodes=[...source.nodes,havenerPortal,tjSouthPortal,tjNorthPortal];
const nodes=new Map(previewNodes.map(n=>[n.id,n]));
for(const j of joins){const a=nodes.get(j.from),b=nodes.get(j.to);if(!a||!b||j.points[0][0]!==a.x||j.points[0][1]!==a.y||j.points.at(-1)[0]!==b.x||j.points.at(-1)[1]!==b.y)throw Error('Artwork preview join no longer matches reviewed endpoints: '+j.id);}
const graph={...source,nodes:previewNodes,edges:[...baseEdges,...joins.map(j=>({...j,frame:'main',reviewKey:j.id,status:'needs-geometry-review',routingEligible:false,accessibility:'unverified',evidence:j.structure==='tunnel'?'user-identified-and-osm':'inferred-connection',assumption:{rationale:j.rationale,verify:'On-campus entrance, paving, grade and access check required.'}}))]};
// Label centers on roofs are not entrances. These explicit nearby approach
// associations supersede nearest-roof-label matching for the reviewed CS core.
const approaches={'havener-center':'N010','computer-science-building':'N175'};
module.exports={graph,approaches};
