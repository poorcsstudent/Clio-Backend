import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Location from 'expo-location';
import { Linking, Platform, useWindowDimensions } from 'react-native';
import type { MapCoordinate } from '@/components/campus-route-map';
import { subscribeCacheNotice } from './publicCache';
import { loadTourProgress, saveTourProgress } from './tourProgress';
import { attachBackgroundTour, requestTourBackgroundPermission } from './tourBackground';
import { createGuidanceTracker, reliableGuidanceFix, registerTourVoice, setTourVoiceContext, type GuidanceFix } from './tourGuidance';
import { voiceIsBusy } from './voiceFocus';
import { createLocationEpoch } from './locationEpoch';
import { getCampusTours, apiBaseUrl, endTour, getTourStops, getWalkingRoute, startTour, type CampusWalkingRoute, type CampusTour, type CampusTourCatalog, type TourSession, type TourStop } from './api';
import { distanceBetweenCoordinatesMeters, createArrivalTracker, TOUR_ARRIVAL_RADIUS_METERS } from './tourLocation';
import { distanceToWalkingPathMeters } from './walkingNavigation';
import { addNativeSpeechStateListener, startTourSpeech, cancelPendingTourSpeech, stopNativeSpeech } from './wake-phrase';
type GpsStatus = 'idle'|'requesting'|'tracking'|'uncertain'|'paused'|'denied'|'disabled'|'error';
type TourSpeechStatus = 'idle'|'queued'|'speaking'|'finished'|'unavailable';

