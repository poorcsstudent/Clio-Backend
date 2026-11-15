import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCampusTour } from '@/services/tourController';
import { matchInterests, interestCategory, interestColors } from '@/services/interestSelection';
import { InterestCampusMap } from './interest-campus-map';
import { BottomTabInset } from '@/constants/theme';

export default function InterestCampusScreen(){
  const tour=useCampusTour(),p=tour.planner;
  const [search,setSearch]=useState(''),[focused,setFocused]=useState<string|null>(null),[showStops,setShowStops]=useState(true),[showAssumptions,setShowAssumptions]=useState(false);
  const matches=p.catalog?matchInterests(p.catalog,p.selected,p.excluded):[],included=matches.filter(m=>m.included);
  const selectedPlace=p.catalog?.places.find(place=>place.id===focused),current=tour.activeTour?.stops[tour.activeStopIndex];
  const activeRoute=tour.activeTour?tour.walkingRoutesByTourId[tour.activeTour.tour.id]:null;
  const maneuver=activeRoute?.legs[Math.max(0,tour.activeStopIndex-1)]?.steps[tour.activeWalkingStepIndex];
  const samePlan=!!p.plan&&p.plan.session.tour.id===tour.activeTour?.tour.id;
  const cards=p.plan?p.plan.session.stops.filter(s=>s.id!=='havener-center').map(s=>matches.find(m=>m.id===s.id)!).filter(Boolean):matches;
  const action=(label:string,fn:()=>void,disabled=false,secondary=false)=><Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={fn} style={[s.button,secondary&&s.secondary,disabled&&s.disabled]}><Text style={[s.buttonText,secondary&&s.secondaryText]}>{label}</Text></Pressable>;
  return <SafeAreaView edges={['top','left','right']} style={s.screen}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>ONE CAMPUS. YOUR CURIOSITY.</Text><Text style={s.title}>Make the campus yours.</Text>
    <Text style={s.subtitle}>Choose what interests you. Clio connects the relevant places into one walking tour, beginning at Havener Center.</Text>
    {tour.cacheNotice?<Text style={s.notice}>{tour.cacheNotice}</Text>:null}{p.loading?<ActivityIndicator color="#94DFB5"/>:null}
    {[p.error,tour.error,tour.tourNotice].filter(Boolean).map((message,i)=><Text key={i} accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>)}
    {tour.activeTour&&current?<View style={s.panel}>
      <Text style={s.eyebrow}>{tour.tourPaused?'TOUR PAUSED':'YOUR WALKING TOUR'} · {tour.activeStopIndex+1}/{tour.activeTour.stops.length}</Text>
      <Text style={s.heading}>{current.name}</Text><Text style={s.body}>{current.relevance??current.description}</Text>
      <Text style={s.body}>{Platform.OS==='web'?'Browser preview: manual stop controls only; no simulated arrival or live glasses audio.':`GPS: ${tour.gpsStatus}${tour.distanceToCurrentStop===null?'':` · ${Math.round(tour.distanceToCurrentStop)} m to stop`}`}</Text>
      {maneuver?<Text style={s.instruction}>{tour.activeStopIndex===0?'Begin at Havener Center.':maneuver.instruction}</Text>:null}
      <Text style={s.small}>On iPhone: “Hey Clio”, then repeat, pause the tour, resume the tour, next stop, how far, or end the tour. Wake commands require the app open.</Text>
      <View style={s.row}>{action('Back',tour.previousStop,tour.endingTour||tour.activeStopIndex===0,true)}{action(tour.tourPaused?'Resume':'Pause',tour.toggleTourPaused,tour.endingTour,true)}{action(tour.activeStopIndex===tour.activeTour.stops.length-1?'Finish tour':'Next stop',()=>{void tour.advanceTour();},tour.endingTour)}</View>
      <View style={s.row}>{action('Replay stop',()=>{void tour.speakTourGuidance(current.audioScript??current.description);},Platform.OS!=='ios',true)}{action('Walking directions ↗',()=>tour.openWalkingDirections(current),false,true)}{action('End tour',()=>{void tour.closeActiveTour(false);},tour.endingTour,true)}</View>
      {Platform.OS!=='web'?action(tour.backgroundEnabled?'Disable background location':'Enable locked-phone tour location',()=>{void tour.toggleBackground();},false,true):null}
      <Text style={s.small}>Speech: {tour.tourSpeechStatus}. Route coverage, entrances and accessibility still require field checks.</Text>
      {!samePlan?<Text style={s.notice}>Your active tour continues independently while you edit a new selection below.</Text>:null}
    </View>:null}
    {p.catalog?<>
      <View style={s.panel}>
        <View style={s.row}><Text style={s.heading}>What brings you here?</Text>{action('Reset selection',p.reset,false,true)}</View>
        <TextInput accessibilityLabel="Search interests" placeholder="Search degrees or campus interests" placeholderTextColor="#89A79A" value={search} onChangeText={setSearch} style={s.search}/>
        {['Campus experience','Academics'].map(group=><View key={group} style={{gap:10}}><Text style={s.eyebrow}>{group}</Text><View style={s.row}>{p.catalog!.interests.filter(i=>i.group===group&&i.name.toLowerCase().includes(search.toLowerCase())).map(i=><Pressable key={i.id} accessibilityRole="button" accessibilityLabel={i.name} accessibilityState={{selected:p.selected.includes(i.id)}} onPress={()=>{p.toggleInterest(i.id);setFocused(null);}} style={[s.chip,p.selected.includes(i.id)&&s.chipSelected]}><Text style={[s.chipText,p.selected.includes(i.id)&&s.chipSelectedText]}>{p.selected.includes(i.id)?'✓ ':''}{i.name}</Text></Pressable>)}</View></View>)}
      </View>
      <View style={s.panel}>
        <Text style={s.eyebrow}>{p.selected.length} INTERESTS · {included.length} DESTINATIONS + HAVENER</Text>
        <InterestCampusMap catalog={p.catalog} selected={p.selected} ids={included.map(i=>i.id)} plan={p.plan} onSelect={setFocused}/>
        {selectedPlace?<View style={s.detail}><Text style={s.heading}>{selectedPlace.name}</Text><Text style={s.body}>{selectedPlace.description}</Text>{matches.find(m=>m.id===selectedPlace.id)?.reasons.map(r=><Text style={s.body} key={r.interest}>{r.interest}: {r.relevance}</Text>)}</View>:null}
        <View style={s.row}>{action(p.planning?'Calculating your route…':'Preview my route',()=>{void p.generate();},!included.length||p.planning)}{p.planning?<ActivityIndicator color="#94DFB5"/>:null}</View>
        {p.plan?<View style={{gap:12}}>
          <Text style={s.heading}>{p.plan.session.stops.length} stops{p.plan.walkingRoute?` · ${Math.round(p.plan.walkingRoute.distanceMeters)} m · about ${Math.ceil(p.plan.walkingRoute.durationSeconds/60)} min walking`:''}</Text>
          <Text style={s.body}>{p.plan.orderExplanation}</Text>
          {p.plan.routingError?<Text accessibilityRole="alert" style={s.error}>Walking route unavailable: {p.plan.routingError} All stops remain visible. Remove a disconnected stop or revise your interests to try again.</Text>:null}
          {p.plan.artwork.status!=='complete'?<Text style={s.notice}>The illustration has connection gaps. They are not drawn as shortcuts. Walking availability is determined separately by the geographic network.</Text>:null}
          {p.plan.artwork.warnings.length? <View style={{gap:8}}>{action(showAssumptions?'Hide map assumptions':'Review map connection assumptions',()=>setShowAssumptions(v=>!v),false,true)}{showAssumptions?p.plan.artwork.warnings.map((warning,i)=><Text key={i} style={s.notice}>{warning}</Text>):null}</View>:null}
          {action(samePlan?'Tour is active':tour.activeTour?'Switch to this personalized tour':'Start my tour at Havener',()=>{if(p.plan)void tour.beginTour(p.plan.session.tour,p.plan);},!p.plan.walkingRoute||samePlan||tour.startingTourId!==null)}
          <Text style={s.small}>Walking time excludes time spent at stops. Follow posted pedestrian guidance; artwork is not proof of a safe crossing or an accessible entrance.</Text>
        </View>:null}
      </View>
      <View style={s.panel}>
        <View style={s.row}><Text style={s.heading}>{p.plan?'Your tour stops':'Your campus matches'}</Text>{action(showStops?'Collapse list':`Review ${cards.length} matches`,()=>setShowStops(v=>!v),false,true)}</View>
        {!p.selected.length?<Text style={s.body}>Select interests above to reveal relevant buildings. Their highlight size reflects matching-interest counts.</Text>:null}
        {showStops?cards.map((place,index)=><View key={place.id} style={[s.detail,!place.included&&s.disabled]}>
          <Text style={[s.eyebrow,{color:interestColors[interestCategory(place,p.catalog!,p.selected)]}]}>{p.plan?`STOP ${index+2}`:`${place.reasons.length} MATCHING INTEREST${place.reasons.length===1?'':'S'}`}</Text>
          <Text style={s.heading}>{place.name}</Text>{place.reasons.map(r=><Text key={r.interest} style={s.body}>{r.interest}: {r.relevance}</Text>)}
          {action(place.included?'Remove stop':'Include stop',()=>p.toggleStop(place.id),false,true)}
        </View>):null}
      </View>
    </>:null}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#091F18'},content:{padding:24,paddingBottom:BottomTabInset+32,gap:20,maxWidth:1200,width:'100%',alignSelf:'center'},
  eyebrow:{color:'#94DFB5',fontSize:11,fontWeight:'800',letterSpacing:1.6},title:{color:'#F4F2E9',fontSize:42,fontWeight:'900'},subtitle:{color:'#B8CDC1',fontSize:17,lineHeight:26},
  panel:{backgroundColor:'#102A21',padding:20,borderRadius:24,borderWidth:1,borderColor:'#315644',gap:16},heading:{color:'#F4F2E9',fontSize:21,fontWeight:'800',flexShrink:1},body:{color:'#BED0C6',fontSize:14,lineHeight:21},small:{color:'#8FAE9D',fontSize:12,lineHeight:18},
  row:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'center'},search:{color:'#F4F2E9',backgroundColor:'#091F18',padding:14,borderRadius:12,borderWidth:1,borderColor:'#315644',fontSize:16},
  chip:{paddingVertical:11,paddingHorizontal:14,borderRadius:24,borderWidth:1,borderColor:'#456856'},chipSelected:{backgroundColor:'#94DFB5',borderColor:'#94DFB5'},chipText:{color:'#CEE1D5',fontSize:14},chipSelectedText:{color:'#092117',fontWeight:'700'},
  button:{backgroundColor:'#94DFB5',paddingVertical:14,paddingHorizontal:18,borderRadius:14,alignItems:'center'},buttonText:{color:'#092117',fontSize:14,fontWeight:'800'},secondary:{backgroundColor:'transparent',borderWidth:1,borderColor:'#52745F'},secondaryText:{color:'#B8E4CB'},disabled:{opacity:.45},
  notice:{color:'#E5CA85',fontSize:13,lineHeight:20},error:{color:'#FFAF9D',fontSize:14,lineHeight:22},detail:{borderTopWidth:1,borderColor:'#315644',paddingTop:16,gap:10},instruction:{color:'#F4F2E9',fontSize:18,lineHeight:26,fontWeight:'700'},
});
