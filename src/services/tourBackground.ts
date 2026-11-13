import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { createOwnedResource } from './ownedResource';

const TASK = 'clio-active-tour-location-v1';
type Consumer = { location: (fix: Location.LocationObject) => void; error: () => void };
const resource = createOwnedResource<Consumer>({
  isStarted: () => Platform.OS === 'web' ? Promise.resolve(false) : Location.hasStartedLocationUpdatesAsync(TASK),
  stop: () => Location.stopLocationUpdatesAsync(TASK),
  start: () => Location.startLocationUpdatesAsync(TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 0, timeInterval: 2000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.Fitness,
    foregroundService: { notificationTitle: 'Clio walking tour', notificationBody: 'Location is active for your tour. Pause or end the tour to stop.', killServiceOnDestroy: true },
  }),
});
// Defined at module scope so iOS can resolve the task. A cold-started process
// deliberately stops: restored tours require the user to resume, never auto-track.
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    const current = resource.current();
    if (!current) {
      await resource.reconcile();
      return;
    }
    if (error) { current.error(); return; }
    const latest = data?.locations?.slice().sort((a, b) => b.timestamp - a.timestamp)[0];
    if (latest) current.location(latest);
  });
}
export function attachBackgroundTour(location: Consumer['location'], error: Consumer['error']) {
  if (Platform.OS === 'web') return () => {};
  return resource.attach({ location, error }, error);
}
export async function requestTourBackgroundPermission() {
  if (Platform.OS === 'web') return false;
  if (!(await Location.requestForegroundPermissionsAsync()).granted) return false;
  return (await Location.requestBackgroundPermissionsAsync()).granted;
}
