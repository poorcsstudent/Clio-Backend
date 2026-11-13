import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const TASK = 'clio-active-tour-location-v1';
type Consumer = { location: (fix: Location.LocationObject) => void; error: () => void };
let consumer: Consumer | null = null;
let operations: Promise<void> = Promise.resolve();
// Defined at module scope so iOS can resolve the task. A cold-started process
// deliberately stops: restored tours require the user to resume, never auto-track.
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    const current = consumer;
    if (!current) {
      if (await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
      return;
    }
    if (error) { current.error(); return; }
    const latest = data?.locations?.slice().sort((a, b) => b.timestamp - a.timestamp)[0];
    if (latest) current.location(latest);
  });
}
function reconcile() {
  operations = operations.catch(() => undefined).then(async () => {
    const wanted = consumer;
    if (Platform.OS === 'web') return;
    const started = await Location.hasStartedLocationUpdatesAsync(TASK);
    if (!wanted) { if (started) await Location.stopLocationUpdatesAsync(TASK); return; }
    if (!started) await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 0, timeInterval: 2000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.Fitness,
      foregroundService: { notificationTitle: 'Clio walking tour', notificationBody: 'Location is active for your tour. Pause or end the tour to stop.', killServiceOnDestroy: true },
    });
  }).catch(() => consumer?.error());
}
export function attachBackgroundTour(location: Consumer['location'], error: Consumer['error']) {
  const next = { location, error }; consumer = next; reconcile();
  return () => { if (consumer === next) { consumer = null; reconcile(); } };
}
export async function requestTourBackgroundPermission() {
  if (Platform.OS === 'web') return false;
  if (!(await Location.requestForegroundPermissionsAsync()).granted) return false;
  return (await Location.requestBackgroundPermissionsAsync()).granted;
}
