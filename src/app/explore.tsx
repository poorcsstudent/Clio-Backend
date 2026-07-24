import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import {
  getCampusTours,
  endTour,
  getTourStops,
  startTour,
  type CampusTour,
  type CampusTourCatalog,
  type TourSession,
  type TourStop,
} from '@/services/api';
import {
  distanceBetweenCoordinatesMeters,
  isReliableTourArrival,
  TOUR_ARRIVAL_RADIUS_METERS,
  TOUR_REQUIRED_ARRIVAL_SAMPLES,
} from '@/services/tourLocation';

type GpsStatus = 'idle' | 'requesting' | 'tracking' | 'denied' | 'disabled' | 'error';

function gpsStatusCopy(
  status: GpsStatus | 'preview',
  distanceMeters: number | null,
  accuracyMeters: number | null,
) {
  switch (status) {
    case 'tracking':
      return distanceMeters === null
        ? 'Waiting for a precise GPS fix…'
        : `${Math.round(distanceMeters)} m away · accuracy ±${Math.round(accuracyMeters ?? 0)} m`;
    case 'requesting':
      return 'Requesting precise location…';
    case 'denied':
      return 'Location permission is required for automatic arrivals.';
    case 'disabled':
      return 'Location Services are turned off on this iPhone.';
    case 'error':
      return 'GPS tracking paused. Manual tour controls still work.';
    case 'preview':
      return `Activates on iPhone within ${TOUR_ARRIVAL_RADIUS_METERS} m of a stop.`;
    default:
      return 'GPS activates when the tour starts.';
  }
}

