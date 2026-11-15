import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { interestCategory, interestColors, type InterestCatalog, type InterestPlan } from '@/services/interestSelection';

/** Artwork coordinates only: never use this layer for GPS or spoken directions. */
export function InterestCampusMap({catalog,selected,ids,plan,onSelect}:{catalog:InterestCatalog;selected:string[];ids:string[];plan:InterestPlan|null;onSelect:(id:string)=>void}) {
  const [width,setWidth]=useState(900),[zoom,setZoom]=useState(1);
  const scale=width*zoom/catalog.layout.width, height=catalog.layout.height*scale;
  const order=plan?.session.stops.map(s=>s.id),shown=order??['havener-center',...ids];
  return <View style={{gap:12}} onLayout={e=>setWidth(Math.max(280,e.nativeEvent.layout.width))}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'}}>
      <Text style={{color:'#E7F5EC',fontWeight:'800',flex:1}}>Your visit on the campus map</Text>
      {[1,2,3].map(z=><Pressable key={z} accessibilityRole="button" accessibilityLabel={z===1?'Fit campus map':`Zoom map ${z} times`} accessibilityState={{selected:zoom===z}} onPress={()=>setZoom(z)} style={{padding:10,backgroundColor:zoom===z?'#94DFB5':'#274A3A',borderRadius:10}}><Text style={{color:zoom===z?'#10251A':'#fff'}}>{z===1?'Fit':`${z}×`}</Text></Pressable>)}
    </View>
    <ScrollView horizontal nestedScrollEnabled style={{height:Math.max(240,Math.min(570,height)),borderRadius:20,backgroundColor:'#203E32'}}>
      <ScrollView nestedScrollEnabled style={{width:width*zoom,height:Math.max(240,Math.min(570,height))}}>
        <View style={{width:width*zoom,height,position:'relative'}}>
          <Image source={require('../../preview/campus-tracing-source.png')} accessibilityLabel="Missouri S&T illustrated campus map" style={{width:width*zoom,height}} />
          {plan?.artwork.legs.flatMap((leg,li)=>leg.parts.flatMap((part,pi)=>part.points.slice(1).map((p,si)=>{
            const a=part.points[si],dx=(p[0]-a[0])*scale,dy=(p[1]-a[1])*scale,length=Math.hypot(dx,dy),place=catalog.places.find(v=>v.id===leg.toStopId);
            const color=part.structure==='tunnel'?'#66E3F0':place?interestColors[interestCategory(place,catalog,selected)]:'#94DFB5';
            return <View key={`${li}-${pi}-${si}`} pointerEvents="none" style={{position:'absolute',left:(a[0]+p[0])*scale/2-length/2,top:(a[1]+p[1])*scale/2-2,width:length,height:4,backgroundColor:color,opacity:part.candidate?.65:1,transform:[{rotate:`${Math.atan2(dy,dx)}rad`}],borderWidth:.5,borderColor:'#fff'}}/>;
          })))}
          {shown.map((id,index)=>{const place=catalog.places.find(p=>p.id===id),point=catalog.layout.buildings[id];if(!place||!point)return null;
            const color=interestColors[interestCategory(place,catalog,selected)],score=catalog.interests.filter(i=>selected.includes(i.id)&&i.matches.some(m=>m.placeId===id)).length,size=order?28:24+Math.min(score,4)*3;
            return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${order?`Stop ${index+1}`:`${score} matching interests`}: ${place.name}`} onPress={()=>onSelect(id)} style={{position:'absolute',left:point.imageX*scale-size/2,top:point.imageY*scale-size/2,width:size,height:size,borderRadius:size/2,backgroundColor:color,borderColor:'#fff',borderWidth:2,alignItems:'center',justifyContent:'center',boxShadow:`0 0 ${Math.max(6,score*5)}px ${color}`}}><Text style={{color:'#fff',fontSize:12,fontWeight:'900'}}>{order?index+1:id==='havener-center'?'H':score}</Text></Pressable>;
          })}
        </View>
      </ScrollView>
    </ScrollView>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:14}}>{Object.entries(interestColors).map(([key,color])=><Text key={key} style={{color,fontSize:12}}>● {({start:'Start',academics:'Academics',life:'Campus life',housing:'Housing',landmarks:'History & landmarks'})[key as keyof typeof interestColors]}</Text>)}</View>
    <Text style={{color:'#A8C1B3',fontSize:12,lineHeight:18}}>Visual aid, not live GPS. Numbers become tour order after planning; before planning, highlights show matching-interest counts. Cyan paths are tunnels. Faded paths are assumptions. Geographic paths—not artwork pixels—control walking instructions.</Text>
    {shown.some(id=>!catalog.layout.buildings[id])?<Text style={{color:'#EDC877'}}>Some selected stops have no confirmed artwork position. They remain in your stop list.</Text>:null}
    <Pressable accessibilityRole="link" onPress={()=>Linking.openURL('https://www.mst.edu/map/overlay-map/')}><Text style={{color:'#94DFB5',fontSize:12}}>Map artwork © Missouri S&amp;T · Official map ↗</Text></Pressable>
  </View>;
}
