// Review artifact only. Never imported by the application or route service.
const fs = require('node:fs');
const path = require('node:path');
const scale = 3114 / 2048;
// Manual first-pass centerline tracing from the full illustration rendered at 2048px.
// Endpoints at junctions are shared; intermediate points retain drawn bends.
const lines = [
 ['plaza-west', [[1105,646],[1124,635],[1145,633],[1170,640]], false],
 ['plaza-north', [[1170,640],[1192,642],[1215,647]], false],
 ['oval-north', [[1105,646],[1127,653],[1150,647],[1180,648],[1215,647]], false],
 ['oval-southwest', [[1127,653],[1130,671],[1145,687],[1170,702]], false],
 ['oval-cross', [[1130,671],[1168,676],[1200,671],[1235,657]], false],
 ['oval-east', [[1215,647],[1235,657],[1260,678],[1280,704]], false],
 ['oval-diagonal', [[1170,702],[1200,680],[1235,657]], false],
 ['havener-east', [[1215,647],[1231,628],[1248,608]], true],
 ['quad-west', [[1248,608],[1241,590],[1240,576]], false],
 ['quad-northwest', [[1240,576],[1262,576],[1282,574]], false],
 ['quad-north', [[1282,574],[1307,586],[1329,602]], false],
 ['quad-middle-west', [[1248,608],[1273,617]], false],
 ['quad-middle-east', [[1273,617],[1302,609],[1329,602]], false],
 ['quad-diagonal-nw', [[1240,576],[1257,596],[1273,617]], false],
 ['quad-diagonal-se', [[1273,617],[1286,638]], false],
 ['quad-south', [[1231,628],[1254,630],[1286,638]], false],
 ['quad-diagonal-ne', [[1282,574],[1279,594],[1273,617]], false],
 ['quad-east', [[1329,602],[1307,620],[1286,638]], false],
 ['library-front', [[1329,602],[1351,606],[1380,617],[1400,625]], false],
 ['library-east', [[1400,625],[1428,635],[1455,643]], true],
 ['east-court', [[1455,643],[1475,631],[1492,625]], false],
 ['cs-south', [[1402,574],[1425,580],[1454,589],[1476,585]], true],
 ['cs-east', [[1476,585],[1508,567],[1524,565]], false],
 ['east-walk', [[1524,565],[1540,579],[1560,584],[1580,590]], true],
 ['library-cs', [[1329,602],[1352,589],[1381,577],[1402,574]], true],
 ['east-court-north', [[1492,625],[1501,611],[1515,607]], true],
 ['east-cross', [[1515,607],[1542,615],[1560,628],[1584,636]], true],
 ['south-court', [[1280,704],[1300,716],[1327,720],[1358,729]], true],
 ['south-circle-west', [[1358,729],[1381,726],[1393,730]], false],
 ['south-circle-east', [[1393,730],[1407,734],[1420,742]], false],
 ['southwest-walk', [[1170,702],[1152,721],[1139,741],[1127,757]], true],
 ['southwest-diagonal', [[1127,757],[1091,791],[1065,815]], false],
 ['south-front', [[1065,815],[1091,822],[1119,831],[1154,843],[1181,852],[1207,863]], false],
 ['south-quad', [[1127,757],[1158,770],[1191,784],[1223,800],[1258,811]], true],
 ['south-east', [[1258,811],[1290,814],[1320,823],[1345,832]], true],
 ['east-south-court', [[1420,742],[1445,757],[1472,770]], true],
 ['east-green', [[1472,770],[1507,779],[1541,792]], true],
 ['residential-west-verge', [[879,410],[882,433],[893,448]], false],
 ['residential-lawn-north', [[879,410],[900,416],[912,426]], false],
 ['residential-lawn-cross', [[882,433],[912,426],[949,420],[984,415]], false],
 ['residential-lawn-south', [[893,448],[923,457],[964,470],[1004,484],[1058,499]], true],
 ['residential-lawn-diagonal', [[912,426],[946,438],[979,451],[1014,463],[1062,477]], false],
 ['residential-east-link', [[1062,477],[1058,499]], false],
 ['residential-front-walk', [[984,415],[990,439],[1008,446],[1023,449],[1038,459],[1062,465],[1062,477]], true],
 ['residential-east-garden', [[1095,489],[1112,500],[1133,505],[1158,496],[1179,482],[1191,469]], true],
 ['residential-north-link', [[1095,489],[1106,467],[1122,452]], true],
 ['north-academic-verge', [[1191,469],[1219,462],[1245,452],[1273,447],[1303,448],[1333,454]], true],
 ['north-academic-front', [[1333,454],[1359,462],[1388,470],[1418,481]], true],
 ['havener-west-verge', [[1105,646],[1088,639],[1074,627],[1080,606],[1087,586]], false],
 ['havener-south-approach', [[1088,639],[1101,624],[1113,615]], true],
 ['roundabout-south-verge', [[1088,639],[1064,636],[1032,641],[1003,646]], false],
 ['roundabout-northwest-verge', [[981,631],[969,610],[958,593],[940,581]], false],
 ['tim-bradley-west-footpath', [[940,581],[918,569],[898,555],[880,548],[864,550],[862,564],[847,579]], false],
 ['southwest-residence-walk', [[1065,815],[1046,832],[1034,844],[1015,861],[1003,869]], true],
 ['south-boundary-walk', [[1003,869],[1038,882],[1073,895],[1105,906],[1136,917]], true],
 ['main-street-front-walk', [[1136,917],[1163,894],[1183,879],[1207,863]], true],
 ['athletics-approach', [[748,784],[778,766],[797,750],[816,748]], true],
 ['athletics-north-path', [[718,677],[732,669],[751,665],[770,666]], true],
 ['gym-east-walk', [[816,748],[799,740],[778,733],[759,730]], true],
 ['stadium-northeast-walk', [[455,642],[482,661],[506,671],[537,685]], false],
 ['stadium-east-path', [[506,671],[498,693],[484,712],[472,725]], true],
 ['recreation-front-path', [[472,725],[444,736],[420,744]], true],
 ['bridge-deck-candidate', [[751,255],[762,268],[772,288],[782,309]], true],
 ['bridge-south-approach-candidate', [[782,309],[788,327],[809,345],[830,365],[847,386]], true],
 ['bridge-north-approach-candidate', [[751,255],[743,244],[739,235]], true],
 ['residential-southwest-entry', [[847,386],[863,403],[879,410]], true],
];
// Full-resolution refinements. These coordinates are measured directly in the
// 3114x1746 source frame, unlike the initial reduced-image sampling above.
const refined = [
 ['quad-west', [[1886,908],[1916,924],[1923,946],[1932,977]], false],
 ['quad-middle-west', [[1916,924],[1957,941]], false],
 ['quad-middle-east', [[1957,941],[1998,926],[2023,918]], false],
 ['quad-diagonal-se', [[1957,941],[1949,957]], false],
 ['quad-south', [[1932,977],[1949,957]], false],
 ['quad-east', [[1949,957],[1974,942],[1998,926]], false],
 ['quad-northwest', [[1881,867],[1908,864],[1939,862]], false],
 ['quad-north', [[1939,862],[1970,874],[1994,890],[2023,918]], true],
 ['quad-diagonal-nw', [[1886,908],[1901,917],[1916,924]], false],
 ['quad-diagonal-ne', [[1939,862],[1946,902],[1957,941]], true],
 ['library-front', [[2023,918],[2044,927],[2053,948],[2069,965]], true],
 ['oval-north', [[1710,990],[1730,980],[1770,979],[1815,988],[1860,1001],[1885,1017]], false],
 ['oval-southwest', [[1710,990],[1719,1020],[1730,1033],[1760,1055],[1806,1077]], false],
 ['oval-cross', [[1719,1020],[1760,1026],[1803,1027],[1840,1024],[1885,1017]], false],
 ['oval-diagonal', [[1806,1077],[1843,1049],[1885,1017]], false],
 ['oval-east', [[1885,1017],[1910,1030],[1933,1048],[1948,1068],[1945,1082]], false],
 ['plaza-west', [[1670,977],[1691,959],[1715,955],[1744,963],[1777,972]], false],
 ['plaza-north', [[1777,972],[1810,980],[1839,989],[1859,996]], false],
 ['oval-north-approach', [[1670,977],[1692,983],[1710,990]], false],
 ['oval-east-approach', [[1859,996],[1873,1005],[1885,1017]], false],
 ['southwest-gallery-diagonal', [[1616,1250],[1634,1238],[1651,1224],[1670,1208]], false],
 ['southwest-gallery-west', [[1616,1250],[1655,1263],[1692,1275],[1730,1288],[1770,1302],[1808,1315],[1833,1324]], false],
 ['southwest-gallery-east', [[1833,1324],[1857,1306],[1881,1287],[1903,1269],[1920,1251]], false],
 ['southwest-gallery-north', [[1670,1208],[1697,1214],[1718,1221]], false],
 ['gallery-northeast-garden', [[1880,1220],[1903,1229],[1920,1237],[1920,1251]], false],
 ['southwest-gallery-branch', [[1651,1224],[1675,1227],[1693,1234]], false],
 ['south-tree-walk-west', [[1872,1208],[1895,1216],[1924,1223],[1952,1233],[1970,1240]], false],
 ['south-tree-walk-east', [[1970,1240],[1990,1222],[2012,1202]], false],
 ['east-lawn-west', [[2414,898],[2424,934],[2427,970],[2422,1015]], false],
 ['east-lawn-diagonal', [[2414,898],[2433,925],[2452,958]], false],
 ['east-lawn-middle', [[2427,970],[2448,970],[2470,968]], false],
 ['east-lawn-southeast', [[2447,1031],[2461,1012],[2478,994]], false],
 ['east-building-south-walk', [[2550,1075],[2569,1080],[2587,1082]], false],
 ['east-southern-sidewalk', [[2472,1174],[2494,1153],[2528,1120],[2551,1097],[2587,1082]], false],
 ['east-building-access', [[2472,1174],[2460,1169],[2448,1158]], false],
 ['east-sidewalk-north-end', [[2587,1082],[2612,1076],[2637,1068]], true],
];
// Move shared junctions with refinements rather than leaving the old endpoints
// disconnected. These are explicit correspondences, not proximity snapping.
const movedJunctions = new Map(Object.entries({
 '1105,646':[1670,977], '1170,640':[1777,972], '1215,647':[1859,996],
 '1127,653':[1710,990], '1130,671':[1719,1020], '1170,702':[1806,1077],
 '1235,657':[1885,1017], '1280,704':[1945,1082],
 '1065,815':[1616,1250], '1207,863':[1833,1324],
 '1248,608':[1916,924], '1240,576':[1886,908], '1282,574':[1939,862],
 '1273,617':[1957,941], '1286,638':[1949,957], '1231,628':[1932,977],
 '1329,602':[2023,918], '1400,625':[2069,965],
}));
for(const line of lines)line[1]=line[1].map(p=>movedJunctions.has(p.join(','))?movedJunctions.get(p.join(',')).map(v=>v/scale):p);
// Superseded overview traces are removed rather than doubled on the drawing.
for(const label of ['south-front','main-street-front-walk']){
 const i=lines.findIndex(line=>line[0]===label);if(i>=0)lines.splice(i,1);
}
for(const [label,points,uncertain] of refined){
 const existing=lines.findIndex(line=>line[0]===label);
 const entry=[label,points.map(p=>p.map(v=>v/scale)),uncertain];
 if(existing>=0)lines[existing]=entry;else lines.push(entry);
}
const refinedLabels=new Set(refined.map(r=>r[0]));
const nodes = [], edges = [], lookup = new Map();
function node(p) { const key=p.join(','); if(!lookup.has(key)){ const id='N'+String(nodes.length+1).padStart(3,'0');lookup.set(key,id);nodes.push({id,x:+(p[0]*scale).toFixed(2),y:+(p[1]*scale).toFixed(2),gps:null}); } return lookup.get(key); }
// A junction appearing inside another trace must split that trace. Do not
// automatically connect geometric crossings: they may be grade separated.
const endpoints = new Set(lines.flatMap(([,p])=>[p[0].join(','),p.at(-1).join(',')]));
for(const [label,points,uncertain] of lines){
 let start=0,part=0;
 for(let i=1;i<points.length;i++){
  if(i!==points.length-1&&!endpoints.has(points[i].join(',')))continue;
  const segment=points.slice(start,i+1);start=i;
  edges.push({id:'E'+String(edges.length+1).padStart(3,'0'),trace:label,part:++part,label,
   from:node(segment[0]),to:node(segment.at(-1)),points:segment.map(p=>p.map(v=>+(v*scale).toFixed(2))),
   status:uncertain?'needs-geometry-review':'visible-path-draft',sampling:refinedLabels.has(label)?'full-resolution-source':'reduced-overview',accessibility:'unverified',distanceMeters:null});
 }
}
const graph={version:2,status:'DRAFT_NOT_APPROVED_NOT_ROUTABLE',scope:'Academic core, residential lawn, partial south and athletics approaches; incomplete',width:3114,height:1746,source:'https://assets.codepen.io/220427/mapmap-bg_2.png',walkabilityBasis:'User confirms visible campus paths are walkable; individual traces have not been reviewed.',nodes,edges};
// Preserve candidate geometry for review, but explicitly exclude it from any
// future graph import until the user approves each connection.
for(const edge of edges){edge.routingEligible=false;edge.reviewKey=edge.trace+':'+edge.part;}
graph.candidateEdgeIds=edges.filter(e=>e.status==='needs-geometry-review').map(e=>e.id);
graph.visibleDraftEdgeIds=edges.filter(e=>e.status==='visible-path-draft').map(e=>e.id);
fs.writeFileSync(path.join(__dirname,'graph-draft.json'),JSON.stringify(graph,null,2));
const geometry=edges.map(e=>`<g><polyline points="${e.points.map(p=>p.join(',')).join(' ')}" class="${e.status==='needs-geometry-review'?'uncertain':''}"><title>${e.id}: ${e.label}</title></polyline><text x="${e.points[Math.floor(e.points.length/2)][0]}" y="${e.points[Math.floor(e.points.length/2)][1]-7}">${e.id}</text></g>`).join('')+nodes.map(n=>`<g><circle cx="${n.x}" cy="${n.y}" r="5"/><text x="${n.x+7}" y="${n.y+12}">${n.id}</text></g>`).join('');
const style='polyline{fill:none;stroke:#007e85;stroke-width:4;stroke-linejoin:round;stroke-linecap:round}.uncertain{stroke:#cc6500;stroke-dasharray:9 6}circle{fill:white;stroke:#143e58;stroke-width:2}text{font:11px monospace;fill:#153447;paint-order:stroke;stroke:white;stroke-width:3px;stroke-linejoin:round}';
for(const overlay of [false,true])fs.writeFileSync(path.join(__dirname,overlay?'overlay.svg':'network.svg'),`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="3114" height="1746" viewBox="0 0 3114 1746"><title>Clio central campus path tracing — incomplete review draft</title><style>${style}</style><rect width="3114" height="1746" fill="#f7faf9"/>${overlay?'<image href="../campus-tracing-source.png" width="3114" height="1746" opacity=".65"/>':''}${geometry}</svg>`);
fs.writeFileSync(path.join(__dirname,'index.html'),`<!doctype html><meta charset="utf-8"><title>Clio path review — draft 1</title><style>body{font:16px system-ui;background:#f7faf9;color:#153447;margin:24px}button{padding:10px;margin:4px}#sheet{overflow:auto;border:1px solid #789}svg{width:1800px;height:auto}text{display:none}.labels text{display:block}${style}</style><h1>Campus path review · draft 1</h1><p>Central academic area only · ${nodes.length} nodes / ${edges.length} edges · NOT approved or connected to routing.</p><p>Teal: visible-path draft. Dashed orange: geometry needs closer review. All accessibility unverified. Pixel dimensions preserved; no ground-distance claims.</p><button id="base">Hide map artwork</button><button id="labels">Show node / edge IDs</button><button id="core">Focus academic core</button><button id="full">Full illustration</button><p>Blank areas are untraced—not evidence that no path exists. Separate campus insets must not be connected by image proximity.</p><div id="sheet"><svg id="svg" viewBox="0 0 3114 1746" role="img" aria-label="Review draft of campus sidewalk graph"><image id="art" href="../campus-tracing-source.png" width="3114" height="1746" opacity=".65"/>${geometry}</svg></div><script>const art=document.getElementById('art'),svg=document.getElementById('svg');document.getElementById('base').onclick=function(){art.style.display=art.style.display==='none'?'':'none';this.textContent=art.style.display==='none'?'Show map artwork':'Hide map artwork'};document.getElementById('labels').onclick=function(){svg.classList.toggle('labels');this.textContent=svg.classList.contains('labels')?'Hide node / edge IDs':'Show node / edge IDs'};document.getElementById('core').onclick=()=>svg.setAttribute('viewBox','1570 810 920 560');document.getElementById('full').onclick=()=>svg.setAttribute('viewBox','0 0 3114 1746');</script>`);
console.log(`${nodes.length} nodes, ${edges.length} edges generated; review only.`);
// The review-specific page supersedes the original draft-one viewer.
fs.copyFileSync(path.join(__dirname,'review.html'),path.join(__dirname,'index.html'));
const visibleEdges=edges.filter(e=>e.status==='visible-path-draft');
const usedNodes=new Set(visibleEdges.flatMap(e=>[e.from,e.to]));
const visibleGeometry=visibleEdges.map(e=>`<polyline points="${e.points.map(p=>p.join(',')).join(' ')}"><title>${e.id}: ${e.label}</title></polyline>`).join('')+nodes.filter(n=>usedNodes.has(n.id)).map(n=>`<circle cx="${n.x}" cy="${n.y}" r="5"><title>${n.id}</title></circle>`).join('');
fs.writeFileSync(path.join(__dirname,'visible-network.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="3114" height="1746" viewBox="0 0 3114 1746"><title>Visible path traces only — incomplete unapproved draft</title><style>${style}</style><rect width="3114" height="1746" fill="#f7faf9"/>${visibleGeometry}</svg>`);
