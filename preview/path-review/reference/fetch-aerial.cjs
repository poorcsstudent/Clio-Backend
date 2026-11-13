const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base='https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer';
const bbox=[-91.779,37.951,-91.770,37.958];
const json=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.error)throw Error(JSON.stringify(j.error));return j;};
(async()=>{
 const service=await json(base+'?f=json');
 const query=new URLSearchParams({bbox:bbox.join(','),bboxSR:'4326',imageSR:'4326',size:'1200,1200',adjustAspectRatio:'false',format:'jpg',f:'json'});
 const result=await json(base+'/exportImage?'+query);
 if(!result.href||new URL(result.href).hostname!=='imagery.nationalmap.gov')throw Error('Unexpected imagery host');
 const r=await fetch(result.href,{signal:AbortSignal.timeout(45000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('Image unavailable');
 const data=Buffer.from(await r.arrayBuffer());fs.writeFileSync(path.join(__dirname,'aerial.jpg'),data);
 fs.writeFileSync(path.join(__dirname,'aerial-manifest.json'),JSON.stringify({service:base,retrievedAt:new Date().toISOString(),extent:result.extent,width:result.width,height:result.height,attribution:service.copyrightText||'USGS The National Map / NAIP Plus',acquisitionDate:'Not established for this mosaic; retrieval date is not capture date.',sha256:crypto.createHash('sha256').update(data).digest('hex'),file:'aerial.jpg',status:'reference-only'},null,2));
 console.log('Downloaded core-campus aerial reference: '+data.length+' bytes');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
