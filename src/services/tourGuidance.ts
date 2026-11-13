import {distanceBetweenCoordinatesMeters as meters} from './tourLocation';
import {distanceToWalkingPathMeters} from './walkingNavigation';
type Point={latitude:number;longitude:number};
export type GuidanceStep={instruction:string;path:Point[];distanceMeters:number;kind?:string};
export type GuidanceFix=Point&{accuracy:number|null;timestamp:number};
export function reliableGuidanceFix(f:GuidanceFix,now=Date.now()){return Number.isFinite(f.latitude)&&Math.abs(f.latitude)<=90&&Number.isFinite(f.longitude)&&Math.abs(f.longitude)<=180&&f.accuracy!==null&&Number.isFinite(f.accuracy)&&f.accuracy>=0&&f.accuracy<=25&&Number.isFinite(f.timestamp)&&now-f.timestamp>=0&&now-f.timestamp<=10000;}
/** Per-leg cue state. GPS uncertainty never advances this state. */
export function createGuidanceTracker(initialIndex=0){
 let lastTimestamp=0,lastIndex=initialIndex,lastCue=0,offSamples=0;const announced=new Set<string>();
 return (steps:GuidanceStep[],fix:GuidanceFix,now=Date.now(),canSpeak=true)=>{
  lastIndex=Math.max(0,Math.min(lastIndex,steps.length-1));
  if(!steps.length||!reliableGuidanceFix(fix,now)||fix.timestamp<=lastTimestamp)return {index:lastIndex,uncertain:true,cue:null};
  lastTimestamp=fix.timestamp;
  const distances=steps.map(s=>distanceToWalkingPathMeters(fix,s.path));
  const nearest=distances.reduce((a,d,i)=>d<distances[a]?i:a,0);
  if(distances[nearest]>45){offSamples++;if(canSpeak&&offSamples>=3&&now-lastCue>30000){lastCue=now;return {index:lastIndex,uncertain:true,cue:'You appear away from the mapped walking route. Stop in a suitable place and ask Clio for directions; do not cross a road to rejoin it.'};}return {index:lastIndex,uncertain:true,cue:null};}
  offSamples=0;
  if(nearest>lastIndex+1||nearest<lastIndex)return {index:lastIndex,uncertain:true,cue:null};
  // Advance at most one maneuver per fix; do not jump across nearby parallel legs.
  if(nearest===lastIndex+1)lastIndex=nearest;
  if(!canSpeak)return {index:lastIndex,uncertain:false,cue:null};
  const current=steps[lastIndex],next=steps[lastIndex+1];
  let key='start:'+lastIndex,text=current.instruction;
  if(['tunnel','crossing','stairs'].includes(current.kind??'')&&!announced.has('at:'+lastIndex)){key='at:'+lastIndex;}
  else if(next&&meters(fix,next.path[0])<=25){key='advance:'+(lastIndex+1);text='Coming up: '+next.instruction;}
  else if(lastIndex>0){key='at:'+lastIndex;}
  if(announced.has(key)||now-lastCue<12000)return {index:lastIndex,uncertain:false,cue:null};
  announced.add(key);lastCue=now;return {index:lastIndex,uncertain:false,cue:text};
 };
}

export type TourCommand='repeat'|'pause'|'resume'|'skip'|'end'|'distance'|'directions'|'camera-directions';
export function parseTourCommand(text:string):TourCommand|null{
 const t=text.toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim().replace(/^(hey )?cli+o\s+/,'');
 if(/^(look around|use (the )?camera|look and tell me which way to go|what way am i facing)$/.test(t))return 'camera-directions';
 if(/^(which way (do i go|should i go)|where do i go|give me directions|directions)$/.test(t))return 'directions';
 if(/^(repeat( (that|directions|instruction))?|say that again)$/.test(t))return 'repeat';
 if(/^(pause|pause (the )?tour)$/.test(t))return 'pause';
 if(/^(resume|resume (the )?tour|continue (the )?tour)$/.test(t))return 'resume';
 if(/^(skip( this stop| (the )?stop)?|next stop)$/.test(t))return 'skip';
 if(/^(end|stop) (the )?tour$/.test(t))return 'end';
 if(/^(how far( is (the )?next stop)?|distance to (the )?next stop)$/.test(t))return 'distance';
 return null;
}

export type TourVoiceContext={active:boolean;paused:boolean;tourId:string;destinationId:string;instruction:string;onRoute?:boolean;position?:GuidanceFix};
let handler:((command:TourCommand)=>Promise<string>)|null=null;
let context:TourVoiceContext|null=null;
export function registerTourVoice(next:typeof handler){handler=next;return()=>{if(handler===next)handler=null;};}
export function setTourVoiceContext(next:TourVoiceContext|null){context=next;}
export function getTourVoiceContext(){return context;}
export async function dispatchTourCommand(text:string){const command=parseTourCommand(text);if(!command||!handler||!context?.active)return null;return {command,answer:await handler(command)};}
