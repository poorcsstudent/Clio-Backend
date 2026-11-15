import type { CampusWalkingRoute, TourSession } from './api';
import { validArtwork, validSavedRoute, validTourProgress } from './tourProgressValidation';
export interface InterestPlace { id:string; name:string; category:string; description:string; latitude:number; longitude:number }
export interface Interest { id:string; name:string; group:string; matches:Array<{placeId:string;relevance:string}> }
export interface ArtworkLayout { width:number; height:number; buildings:Record<string,{imageX:number;imageY:number;mapNumber:number}> }
export interface InterestCatalog { interests:Interest[]; places:InterestPlace[]; layout:ArtworkLayout }
export interface ArtworkRoute { legs:Array<{fromStopId:string;toStopId:string;error:string|null;parts:Array<{points:number[][];candidate:boolean;structure?:string}>}>; warnings:string[]; status:string }
export interface InterestPlan { session:TourSession; walkingRoute:CampusWalkingRoute|null; artwork:ArtworkRoute; routingError:string|null; orderExplanation:string; interestIds:string[]; excludedIds:string[] }
export function validInterestPlan(value:any):value is InterestPlan {
  if(!value||!validTourProgress({origin:'preview',savedAt:Date.now(),session:value.session,stopIndex:0},'preview')||!validArtwork(value.artwork)
    ||typeof value.orderExplanation!=='string'||!(value.routingError===null||typeof value.routingError==='string')
    ||![value.interestIds,value.excludedIds].every(ids=>Array.isArray(ids)&&ids.every(id=>typeof id==='string')))return false;
  const ids=value.session.stops.map((s:any)=>s.id);
  if(ids[0]!=='havener-center'||new Set(ids).size!==ids.length||value.artwork.legs.length!==ids.length-1)return false;
  if(!value.artwork.legs.every((leg:any,i:number)=>leg.fromStopId===ids[i]&&leg.toStopId===ids[i+1]))return false;
  if(value.walkingRoute===null)return typeof value.routingError==='string';
  return validSavedRoute(value.walkingRoute,value.session.tour.id)&&value.walkingRoute.provider==='clio-pedestrian-network'
    &&JSON.stringify(value.walkingRoute.stopOrder)===JSON.stringify(ids)&&value.walkingRoute.legs.length===ids.length-1
    &&value.walkingRoute.legs.every((leg:any,i:number)=>leg.fromStopId===ids[i]&&leg.toStopId===ids[i+1]);
}
export function matchInterests(catalog:InterestCatalog, selected:string[], excluded:string[]) {
  return catalog.places.filter(p=>p.id!=='havener-center').map(place=>({ ...place,
    reasons:catalog.interests.filter(i=>selected.includes(i.id)).flatMap(i=>i.matches.filter(m=>m.placeId===place.id).map(m=>({interest:i.name,relevance:m.relevance}))),
    included:!excluded.includes(place.id),
  })).filter(p=>p.reasons.length).sort((a,b)=>b.reasons.length-a.reasons.length||a.name.localeCompare(b.name));
}
export const interestColors = { start:'#E5B94F', academics:'#3978D4', life:'#16825D', housing:'#9253BD', landmarks:'#BD6330' };
export function interestCategory(place:InterestPlace,catalog:InterestCatalog,selected:string[]) {
  if(place.id==='havener-center')return 'start';
  if(/housing/i.test(place.category))return 'housing';
  if(/landmark|historic/i.test(place.category))return 'landmarks';
  return catalog.interests.some(i=>i.group==='Academics'&&selected.includes(i.id)&&i.matches.some(m=>m.placeId===place.id))?'academics':'life';
}
