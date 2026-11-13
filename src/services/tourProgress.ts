import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { CampusWalkingRoute, TourSession } from './api';
import { validTourProgress, validSavedRoute } from './tourProgressValidation';

const KEY = 'clio.tour-progress.v1';
let writes: Promise<void> = Promise.resolve();
export interface TourProgress {
  origin: string;
  savedAt: number;
  session: TourSession;
  stopIndex: number;
  route: CampusWalkingRoute | null;
}
export async function loadTourProgress(origin: string): Promise<TourProgress | null> {
  try {
    const raw = Platform.OS === 'web'
      ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY))
      : FileSystem.documentDirectory ? await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}${KEY}.json`) : null;
    const value = raw ? JSON.parse(raw) : null;
    if (!validTourProgress(value, origin)) return null;
    // Route geometry is optional; don't trust a malformed snapshot for navigation.
    if (!validSavedRoute(value.route, value.session.tour.id)) value.route = null;
    return value;
  } catch { return null; }
}
export function saveTourProgress(progress: TourProgress | null) {
  // Serialize writes so a slow old snapshot cannot overwrite a later stop or deletion.
  writes = writes.catch(() => {}).then(async () => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      if (progress) localStorage.setItem(KEY, JSON.stringify(progress));
      else localStorage.removeItem(KEY);
    } else if (FileSystem.documentDirectory) {
      const uri = `${FileSystem.documentDirectory}${KEY}.json`;
      if (progress) await FileSystem.writeAsStringAsync(uri, JSON.stringify(progress));
      else await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  });
  return writes;
}