function useTourController() {
  const [cacheNotice, setCacheNotice] = useState('');
  useEffect(() => subscribeCacheNotice(setCacheNotice), []);
  const { width } = useWindowDimensions();
  const [catalog, setCatalog] = useState<CampusTourCatalog | null>(null);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [routesByTourId, setRoutesByTourId] = useState<Record<string, TourStop[]>>({});
  const [walkingRoutesByTourId, setWalkingRoutesByTourId] = useState<
    Record<string, CampusWalkingRoute>
  >({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingTourId, setLoadingTourId] = useState<string | null>(null);
  const [startingTourId, setStartingTourId] = useState<string | null>(null);
  const [activeTour, setActiveTour] = useState<TourSession | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [activeWalkingStepIndex, setActiveWalkingStepIndex] = useState(0);
  const [tourPaused, setTourPaused] = useState(false);
  const [endingTour, setEndingTour] = useState(false);
  const endingTourRef = useRef(false);
  const [tourNotice, setTourNotice] = useState('');
  const [tourSpeechStatus, setTourSpeechStatus] =
    useState<TourSpeechStatus>('idle');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [distanceToCurrentStop, setDistanceToCurrentStop] = useState<number | null>(null);
  const [distanceToActivePath, setDistanceToActivePath] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate | null>(null);
  const [error, setError] = useState('');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const tourNarrationPending = useRef(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const latestFix = useRef<GuidanceFix | null>(null);
  const narrationEpoch = useRef(0);
  const guidanceCertain = useRef(false);
  const locationEpoch = useRef(createLocationEpoch());

  function invalidatePosition() {
    locationEpoch.current.invalidate();
    latestFix.current = null;
    guidanceCertain.current = false;
    setTourVoiceContext(null);
  }

  useEffect(() => {
    let active = true;
    void loadTourProgress(apiBaseUrl).then(saved => {
      if (!active) return;
      if (saved) {
        setTourPaused(true);
        setGpsStatus('paused');
        setActiveTour(saved.session);
        setActiveStopIndex(saved.stopIndex);
        setSelectedTourId(saved.session.tour.id);
        setRoutesByTourId(current => ({ ...current, [saved.session.tour.id]: saved.session.stops }));
        if (saved.route?.provider === 'clio-pedestrian-network' && saved.route.legs.every(leg => leg.steps.every(step => step.kind))) {
          setWalkingRoutesByTourId(current => ({ ...current, [saved.session.tour.id]: saved.route! }));
        } else {
          // Never restore an old straight-line or hand-curated route as network guidance.
          void getWalkingRoute(saved.session.tour.id).then(route => {
            if (active) setWalkingRoutesByTourId(current => ({ ...current, [saved.session.tour.id]: route }));
          }).catch(() => {
            if (active) setError('Saved stops were restored, but an updated pedestrian route is unavailable. No old route has been substituted.');
          });
        }
        setTourNotice(`Saved tour restored paused at stop ${saved.stopIndex + 1}. Check your surroundings before resuming. Saved information may be outdated.`);
      }
      setProgressLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    void saveTourProgress(activeTour ? {
      origin: apiBaseUrl, savedAt: Date.now(), session: activeTour,
      stopIndex: activeStopIndex, route: walkingRoutesByTourId[activeTour.tour.id] ?? null,
    } : null).catch(() => setTourNotice('Tour progress could not be saved on this device. Keep the app open to preserve this session.'));
  }, [progressLoaded, activeTour, activeStopIndex, walkingRoutesByTourId]);

  async function speakTourGuidance(text: string, locationDependent = false) {
    if (Platform.OS !== 'ios' || !text.trim()) return;

    tourNarrationPending.current = true;
    setTourSpeechStatus('queued');
    const epoch = narrationEpoch.current;
    try {
      const route = await startTourSpeech(text.trim(), () => epoch === narrationEpoch.current &&
        (!locationDependent || !!latestFix.current && reliableGuidanceFix(latestFix.current)));
      if (!route) { tourNarrationPending.current = false; setTourSpeechStatus('idle'); }
    } catch {
      tourNarrationPending.current = false;
      setTourSpeechStatus('unavailable');
    }
  }

  function arrivalNarration(
    stop: TourStop,
    nextStop: TourStop | undefined,
    finalStop: boolean,
  ) {
    const stopNarration =
      stop.audioScript ?? `You have arrived at ${stop.name}. ${stop.relevance ?? stop.description}`;
    if (finalStop) {
      return `${stopNarration} You have completed this walking pilot.`;
    }
    return `${stopNarration} Next, continue to ${nextStop?.name}.`;
  }

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const subscription = addNativeSpeechStateListener(event => {
      if (event.kind !== 'answer' || event.owner !== 'tour') return;
      if (event.stage === 'queued') {
        setTourSpeechStatus('queued');
      } else if (event.stage === 'started') {
        setTourSpeechStatus('speaking');
      } else if (event.stage === 'finished') {
        tourNarrationPending.current = false;
        setTourSpeechStatus('finished');
        // The Ask Clio screen owns the user's wake-listening preference.
        // Finishing tour narration must not enable the microphone on its own.
      } else if (event.stage === 'cancelled') {
        tourNarrationPending.current = false;
        setTourSpeechStatus('idle');
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;
    getCampusTours()
      .then(result => {
        if (active) setCatalog(result);
      })
      .catch(reason => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not load degree tours');
        }
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const columnCount = width >= 980 ? 3 : width >= 640 ? 2 : 1;
  const tourGridWidth = Math.max(0, width - 70);
  const tourCardWidth = useMemo(
    () => Math.max(0, (tourGridWidth - (columnCount - 1) * 10) / columnCount),
    [columnCount, tourGridWidth],
  );

  async function toggleTour(tour: CampusTour) {
    if (tour.id === selectedTourId) {
      setSelectedTourId('');
      setSelectedStopId(null);
      return;
    }

    setError('');
    setSelectedStopId(null);
    setSelectedTourId(tour.id);
    if (!walkingRoutesByTourId[tour.id]) {
      void getWalkingRoute(tour.id)
        .then(walkingRoute => {
          setWalkingRoutesByTourId(current => ({
            ...current,
            [tour.id]: walkingRoute,
          }));
        })
        .catch(reason => setError(reason instanceof Error ? reason.message : 'Pedestrian route unavailable'));
    }
    if (routesByTourId[tour.id]) return;

    setLoadingTourId(tour.id);
    try {
      const route = await getTourStops(tour.id);
      setRoutesByTourId(current => ({ ...current, [tour.id]: route }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load this route');
    } finally {
      setLoadingTourId(current => (current === tour.id ? null : current));
    }
  }

  async function beginTour(tour: CampusTour) {
    if (!progressLoaded) return;
    setStartingTourId(tour.id);
    setError('');
    setTourNotice('');

    try {
      const walkingRoute = walkingRoutesByTourId[tour.id] ?? await getWalkingRoute(tour.id);
      if (activeTour) {
        await endTour(activeTour.sessionId);
      }
      const session = await startTour(tour.id);
      invalidatePosition();
      narrationEpoch.current++;
      latestFix.current = null;
      setActiveTour(session);
      setActiveStopIndex(0);
      setActiveWalkingStepIndex(0);
      setTourPaused(false);
      setGpsStatus('requesting');
      setDistanceToCurrentStop(null);
      setDistanceToActivePath(null);
      setGpsAccuracy(null);
      setUserCoordinate(null);
      setTourSpeechStatus('idle');
      setSelectedTourId(tour.id);
      setSelectedStopId(null);
      setRoutesByTourId(current => ({ ...current, [tour.id]: session.stops }));
      setWalkingRoutesByTourId(current => ({
        ...current,
        [tour.id]: walkingRoute,
      }));
      void speakTourGuidance(
        `${tour.name} walking pilot started. Begin at Havener Center. Clio will advance after several fresh location readings within ${TOUR_ARRIVAL_RADIUS_METERS} meters over at least eight seconds.`,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not start this tour');
    } finally {
      setStartingTourId(null);
    }
  }

  async function closeActiveTour(completed: boolean) {
    if (!activeTour || endingTourRef.current) return;
    invalidatePosition();
    endingTourRef.current = true;
    setEndingTour(true);
    setError('');
    setTourPaused(true);
    setGpsStatus('paused');
    if (!completed) {
      narrationEpoch.current++;
      cancelPendingTourSpeech();
      tourNarrationPending.current = false;
      setTourSpeechStatus('idle');
      await stopNativeSpeech().catch(() => false);
    }

    try {
      await endTour(activeTour.sessionId);
      setTourNotice(
        completed
          ? `${activeTour.tour.name} completed.`
          : `${activeTour.tour.name} ended at stop ${activeStopIndex + 1}.`,
      );
    } catch {
      setTourNotice('Tour ended on this phone. The backend could not confirm the end request; no automatic retry is queued.');
    } finally {
      // A network failure must not trap the user in a restored/offline tour.
      setActiveTour(null);
      setActiveStopIndex(0);
      setActiveWalkingStepIndex(0);
      setTourPaused(false);
      setGpsStatus('idle');
      setDistanceToCurrentStop(null);
      setDistanceToActivePath(null);
      setGpsAccuracy(null);
      setUserCoordinate(null);
      endingTourRef.current = false;
      setEndingTour(false);
    }
  }

  async function advanceTour(narrate = true) {
    if (!activeTour || endingTourRef.current) return;
    invalidatePosition();
    const currentStop = activeTour.stops[activeStopIndex];
    const finalStop = activeStopIndex >= activeTour.stops.length - 1;
    const nextStop = activeTour.stops[activeStopIndex + 1];
    narrationEpoch.current++;
    cancelPendingTourSpeech();
    if (currentStop && narrate) {
      void speakTourGuidance(
        arrivalNarration(currentStop, nextStop, finalStop),
      );
    }
    if (finalStop) {
      await closeActiveTour(narrate);
      return;
    }
    setActiveStopIndex(current => current + 1);
    setActiveWalkingStepIndex(0);
    setDistanceToCurrentStop(null);
    setDistanceToActivePath(null);
    setGpsAccuracy(null);
    setSelectedStopId(null);
  }

  function toggleTourPaused() {
    if (endingTourRef.current) return;
    invalidatePosition();
    const nextPaused = !tourPaused;
    narrationEpoch.current++;
    cancelPendingTourSpeech();
    setTourPaused(nextPaused);
    setGpsStatus(nextPaused ? 'paused' : 'requesting');
    if (nextPaused && tourNarrationPending.current) {
      tourNarrationPending.current = false;
      setTourSpeechStatus('idle');
      void stopNativeSpeech().catch(() => {
        setError('The tour is paused, but audio could not be stopped. Check the phone audio controls.');
      });
    }
    if (!nextPaused) {
      setDistanceToCurrentStop(null);
      setDistanceToActivePath(null);
      setGpsAccuracy(null);
    }
  }

  async function openWalkingDirections(stop: TourStop) {
    const destination = `${stop.latitude},${stop.longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&dirflg=w`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    await Linking.openURL(url);
  }

  function previousStop() {
    if (endingTourRef.current) return;
    invalidatePosition();
    narrationEpoch.current++; cancelPendingTourSpeech();
    setActiveStopIndex(current => Math.max(0, current - 1));
    setActiveWalkingStepIndex(0); setDistanceToCurrentStop(null);
    setDistanceToActivePath(null); setGpsAccuracy(null); setSelectedStopId(null);
    latestFix.current = null;
  }

  const activeWalkingRoute = activeTour
    ? walkingRoutesByTourId[activeTour.tour.id] ?? null
    : null;

  useEffect(() => {
    if (!activeTour) { setTourVoiceContext(null); return; }
    const stop = activeTour.stops[activeStopIndex];
    const step = activeWalkingRoute?.legs[activeStopIndex - 1]?.steps[activeWalkingStepIndex];
    const instruction = step?.instruction ?? `Begin at ${stop.name}. Follow posted pedestrian signs; Clio has not confirmed your position on the route.`;
    setTourVoiceContext({ active: true, paused: tourPaused, tourId: activeTour.tour.id,
      destinationId: stop.id, instruction, onRoute: guidanceCertain.current && distanceToActivePath !== null && distanceToActivePath <= 45, ...(latestFix.current ? { position: latestFix.current } : {}) });
    return registerTourVoice(async command => {
      if (command === 'pause') { if (!tourPaused) toggleTourPaused(); return 'Tour paused. Location tracking and automatic cues are stopped.'; }
      if (command === 'resume') { if (tourPaused) toggleTourPaused(); return 'Tour resumed. Waiting for a fresh, precise location before giving walking cues.'; }
      if (command === 'end') { await closeActiveTour(false); return 'Tour ended on this phone.'; }
      if (command === 'skip') { await advanceTour(false); return activeTour.stops[activeStopIndex + 1] ? `Skipped this stop. The next stop is ${activeTour.stops[activeStopIndex + 1].name}. Wait for a new location fix.` : 'Last stop skipped. Tour ended.'; }
      if (tourPaused) return 'The tour is paused. Say resume the tour when you are ready.';
      if (!latestFix.current || !reliableGuidanceFix(latestFix.current)) return 'Your position is uncertain. Stay on the pedestrian path and follow posted signs. In a tunnel, wait until you exit and GPS recovers; Clio will not guess a turn.';
      if (command === 'distance') return distanceToCurrentStop === null ? 'Distance is not available yet.' : `${Math.round(distanceToCurrentStop)} meters in a straight line to ${stop.name}. The walking distance may be longer.`;
      if (activeStopIndex > 0 && (!guidanceCertain.current || distanceToActivePath === null || distanceToActivePath > 45)) return 'I cannot confirm your progress on the active mapped path. Check posted signs or the optional map from a suitable place; do not cross a road just to rejoin it.';
      return `Toward ${stop.name}: ${instruction} Left and right refer to travel along the mapped route, not a measured direction you are facing.`;
    });
  });
  useEffect(() => () => { setTourVoiceContext(null); cancelPendingTourSpeech(); narrationEpoch.current++; }, []);

  async function toggleBackground() {
    if (backgroundEnabled) { setBackgroundEnabled(false); return; }
    try {
      const allowed = await requestTourBackgroundPermission();
      setBackgroundEnabled(allowed);
      setTourNotice(allowed ? 'Background tour location enabled for this app session. Pause or end the tour to stop. Locked-phone speech still requires a physical iPhone test.' : 'Background location was not granted. The tour still works with Clio open.');
    } catch { setTourNotice('Background location is unavailable in this build. Keep Clio open.'); }
  }

  useEffect(() => {
    if (!activeTour || Platform.OS === 'web' || tourPaused) return;

    const tourSession = activeTour;
    const stop = tourSession.stops[activeStopIndex];
    if (!stop) return;
    const activeWalkingLeg =
      activeStopIndex > 0
        ? activeWalkingRoute?.legs[
            Math.min(activeStopIndex - 1, activeWalkingRoute.legs.length - 1)
          ]
        : undefined;

    let cancelled = false;
    const epoch = locationEpoch.current.begin();
    latestFix.current = null;
    setTourVoiceContext(null);
    let subscription: Location.LocationSubscription | null = null;
    const checkArrival = createArrivalTracker();
    const guide = createGuidanceTracker(activeWalkingStepIndex);
    guidanceCertain.current = false;
    let arrivalHandled = false;
    let detachBackground: (() => void) | undefined;
    let lastUncertaintyCue = 0;
    const staleTimer = setInterval(() => {
      if (cancelled || !epoch.current() || arrivalHandled || voiceIsBusy()) return;
      if ((!latestFix.current || !reliableGuidanceFix(latestFix.current)) && Date.now() - lastUncertaintyCue > 60000) {
        setGpsStatus('uncertain');
        lastUncertaintyCue = Date.now();
        void speakTourGuidance('Position is uncertain. Walking turn prompts are on hold. Follow posted pedestrian signs, and wait for GPS to recover after leaving a tunnel.');
      }
    }, 15000);

    function handleLocation(location: Location.LocationObject) {
      if (cancelled || !epoch.accepts(location.timestamp) || arrivalHandled || endingTourRef.current) return;

      const accuracy = location.coords.accuracy;
      const fix = { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy, timestamp: location.timestamp };
      if (latestFix.current && fix.timestamp <= latestFix.current.timestamp) return;
      latestFix.current = fix;
      const currentCoordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const distance = distanceBetweenCoordinatesMeters(
        currentCoordinate,
        { latitude: stop.latitude, longitude: stop.longitude },
      );

      setGpsStatus('tracking');
      setDistanceToCurrentStop(distance);
      setGpsAccuracy(accuracy);
      setUserCoordinate(currentCoordinate);
      if (activeWalkingLeg) {
        setDistanceToActivePath(
          distanceToWalkingPathMeters(currentCoordinate, activeWalkingLeg.path),
        );
        {
          const guidance = guide(activeWalkingLeg.steps, fix, Date.now(), !voiceIsBusy());
          guidanceCertain.current = !guidance.uncertain;
          if (guidance.uncertain) setGpsStatus('uncertain');
          setActiveWalkingStepIndex(guidance.index);
          if (guidance.cue) { void speakTourGuidance(guidance.cue, true); }
        }
      } else {
        setDistanceToActivePath(null);
        setActiveWalkingStepIndex(0);
      }

      const arrivalPositionReliable = reliableGuidanceFix(fix) && (!activeWalkingLeg || guidanceCertain.current);
      if (endingTourRef.current || !checkArrival(distance, arrivalPositionReliable ? accuracy : null, location.timestamp)) return;
      arrivalHandled = true;
      narrationEpoch.current++;
      cancelPendingTourSpeech();

      const finalStop = activeStopIndex === tourSession.stops.length - 1;
      const nextStop = tourSession.stops[activeStopIndex + 1];
      void speakTourGuidance(
        arrivalNarration(stop, nextStop, finalStop),
      );
      if (!finalStop) {
        setTourNotice(`Arrived at ${stop.name}. Advancing to ${nextStop.name}.`);
        setActiveStopIndex(current => (current === activeStopIndex ? current + 1 : current));
        setActiveWalkingStepIndex(0);
        setSelectedStopId(null);
        setDistanceToCurrentStop(null);
        setDistanceToActivePath(null);
        setGpsAccuracy(null);
        return;
      }

      setTourNotice(`Arrived at ${stop.name}. Completing ${tourSession.tour.name}…`);
      // Completion belongs to the session, not this GPS subscription's lifetime.
      // Pausing tracking cleans up this effect; it must not discard end cleanup.
      void closeActiveTour(true);
    }

    async function startTracking() {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (cancelled || !epoch.current()) return;
        if (!servicesEnabled) {
          setGpsStatus('disabled');
          return;
        }

        let permission = await Location.getForegroundPermissionsAsync();
        if (cancelled || !epoch.current()) return;
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (cancelled || !epoch.current()) return;
        if (!permission.granted) {
          setGpsStatus('denied');
          return;
        }

        if (backgroundEnabled) detachBackground = attachBackgroundTour(handleLocation, () => {
          setBackgroundEnabled(false);
          if (!cancelled && epoch.current()) setGpsStatus('error');
          setTourNotice('Background location could not be started or stopped reliably. Keep Clio open for guidance. If the OS location indicator remains after ending the tour, turn off Clio location access in Settings.');
        });

        const createdSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            // Dwell confirmation needs updates even while standing at a stop.
            distanceInterval: 0,
            timeInterval: 2_000,
          },
          handleLocation,
          () => {
            if (!cancelled && epoch.current()) setGpsStatus('error');
          },
        );
        if (cancelled || !epoch.current()) {
          createdSubscription.remove();
          return;
        }
        subscription = createdSubscription;

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        handleLocation(currentLocation);
      } catch {
        if (!cancelled && epoch.current()) setGpsStatus('error');
      }
    }

    void startTracking();
    return () => {
      cancelled = true;
      epoch.cancel();
      subscription?.remove();
      detachBackground?.();
      clearInterval(staleTimer);
    };
  }, [activeStopIndex, activeTour, activeWalkingRoute, tourPaused, backgroundEnabled]);

  return { cacheNotice, catalog, selectedTourId, routesByTourId, walkingRoutesByTourId, loadingCatalog, loadingTourId, startingTourId, activeTour, activeStopIndex, activeWalkingStepIndex, tourPaused, endingTour, tourNotice, tourSpeechStatus, gpsStatus, distanceToCurrentStop, distanceToActivePath, gpsAccuracy, userCoordinate, error, selectedStopId, backgroundEnabled, showMap, columnCount, tourGridWidth, tourCardWidth, previousStop, setSelectedStopId, setShowMap, toggleTour, beginTour, closeActiveTour, advanceTour, toggleTourPaused, openWalkingDirections, speakTourGuidance, toggleBackground };
}
const TourContext = createContext<ReturnType<typeof useTourController> | null>(null);
export function TourProvider({ children }: { children: ReactNode }) {
  const tour = useTourController();
  return <TourContext.Provider value={tour}>{children}</TourContext.Provider>;
}
export function useCampusTour() {
  const tour = useContext(TourContext);
  if (!tour) throw new Error('TourProvider is required');
  return tour;
}