export default function CampusScreen() {
  const { width } = useWindowDimensions();
  const [catalog, setCatalog] = useState<CampusTourCatalog | null>(null);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [routesByTourId, setRoutesByTourId] = useState<Record<string, TourStop[]>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingTourId, setLoadingTourId] = useState<string | null>(null);
  const [startingTourId, setStartingTourId] = useState<string | null>(null);
  const [activeTour, setActiveTour] = useState<TourSession | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [endingTour, setEndingTour] = useState(false);
  const [tourNotice, setTourNotice] = useState('');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [distanceToCurrentStop, setDistanceToCurrentStop] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

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
    setStartingTourId(tour.id);
    setError('');
    setTourNotice('');

    try {
      if (activeTour) {
        await endTour(activeTour.sessionId);
      }
      const session = await startTour(tour.id);
      setActiveTour(session);
      setActiveStopIndex(0);
      setGpsStatus('requesting');
      setDistanceToCurrentStop(null);
      setGpsAccuracy(null);
      setSelectedTourId(tour.id);
      setSelectedStopId(null);
      setRoutesByTourId(current => ({ ...current, [tour.id]: session.stops }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not start this tour');
    } finally {
      setStartingTourId(null);
    }
  }

  async function closeActiveTour(completed: boolean) {
    if (!activeTour || endingTour) return;
    setEndingTour(true);
    setError('');

    try {
      await endTour(activeTour.sessionId);
      setTourNotice(
        completed
          ? `${activeTour.tour.name} completed.`
          : `${activeTour.tour.name} ended at stop ${activeStopIndex + 1}.`,
      );
      setActiveTour(null);
      setActiveStopIndex(0);
      setGpsStatus('idle');
      setDistanceToCurrentStop(null);
      setGpsAccuracy(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not end this tour');
    } finally {
      setEndingTour(false);
    }
  }

  async function advanceTour() {
    if (!activeTour) return;
    if (activeStopIndex >= activeTour.stops.length - 1) {
      await closeActiveTour(true);
      return;
    }
    setActiveStopIndex(current => current + 1);
    setDistanceToCurrentStop(null);
    setGpsAccuracy(null);
    setSelectedStopId(null);
  }

  async function openWalkingDirections(stop: TourStop) {
    const destination = `${stop.latitude},${stop.longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&dirflg=w`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    await Linking.openURL(url);
  }

  useEffect(() => {
    if (!activeTour || Platform.OS === 'web') return;

    const tourSession = activeTour;
    const stop = tourSession.stops[activeStopIndex];
    if (!stop) return;

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    let arrivalSamples = 0;
    let arrivalHandled = false;

    function handleLocation(location: Location.LocationObject) {
      if (cancelled || arrivalHandled) return;

      const accuracy = location.coords.accuracy;
      const distance = distanceBetweenCoordinatesMeters(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        { latitude: stop.latitude, longitude: stop.longitude },
      );

      setGpsStatus('tracking');
      setDistanceToCurrentStop(distance);
      setGpsAccuracy(accuracy);

      if (isReliableTourArrival(distance, accuracy)) {
        arrivalSamples += 1;
      } else {
        arrivalSamples = 0;
      }

      if (arrivalSamples < TOUR_REQUIRED_ARRIVAL_SAMPLES) return;
      arrivalHandled = true;

      const finalStop = activeStopIndex === tourSession.stops.length - 1;
      if (!finalStop) {
        const nextStop = tourSession.stops[activeStopIndex + 1];
        setTourNotice(`Arrived at ${stop.name}. Advancing to ${nextStop.name}.`);
        setActiveStopIndex(current => (current === activeStopIndex ? current + 1 : current));
        setSelectedStopId(null);
        setDistanceToCurrentStop(null);
        setGpsAccuracy(null);
        return;
      }

      setTourNotice(`Arrived at ${stop.name}. Completing ${tourSession.tour.name}…`);
      setEndingTour(true);
      void endTour(tourSession.sessionId)
        .then(() => {
          if (cancelled) return;
          setTourNotice(`${tourSession.tour.name} completed automatically at ${stop.name}.`);
          setActiveTour(null);
          setActiveStopIndex(0);
          setGpsStatus('idle');
          setDistanceToCurrentStop(null);
          setGpsAccuracy(null);
        })
        .catch(reason => {
          if (cancelled) return;
          setError(reason instanceof Error ? reason.message : 'Could not complete this tour');
          setGpsStatus('error');
        })
        .finally(() => {
          if (!cancelled) setEndingTour(false);
        });
    }

    async function startTracking() {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (cancelled) return;
        if (!servicesEnabled) {
          setGpsStatus('disabled');
          return;
        }

        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (cancelled) return;
        if (!permission.granted) {
          setGpsStatus('denied');
          return;
        }

        const createdSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 3,
            timeInterval: 2_000,
          },
          handleLocation,
          () => {
            if (!cancelled) setGpsStatus('error');
          },
        );
        if (cancelled) {
          createdSubscription.remove();
          return;
        }
        subscription = createdSubscription;

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        handleLocation(currentLocation);
      } catch {
        if (!cancelled) setGpsStatus('error');
      }
    }

    void startTracking();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [activeStopIndex, activeTour]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>DEGREE TOUR GRID</Text>
        <Text style={styles.title}>
          {catalog?.metadata.degreeProgramCount ?? 33} degree tours.{`\n`}One campus graph.
        </Text>
        <Text style={styles.subtitle}>
          Every route starts at Havener Center. Open any program below to see the campus stops
          connected to that degree.
        </Text>

        {loadingCatalog ? (
          <ActivityIndicator color="#7EE2AE" size="large" style={styles.loader} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {tourNotice ? <Text style={styles.tourNotice}>{tourNotice}</Text> : null}

        {catalog ? (
          <View style={styles.tourWindow}>
            <View style={styles.tourWindowHeader}>
              <View style={styles.tourWindowHeaderCopy}>
                <Text style={styles.tourWindowEyebrow}>AVAILABLE TOURS</Text>
                <Text style={styles.tourWindowTitle}>Tap a program to reveal its stops</Text>
              </View>
              <View style={styles.tourCountPill}>
                <Text style={styles.tourCountText}>{catalog.tours.length} tours</Text>
              </View>
            </View>

            <View style={styles.tourGrid}>
              {catalog.tours.map(tour => {
                const expanded = tour.id === selectedTourId;
                const route = routesByTourId[tour.id] ?? [];
                const loadingRoute = loadingTourId === tour.id;
                const isActiveTour = activeTour?.tour.id === tour.id;
                const currentStop = isActiveTour ? activeTour.stops[activeStopIndex] : null;
                const tourProgress = isActiveTour
                  ? ((activeStopIndex + 1) / activeTour.stops.length) * 100
                  : 0;
                const displayedGpsStatus: GpsStatus | 'preview' =
                  Platform.OS === 'web' && isActiveTour ? 'preview' : gpsStatus;

                return (
                  <View
                    key={tour.id}
                    style={[
                      styles.tourCard,
                      { width: expanded ? tourGridWidth : tourCardWidth },
                      expanded && styles.tourCardExpanded,
                    ]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      style={({ pressed }) => [
                        styles.tourCardButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => toggleTour(tour)}>
                      <View style={styles.tourCardCopy}>
                        <Text style={styles.tourCardMeta}>
                          {tour.degreeTypes?.join(' / ') ?? 'CAMPUS'} · {tour.stopCount} STOPS
                        </Text>
                        <Text style={styles.tourCardName}>{tour.name.replace(/ Tour$/, '')}</Text>
                      </View>
                      <View style={[styles.expandButton, expanded && styles.expandButtonActive]}>
                        <Text
                          style={[
                            styles.expandButtonText,
                            expanded && styles.expandButtonTextActive,
                          ]}>
                          {expanded ? '−' : '+'}
                        </Text>
                      </View>
                    </Pressable>

                    {expanded ? (
                      <View style={styles.expandedTour}>
                        <View style={styles.programSummary}>
                          <Text style={styles.programDescription}>{tour.description}</Text>
                          {tour.emphasisAreas?.length ? (
                            <Text style={styles.emphasisText}>
                              Emphasis areas: {tour.emphasisAreas.join(' · ')}
                            </Text>
                          ) : null}
                          <View style={styles.routeRule}>
                            <Text style={styles.routeRuleLabel}>ROUTE LOGIC</Text>
                            <Text style={styles.routeRuleText}>
                              Havener root · {tour.routeStrategy.replaceAll('-', ' ')}
                            </Text>
                          </View>
                          {tour.catalogUrl ? (
                            <Pressable
                              accessibilityRole="link"
                              style={({ pressed }) => [
                                styles.catalogButton,
                                pressed && styles.pressed,
                              ]}
                              onPress={() => Linking.openURL(tour.catalogUrl!)}>
                              <Text style={styles.catalogButtonText}>
                                Open official S&amp;T program page ↗
                              </Text>
                            </Pressable>
                          ) : null}
                          {!isActiveTour ? (
                            <Pressable
                              accessibilityRole="button"
                              disabled={startingTourId !== null}
                              style={({ pressed }) => [
                                styles.startTourButton,
                                pressed && styles.pressed,
                                startingTourId !== null && styles.disabled,
                              ]}
                              onPress={() => beginTour(tour)}>
                              {startingTourId === tour.id ? (
                                <ActivityIndicator color="#071A15" size="small" />
                              ) : (
                                <>
                                  <Text style={styles.startTourButtonText}>
                                    {activeTour ? 'Switch to this tour' : 'Start this tour'}
                                  </Text>
                                  <Text style={styles.startTourButtonMeta}>
                                    Begin at Havener Center →
                                  </Text>
                                </>
                              )}
                            </Pressable>
                          ) : null}
                        </View>

                        {isActiveTour && currentStop ? (
                          <View style={styles.activeGuide}>
                            <View style={styles.activeGuideHeader}>
                              <View style={styles.activeGuideHeaderCopy}>
                                <Text style={styles.liveLabel}>LIVE TOUR</Text>
                                <Text style={styles.activeGuideTitle}>{tour.name}</Text>
                              </View>
                              <Text style={styles.progressLabel} numberOfLines={1}>
                                {activeStopIndex + 1} / {activeTour.stops.length}
                              </Text>
                            </View>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  { width: `${tourProgress}%` as `${number}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.currentStopEyebrow}>CURRENT STOP</Text>
                            <Text style={styles.currentStopName}>{currentStop.name}</Text>
                            <Text style={styles.currentStopDescription}>
                              {currentStop.relevance ?? currentStop.description}
                            </Text>
                            <View style={styles.gpsCard}>
                              <View style={styles.gpsHeader}>
                                <View
                                  style={[
                                    styles.gpsDot,
                                    (displayedGpsStatus === 'tracking' ||
                                      displayedGpsStatus === 'preview') &&
                                      styles.gpsDotActive,
                                    (displayedGpsStatus === 'denied' ||
                                      displayedGpsStatus === 'disabled' ||
                                      displayedGpsStatus === 'error') &&
                                      styles.gpsDotError,
                                  ]}
                                />
                                <Text style={styles.gpsTitle}>Automatic GPS arrival</Text>
                                <Text style={styles.gpsRadius}>
                                  {TOUR_ARRIVAL_RADIUS_METERS} m radius
                                </Text>
                              </View>
                              <Text style={styles.gpsStatusText}>
                                {gpsStatusCopy(
                                  displayedGpsStatus,
                                  distanceToCurrentStop,
                                  gpsAccuracy,
                                )}
                              </Text>
                              {(displayedGpsStatus === 'denied' ||
                                displayedGpsStatus === 'disabled') &&
                              Platform.OS !== 'web' ? (
                                <Pressable
                                  accessibilityRole="button"
                                  style={({ pressed }) => [
                                    styles.locationSettingsButton,
                                    pressed && styles.pressed,
                                  ]}
                                  onPress={() => Linking.openSettings()}>
                                  <Text style={styles.locationSettingsButtonText}>
                                    Open location settings
                                  </Text>
                                </Pressable>
                              ) : null}
                            </View>
                            <Pressable
                              accessibilityRole="link"
                              style={({ pressed }) => [
                                styles.directionsButton,
                                pressed && styles.pressed,
                              ]}
                              onPress={() => openWalkingDirections(currentStop)}>
                              <Text style={styles.directionsButtonText}>
                                Open walking directions ↗
                              </Text>
                            </Pressable>
                            <View style={styles.tourControls}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ disabled: activeStopIndex === 0 }}
                                disabled={activeStopIndex === 0}
                                style={({ pressed }) => [
                                  styles.secondaryControl,
                                  pressed && styles.pressed,
                                  activeStopIndex === 0 && styles.disabled,
                                ]}
                                onPress={() => {
                                  setActiveStopIndex(current => Math.max(0, current - 1));
                                  setDistanceToCurrentStop(null);
                                  setGpsAccuracy(null);
                                  setSelectedStopId(null);
                                }}>
                                <Text style={styles.secondaryControlText}>Back</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                  styles.nextControl,
                                  pressed && styles.pressed,
                                ]}
                                onPress={advanceTour}>
                                <Text style={styles.nextControlText}>
                                  {activeStopIndex === activeTour.stops.length - 1
                                    ? 'Finish tour'
                                    : 'Next stop'}
                                </Text>
                              </Pressable>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              disabled={endingTour}
                              style={({ pressed }) => [
                                styles.endTourButton,
                                pressed && styles.pressed,
                                endingTour && styles.disabled,
                              ]}
                              onPress={() => closeActiveTour(false)}>
                              <Text style={styles.endTourButtonText}>
                                {endingTour ? 'Ending tour…' : 'End tour'}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}

                        {loadingRoute ? (
                          <ActivityIndicator
                            color="#7EE2AE"
                            size="large"
                            style={styles.routeLoader}
                          />
                        ) : null}

                        {!loadingRoute && route.length ? (
                          <View style={styles.timeline}>
                            {route.map((stop, index) => {
                              const open = selectedStopId === stop.id;
                              const current = isActiveTour && index === activeStopIndex;
                              const completed = isActiveTour && index < activeStopIndex;
                              return (
                                <View key={stop.id} style={styles.stopRow}>
                                  <View style={styles.markerColumn}>
                                    <View
                                      style={[
                                        styles.marker,
                                        (current || completed) && styles.markerActive,
                                      ]}>
                                      <Text
                                        style={[
                                          styles.markerText,
                                          (current || completed) && styles.markerTextActive,
                                        ]}>
                                        {index + 1}
                                      </Text>
                                    </View>
                                    {index < route.length - 1 ? (
                                      <View style={styles.line} />
                                    ) : null}
                                  </View>
                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.stopCard,
                                      current && styles.currentStopCard,
                                      completed && styles.completedStopCard,
                                      pressed && styles.pressed,
                                    ]}
                                    onPress={() => setSelectedStopId(open ? null : stop.id)}>
                                    <View style={styles.stopHeader}>
                                      <Text style={styles.stopName}>{stop.name}</Text>
                                      {current ? (
                                        <Text style={styles.currentLabel}>CURRENT</Text>
                                      ) : completed ? (
                                        <Text style={styles.completedLabel}>DONE</Text>
                                      ) : index === 0 ? (
                                        <Text style={styles.rootLabel}>ROOT</Text>
                                      ) : null}
                                    </View>
                                    <Text style={styles.stopDescription}>
                                      {stop.relevance ?? stop.description}
                                    </Text>
                                    {typeof stop.distanceFromPreviousMeters === 'number' &&
                                    index > 0 ? (
                                      <Text style={styles.distance}>
                                        ≈ {stop.distanceFromPreviousMeters.toLocaleString()} m from
                                        prior stop
                                      </Text>
                                    ) : null}
                                    {open ? (
                                      <View style={styles.detail}>
                                        <Text style={styles.detailLabel}>
                                          OFFICIAL MAP RECORD
                                        </Text>
                                        <Text style={styles.detailText}>{stop.description}</Text>
                                        <Text style={styles.detailLabel}>COORDINATES</Text>
                                        <Text style={styles.detailText}>
                                          {stop.latitude}, {stop.longitude}
                                        </Text>
                                        {stop.suggestedQuestions?.map(question => (
                                          <Text key={question} style={styles.question}>
                                            • {question}
                                          </Text>
                                        ))}
                                      </View>
                                    ) : null}
                                  </Pressable>
                                </View>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {catalog ? (
          <View style={styles.dataCard}>
            <Text style={styles.dataValue}>{catalog.metadata.routedPlaceCount}</Text>
            <View style={styles.dataCopy}>
              <Text style={styles.dataTitle}>permission-mapped campus nodes</Text>
              <Text style={styles.dataText}>
                Verified {catalog.metadata.lastVerified}. Routes use the official campus-map places
                and S&amp;T degree catalog.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071A15' },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: BottomTabInset + 36 },
  eyebrow: { color: '#7EE2AE', fontSize: 12, fontWeight: '800', letterSpacing: 2.2 },
  title: { color: '#F5F3EB', fontSize: 38, lineHeight: 44, fontWeight: '800', marginTop: 9 },
  subtitle: { color: '#9BAAA3', fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 620 },
  loader: { marginTop: 42 },
  routeLoader: { marginVertical: 34 },
  error: { color: '#FF9E88', marginTop: 24, lineHeight: 20 },
  tourNotice: {
    color: '#071A15',
    backgroundColor: '#7EE2AE',
    borderRadius: 14,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 12,
    fontWeight: '800',
  },
  tourWindow: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#285343',
    backgroundColor: '#0A211A',
    padding: 12,
  },
  tourWindowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 12,
  },
  tourWindowHeaderCopy: { flex: 1 },
  tourWindowEyebrow: { color: '#7EE2AE', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  tourWindowTitle: { color: '#F5F3EB', fontSize: 17, lineHeight: 22, fontWeight: '800', marginTop: 4 },
  tourCountPill: {
    borderRadius: 999,
    backgroundColor: '#17372D',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  tourCountText: { color: '#9FDDBE', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  tourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tourCard: {
    minHeight: 92,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#285343',
    backgroundColor: '#102A22',
    overflow: 'hidden',
  },
  tourCardExpanded: { borderColor: '#7EE2AE', backgroundColor: '#0D2A21' },
  tourCardButton: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  tourCardCopy: { flex: 1 },
  tourCardMeta: { color: '#74A28F', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  tourCardName: { color: '#F5F3EB', fontSize: 16, lineHeight: 20, fontWeight: '800', marginTop: 7 },
  expandButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#3A6857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonActive: { backgroundColor: '#7EE2AE', borderColor: '#7EE2AE' },
  expandButtonText: { color: '#9FDDBE', fontSize: 23, lineHeight: 25, fontWeight: '400' },
  expandButtonTextActive: { color: '#071A15' },
  expandedTour: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#376253',
    padding: 12,
  },
  programSummary: {
    backgroundColor: '#F3F0E6',
    borderRadius: 16,
    padding: 16,
    gap: 11,
  },
  programDescription: { color: '#4F6058', fontSize: 13, lineHeight: 19 },
  emphasisText: { color: '#66756E', fontSize: 11, lineHeight: 17 },
  routeRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C5CEC8',
    paddingTop: 11,
    gap: 3,
  },
  routeRuleLabel: { color: '#718078', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  routeRuleText: { color: '#304A3E', fontSize: 11, textTransform: 'capitalize' },
  catalogButton: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#102A22',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  catalogButtonText: { color: '#7EE2AE', fontSize: 11, fontWeight: '800' },
  startTourButton: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#7EE2AE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  startTourButtonText: { color: '#071A15', fontSize: 15, fontWeight: '900' },
  startTourButtonMeta: { color: '#2E5C4B', fontSize: 9, fontWeight: '800', marginTop: 3 },
  activeGuide: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#7EE2AE',
    backgroundColor: '#071A15',
    padding: 16,
  },
  activeGuideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeGuideHeaderCopy: { flex: 1 },
  liveLabel: { color: '#7EE2AE', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  activeGuideTitle: {
    color: '#F5F3EB',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 4,
  },
  progressLabel: {
    minWidth: 42,
    color: '#071A15',
    backgroundColor: '#7EE2AE',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    flexShrink: 0,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#17372D',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#7EE2AE' },
  currentStopEyebrow: {
    color: '#74A28F',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 18,
  },
  currentStopName: {
    color: '#F5F3EB',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    marginTop: 5,
  },
  currentStopDescription: { color: '#AFC0B7', fontSize: 13, lineHeight: 19, marginTop: 7 },
  gpsCard: {
    borderRadius: 12,
    backgroundColor: '#102A22',
    borderWidth: 1,
    borderColor: '#285343',
    padding: 12,
    marginTop: 14,
  },
  gpsHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D9B56D' },
  gpsDotActive: { backgroundColor: '#7EE2AE' },
  gpsDotError: { backgroundColor: '#FF9E88' },
  gpsTitle: { color: '#E4ECE8', fontSize: 11, fontWeight: '900', flex: 1 },
  gpsRadius: {
    color: '#82A695',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  gpsStatusText: { color: '#8FA99D', fontSize: 10, lineHeight: 15, marginTop: 7 },
  locationSettingsButton: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A6857',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    paddingHorizontal: 10,
  },
  locationSettingsButtonText: { color: '#9FDDBE', fontSize: 10, fontWeight: '800' },
  directionsButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A6857',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingHorizontal: 12,
  },
  directionsButtonText: { color: '#9FDDBE', fontSize: 11, fontWeight: '800' },
  tourControls: { flexDirection: 'row', gap: 9, marginTop: 9 },
  secondaryControl: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A6857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryControlText: { color: '#CAD5D0', fontSize: 12, fontWeight: '800' },
  nextControl: {
    flex: 2,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#7EE2AE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextControlText: { color: '#071A15', fontSize: 12, fontWeight: '900' },
  endTourButton: { alignItems: 'center', justifyContent: 'center', minHeight: 36, marginTop: 7 },
  endTourButtonText: { color: '#FFAA96', fontSize: 11, fontWeight: '800' },
  timeline: { marginTop: 18 },
  stopRow: { flexDirection: 'row', alignItems: 'stretch' },
  markerColumn: { width: 42, alignItems: 'center' },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#17372D',
    borderWidth: 1,
    borderColor: '#32634F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerActive: { backgroundColor: '#7EE2AE', borderColor: '#7EE2AE' },
  markerText: { color: '#BFD0C8', fontSize: 11, fontWeight: '900' },
  markerTextActive: { color: '#071A15' },
  line: { width: 1, flex: 1, minHeight: 30, backgroundColor: '#245142' },
  stopCard: {
    flex: 1,
    backgroundColor: '#102A22',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1D4437',
  },
  currentStopCard: { borderColor: '#7EE2AE', backgroundColor: '#15382C' },
  completedStopCard: { opacity: 0.7 },
  stopHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stopName: { color: '#F5F3EB', fontSize: 17, lineHeight: 22, fontWeight: '800', flex: 1 },
  rootLabel: {
    color: '#071A15',
    backgroundColor: '#7EE2AE',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '900',
  },
  currentLabel: {
    color: '#071A15',
    backgroundColor: '#7EE2AE',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '900',
  },
  completedLabel: {
    color: '#9FDDBE',
    backgroundColor: '#21483A',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '900',
  },
  stopDescription: { color: '#AFC0B7', fontSize: 13, lineHeight: 19, marginTop: 7 },
  distance: {
    color: '#6F9182',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  detail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#315247',
    marginTop: 14,
    paddingTop: 12,
    gap: 5,
  },
  detailLabel: {
    color: '#6F8C7F',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 3,
  },
  detailText: { color: '#CAD5D0', fontSize: 12, lineHeight: 18, marginBottom: 5 },
  question: { color: '#AFC4BA', fontSize: 12, lineHeight: 18 },
  dataCard: {
    marginTop: 14,
    backgroundColor: '#7EE2AE',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dataValue: { color: '#071A15', fontSize: 46, fontWeight: '900' },
  dataCopy: { flex: 1 },
  dataTitle: { color: '#071A15', fontSize: 15, fontWeight: '800' },
  dataText: { color: '#254B3E', fontSize: 11, lineHeight: 16, marginTop: 3 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
