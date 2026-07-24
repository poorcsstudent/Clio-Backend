import { useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type {
  CampusWalkingRoute,
  TourStop,
  WalkingCoordinate,
} from '@/services/api';

export type MapCoordinate = WalkingCoordinate;

interface CampusRouteMapProps {
  stops: TourStop[];
  walkingRoute?: CampusWalkingRoute | null;
  activeStopIndex?: number;
  isActive?: boolean;
  userCoordinate?: MapCoordinate | null;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
}

interface MapBounds {
  minimumLatitude: number;
  maximumLatitude: number;
  minimumLongitude: number;
  maximumLongitude: number;
}

interface MapPoint {
  x: number;
  y: number;
}

type FocusMode = 'route' | 'next';

const MAP_PADDING = 36;
const MIN_ROUTE_SPAN = 0.001;
const MIN_FOCUS_SPAN = 0.00055;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function buildBounds(coordinates: MapCoordinate[], minimumSpan: number): MapBounds {
  const latitudes = coordinates.map(coordinate => coordinate.latitude);
  const longitudes = coordinates.map(coordinate => coordinate.longitude);
  const minimumLatitude = Math.min(...latitudes);
  const maximumLatitude = Math.max(...latitudes);
  const minimumLongitude = Math.min(...longitudes);
  const maximumLongitude = Math.max(...longitudes);
  const latitudeSpan = Math.max(maximumLatitude - minimumLatitude, minimumSpan);
  const longitudeSpan = Math.max(maximumLongitude - minimumLongitude, minimumSpan);
  const latitudeCenter = (minimumLatitude + maximumLatitude) / 2;
  const longitudeCenter = (minimumLongitude + maximumLongitude) / 2;
  const latitudePadding = latitudeSpan * 0.18;
  const longitudePadding = longitudeSpan * 0.18;

  return {
    minimumLatitude: latitudeCenter - latitudeSpan / 2 - latitudePadding,
    maximumLatitude: latitudeCenter + latitudeSpan / 2 + latitudePadding,
    minimumLongitude: longitudeCenter - longitudeSpan / 2 - longitudePadding,
    maximumLongitude: longitudeCenter + longitudeSpan / 2 + longitudePadding,
  };
}

function projectCoordinate(
  coordinate: MapCoordinate,
  bounds: MapBounds,
  width: number,
  height: number,
): MapPoint {
  const usableWidth = Math.max(1, width - MAP_PADDING * 2);
  const usableHeight = Math.max(1, height - MAP_PADDING * 2);
  const longitudeSpan = bounds.maximumLongitude - bounds.minimumLongitude;
  const latitudeSpan = bounds.maximumLatitude - bounds.minimumLatitude;

  return {
    x:
      MAP_PADDING +
      ((coordinate.longitude - bounds.minimumLongitude) / longitudeSpan) * usableWidth,
    y:
      MAP_PADDING +
      ((bounds.maximumLatitude - coordinate.latitude) / latitudeSpan) * usableHeight,
  };
}

function MapLine({
  from,
  to,
  color,
  thickness,
  opacity = 1,
}: {
  from: MapPoint;
  to: MapPoint;
  color: string;
  thickness: number;
  opacity?: number;
}) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (from.x + to.x) / 2 - length / 2,
        top: (from.y + to.y) / 2 - thickness / 2,
        width: length,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: color,
        opacity,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

export function CampusRouteMap({
  stops,
  walkingRoute = null,
  activeStopIndex = 0,
  isActive = false,
  userCoordinate = null,
  selectedStopId = null,
  onSelectStop,
}: CampusRouteMapProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [mapWidth, setMapWidth] = useState(0);
  const [focusMode, setFocusMode] = useState<FocusMode>('route');
  const mapHeight = windowWidth >= 760 ? 390 : 320;
  const safeActiveIndex = clamp(activeStopIndex, 0, Math.max(0, stops.length - 1));

  useEffect(() => {
    if (!isActive) setFocusMode('route');
  }, [isActive, stops]);

  const visibleCoordinates = useMemo(() => {
    if (!stops.length) return [];
    if (focusMode === 'route' || !isActive) {
      const routeCoordinates = walkingRoute?.path.length ? walkingRoute.path : stops;
      return userCoordinate ? [...routeCoordinates, userCoordinate] : routeCoordinates;
    }

    const previousStop = stops[Math.max(0, safeActiveIndex - 1)];
    const currentStop = stops[safeActiveIndex];
    const nextStop = stops[Math.min(stops.length - 1, safeActiveIndex + 1)];
    const coordinates: MapCoordinate[] = [previousStop, currentStop, nextStop];
    if (userCoordinate) coordinates.push(userCoordinate);
    return coordinates;
  }, [focusMode, isActive, safeActiveIndex, stops, userCoordinate, walkingRoute]);

  const bounds = useMemo(
    () =>
      buildBounds(
        visibleCoordinates,
        focusMode === 'next' && isActive ? MIN_FOCUS_SPAN : MIN_ROUTE_SPAN,
      ),
    [focusMode, isActive, visibleCoordinates],
  );

  const stopPoints = useMemo(
    () =>
      stops.map(stop => ({
        stop,
        point: projectCoordinate(stop, bounds, mapWidth, mapHeight),
      })),
    [bounds, mapHeight, mapWidth, stops],
  );

  const selectedStop =
    stops.find(stop => stop.id === selectedStopId) ?? stops[safeActiveIndex] ?? stops[0];
  const totalDistanceMeters = Math.round(
    walkingRoute?.distanceMeters ??
      stops.reduce((total, stop) => total + (stop.distanceFromPreviousMeters ?? 0), 0),
  );
  const activeWalkingLeg =
    walkingRoute?.legs[
      safeActiveIndex === 0 ? 0 : Math.min(safeActiveIndex - 1, walkingRoute.legs.length - 1)
    ];
  const activeWalkingStep = activeWalkingLeg?.steps[0];
  const routeLegs =
    walkingRoute?.legs.length
      ? walkingRoute.legs
      : stops.slice(1).map((destination, destinationIndex) => ({
          fromStopId: stops[destinationIndex].id,
          toStopId: destination.id,
          path: [stops[destinationIndex], destination],
        }));

  const userPoint =
    userCoordinate && mapWidth > 0
      ? projectCoordinate(userCoordinate, bounds, mapWidth, mapHeight)
      : null;

  const currentStopPoint = stopPoints[safeActiveIndex]?.point;
  const latitudeSpanMeters =
    (bounds.maximumLatitude - bounds.minimumLatitude) * 111_320;
  const arrivalRadiusPixels = clamp(
    (35 / Math.max(1, latitudeSpanMeters)) * (mapHeight - MAP_PADDING * 2),
    11,
    52,
  );

  function measureMap(event: LayoutChangeEvent) {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth !== mapWidth) setMapWidth(nextWidth);
  }

  function isVisiblePoint(point: MapPoint) {
    const tolerance = 24;
    return (
      point.x >= -tolerance &&
      point.x <= mapWidth + tolerance &&
      point.y >= -tolerance &&
      point.y <= mapHeight + tolerance
    );
  }

  if (!stops.length) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>INTERACTIVE CAMPUS MAP</Text>
          <Text style={styles.title}>
            {isActive ? `Walking to ${stops[safeActiveIndex]?.name}` : 'Tour route overview'}
          </Text>
          <Text style={styles.subtitle}>
            {stops.length} stops
            {totalDistanceMeters > 0 ? `  /  about ${totalDistanceMeters.toLocaleString()} m` : ''}
          </Text>
          <Text style={styles.providerText}>CLIO CAMPUS ROUTE</Text>
        </View>
        <View style={styles.livePill}>
          <View style={[styles.liveDot, isActive && styles.liveDotActive]} />
          <Text style={styles.liveText}>{isActive ? 'LIVE' : 'PREVIEW'}</Text>
        </View>
      </View>

      <View style={[styles.map, { height: mapHeight }]} onLayout={measureMap}>
        <View pointerEvents="none" style={styles.mapGlow} />
        {[1, 2, 3, 4].map(index => (
          <View
            key={`horizontal-${index}`}
            pointerEvents="none"
            style={[styles.gridHorizontal, { top: `${index * 20}%` }]}
          />
        ))}
        {[1, 2, 3, 4].map(index => (
          <View
            key={`vertical-${index}`}
            pointerEvents="none"
            style={[styles.gridVertical, { left: `${index * 20}%` }]}
          />
        ))}

        <View pointerEvents="none" style={styles.compass}>
          <Text style={styles.compassNorth}>N</Text>
          <View style={styles.compassNeedle} />
        </View>

        {mapWidth > 0
          ? routeLegs.flatMap((leg, legIndex) =>
              leg.path.slice(0, -1).map((routeCoordinate, pointIndex) => {
                const point = projectCoordinate(
                  routeCoordinate,
                  bounds,
                  mapWidth,
                  mapHeight,
                );
                const nextPoint = projectCoordinate(
                  leg.path[pointIndex + 1],
                  bounds,
                  mapWidth,
                  mapHeight,
                );
                if (!isVisiblePoint(point) || !isVisiblePoint(nextPoint)) return null;
                const completed = isActive && legIndex < safeActiveIndex - 1;
                const current = isActive && legIndex === safeActiveIndex - 1;
                return (
                  <MapLine
                    key={`${leg.fromStopId}-${leg.toStopId}-${pointIndex}`}
                    from={point}
                    to={nextPoint}
                    color={completed ? '#7EE2AE' : current ? '#F4C96B' : '#527366'}
                    thickness={current ? 6 : 4}
                    opacity={completed || current ? 1 : 0.72}
                  />
                );
              }),
            )
          : null}

        {isActive && currentStopPoint ? (
          <View
            pointerEvents="none"
            style={[
              styles.arrivalRadius,
              {
                left: currentStopPoint.x - arrivalRadiusPixels,
                top: currentStopPoint.y - arrivalRadiusPixels,
                width: arrivalRadiusPixels * 2,
                height: arrivalRadiusPixels * 2,
                borderRadius: arrivalRadiusPixels,
              },
            ]}
          />
        ) : null}

        {mapWidth > 0
          ? stopPoints.map(({ stop, point }, index) => {
              if (!isVisiblePoint(point)) return null;
              const selected = stop.id === selectedStop?.id;
              const current = isActive && index === safeActiveIndex;
              const completed = isActive && index < safeActiveIndex;
              return (
                <Pressable
                  key={stop.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Stop ${index + 1}: ${stop.name}`}
                  onPress={() => onSelectStop?.(stop.id)}
                  style={({ pressed }) => [
                    styles.markerTouch,
                    { left: point.x - 22, top: point.y - 22 },
                    pressed && styles.markerPressed,
                  ]}>
                  <View
                    style={[
                      styles.marker,
                      completed && styles.markerCompleted,
                      current && styles.markerCurrent,
                      selected && styles.markerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.markerText,
                        (completed || current || selected) && styles.markerTextActive,
                      ]}>
                      {index + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          : null}

        {userPoint ? (
          <View
            pointerEvents="none"
            style={[styles.userLocationWrap, { left: userPoint.x - 17, top: userPoint.y - 17 }]}>
            <View style={styles.userLocationPulse} />
            <View style={styles.userLocationDot} />
            <Text style={styles.userLocationLabel}>YOU</Text>
          </View>
        ) : null}

        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendRoute]} />
            <Text style={styles.legendText}>Route</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendArrival]} />
            <Text style={styles.legendText}>Next arrival</Text>
          </View>
          {userPoint ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendUser]} />
              <Text style={styles.legendText}>You</Text>
            </View>
          ) : null}
        </View>
      </View>

      {activeWalkingLeg ? (
        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            <Text style={styles.instructionIconText}>W</Text>
          </View>
          <View style={styles.instructionCopy}>
            <Text style={styles.instructionLabel}>NEXT WALKING INSTRUCTION</Text>
            <Text style={styles.instructionText}>
              {activeWalkingStep?.instruction ??
                `Continue toward ${stops[safeActiveIndex]?.name}.`}
            </Text>
            <Text style={styles.instructionMeta}>
              {activeWalkingLeg.distanceMeters.toLocaleString()} m
              {activeWalkingLeg.durationSeconds
                ? `  /  about ${Math.max(1, Math.round(activeWalkingLeg.durationSeconds / 60))} min`
                : ''}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.mapControls}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.mapControl,
            focusMode === 'route' && styles.mapControlActive,
            pressed && styles.controlPressed,
          ]}
          onPress={() => setFocusMode('route')}>
          <Text
            style={[
              styles.mapControlText,
              focusMode === 'route' && styles.mapControlTextActive,
            ]}>
            Fit full route
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!isActive}
          style={({ pressed }) => [
            styles.mapControl,
            focusMode === 'next' && styles.mapControlActive,
            !isActive && styles.mapControlDisabled,
            pressed && styles.controlPressed,
          ]}
          onPress={() => setFocusMode('next')}>
          <Text
            style={[
              styles.mapControlText,
              focusMode === 'next' && styles.mapControlTextActive,
            ]}>
            Focus next stop
          </Text>
        </Pressable>
      </View>

      {selectedStop ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.selectedStop,
            pressed && styles.controlPressed,
          ]}
          onPress={() => onSelectStop?.(selectedStop.id)}>
          <View style={styles.selectedStopNumber}>
            <Text style={styles.selectedStopNumberText}>
              {stops.findIndex(stop => stop.id === selectedStop.id) + 1}
            </Text>
          </View>
          <View style={styles.selectedStopCopy}>
            <Text style={styles.selectedStopLabel}>
              {selectedStop.id === stops[safeActiveIndex]?.id && isActive
                ? 'CURRENT DESTINATION'
                : 'SELECTED STOP'}
            </Text>
            <Text style={styles.selectedStopName}>{selectedStop.name}</Text>
          </View>
          <Text style={styles.selectedStopAction}>View details</Text>
        </Pressable>
      ) : null}

      <Text style={styles.disclaimer}>
        {walkingRoute?.warning ??
          'Clio connects verified campus coordinates to preview the tour route. Follow posted pedestrian paths and accessibility guidance while walking.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#315D4D',
    backgroundColor: '#0A211A',
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#7EE2AE', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#F5F3EB', fontSize: 19, lineHeight: 24, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#779487', fontSize: 10, fontWeight: '700', marginTop: 4 },
  providerText: {
    color: '#C8A75F',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 5,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#17372D',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#71877D' },
  liveDotActive: { backgroundColor: '#7EE2AE' },
  liveText: { color: '#AED2C2', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  map: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#254C3F',
    backgroundColor: '#0D2921',
  },
  mapGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -70,
    bottom: -100,
    backgroundColor: 'rgba(126, 226, 174, 0.07)',
  },
  gridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(151, 190, 172, 0.08)',
  },
  gridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(151, 190, 172, 0.08)',
  },
  compass: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    alignItems: 'center',
  },
  compassNorth: { color: '#A9C5B8', fontSize: 9, fontWeight: '900' },
  compassNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#7EE2AE',
    marginTop: 2,
  },
  arrivalRadius: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#F4C96B',
    backgroundColor: 'rgba(244, 201, 107, 0.12)',
  },
  markerTouch: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  markerPressed: { opacity: 0.7, transform: [{ scale: 0.9 }] },
  marker: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#789387',
    backgroundColor: '#102A22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCompleted: { borderColor: '#7EE2AE', backgroundColor: '#285A46' },
  markerCurrent: {
    width: 33,
    height: 33,
    borderRadius: 17,
    borderColor: '#F4C96B',
    backgroundColor: '#A57A2D',
  },
  markerSelected: { borderColor: '#F5F3EB', backgroundColor: '#7EE2AE' },
  markerText: { color: '#BCD0C6', fontSize: 9, fontWeight: '900' },
  markerTextActive: { color: '#071A15' },
  userLocationWrap: {
    position: 'absolute',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(94, 191, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(94, 191, 255, 0.6)',
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#E8F7FF',
    backgroundColor: '#299DE7',
  },
  userLocationLabel: {
    position: 'absolute',
    top: 31,
    color: '#A9E2FF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  mapLegend: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(7, 26, 21, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 8, height: 8, borderRadius: 4 },
  legendRoute: { backgroundColor: '#7EE2AE' },
  legendArrival: { backgroundColor: '#F4C96B' },
  legendUser: { backgroundColor: '#299DE7' },
  legendText: { color: '#9BB2A8', fontSize: 7, fontWeight: '800' },
  mapControls: { flexDirection: 'row', gap: 8, marginTop: 9 },
  instructionCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#705D31',
    backgroundColor: '#2B281A',
    padding: 11,
    marginTop: 9,
  },
  instructionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4C96B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionIconText: { color: '#261E0B', fontSize: 14, fontWeight: '900' },
  instructionCopy: { flex: 1 },
  instructionLabel: { color: '#BCA45F', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  instructionText: { color: '#FFF4D4', fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 4 },
  instructionMeta: { color: '#A99B75', fontSize: 8, fontWeight: '800', marginTop: 4 },
  mapControl: {
    flex: 1,
    minHeight: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#315D4D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  mapControlActive: { backgroundColor: '#7EE2AE', borderColor: '#7EE2AE' },
  mapControlDisabled: { opacity: 0.35 },
  mapControlText: { color: '#B5CBC1', fontSize: 10, fontWeight: '800' },
  mapControlTextActive: { color: '#071A15' },
  controlPressed: { opacity: 0.72 },
  selectedStop: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 13,
    backgroundColor: '#102A22',
    borderWidth: 1,
    borderColor: '#264C3F',
    padding: 10,
    marginTop: 9,
  },
  selectedStopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7EE2AE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStopNumberText: { color: '#071A15', fontSize: 12, fontWeight: '900' },
  selectedStopCopy: { flex: 1 },
  selectedStopLabel: { color: '#729284', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  selectedStopName: { color: '#F5F3EB', fontSize: 13, fontWeight: '800', marginTop: 3 },
  selectedStopAction: { color: '#7EE2AE', fontSize: 8, fontWeight: '900' },
  disclaimer: { color: '#58776A', fontSize: 8, lineHeight: 12, marginTop: 8 },
});
