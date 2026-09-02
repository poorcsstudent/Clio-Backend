import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const apiBaseUrl = (process.env.EXPO_PUBLIC_CLIO_API_URL ?? 'http://localhost:3000')
  .replace(/\/$/, '');

const DEVICE_ID_KEY = 'clio.device-id';
const REFRESH_TOKEN_KEY = 'clio.refresh-token';

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let webRefreshToken: string | null = null;

interface DeviceSession {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  campusId: string;
  content: string;
  score: number;
}

export interface CampusAnswer {
  answer: string;
  provider: 'groq' | 'openai' | 'retrieval-only';
  sources: KnowledgeSource[];
}

export interface TourStop {
  id: string;
  campusId: string;
  name: string;
  tourTags: string[];
  order: number;
  description: string;
  latitude: number;
  longitude: number;
  relevance?: string;
  audioScript?: string;
  distanceFromPreviousMeters?: number;
  programCatalogUrl?: string;
  suggestedQuestions?: string[];
}

export interface CampusTour {
  id: string;
  name: string;
  description: string;
  audience: 'all-visitors' | 'undergraduate-degree';
  degreeTypes?: string[];
  emphasisAreas?: string[];
  catalogUrl?: string;
  rootStopId: string;
  routeStrategy: 'curated' | 'best-first-proximity';
  stopCount: number;
}

export interface CampusTourCatalog {
  metadata: {
    lastVerified: string;
    degreeProgramCount: number;
    totalTourCount: number;
    routedPlaceCount: number;
  };
  tours: CampusTour[];
}

export interface TourSession {
  sessionId: string;
  campusId: string;
  tour: CampusTour;
  stopCount: number;
  stops: TourStop[];
}

export interface WalkingCoordinate {
  latitude: number;
  longitude: number;
}

export interface WalkingRouteStep {
  instruction: string;
  maneuver?: string;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
}

export interface WalkingRouteLeg {
  fromStopId: string;
  toStopId: string;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
  steps: WalkingRouteStep[];
}

export interface CampusWalkingRoute {
  campusId: string;
  tourId: string;
  travelMode: 'WALK';
  provider: 'clio-campus-pilot' | 'clio-coordinate-fallback';
  providerConfigured: boolean;
  fieldVerified: boolean;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
  legs: WalkingRouteLeg[];
  generatedAt: string;
  warning?: string;
  attribution?: string;
  lastReviewed?: string;
  sourceUrls?: string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function readStoredValue(key: string) {
  if (Platform.OS === 'web') {
    if (key === REFRESH_TOKEN_KEY) return webRefreshToken;
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function writeStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (key === REFRESH_TOKEN_KEY) {
      webRefreshToken = value;
      return;
    }
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function deleteStoredValue(key: string) {
  if (Platform.OS === 'web') {
    if (key === REFRESH_TOKEN_KEY) webRefreshToken = null;
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

async function getDeviceId() {
  const saved = await readStoredValue(DEVICE_ID_KEY);
  if (saved) return saved;
  const created = `mobile-${Crypto.randomUUID()}`;
  await writeStoredValue(DEVICE_ID_KEY, created);
  return created;
}

async function saveSession(session: DeviceSession) {
  accessToken = session.accessToken;
  accessTokenExpiresAt = Date.now() + (session.accessTokenExpiresInSeconds - 30) * 1000;
  await writeStoredValue(REFRESH_TOKEN_KEY, session.refreshToken);
}

async function refreshSession() {
  const refreshToken = await readStoredValue(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new ApiError('This device is not paired', 401);

  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  const session = await parseResponse<DeviceSession>(response);
  await saveSession(session);
  return session.accessToken;
}

async function getAccessToken() {
  if (accessToken && Date.now() < accessTokenExpiresAt) return accessToken;
  return refreshSession();
}

async function authorizedFetch(path: string, init: RequestInit = {}, retry = true) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    accessToken = null;
    accessTokenExpiresAt = 0;
    await refreshSession();
    return authorizedFetch(path, init, false);
  }
  return response;
}

export async function restoreDeviceSession() {
  try {
    await refreshSession();
    return true;
  } catch {
    await disconnectDevice();
    return false;
  }
}

export async function pairDevice(enrollmentCode: string) {
  const response = await fetch(`${apiBaseUrl}/auth/device-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: await getDeviceId(), enrollmentCode }),
  });
  await saveSession(await parseResponse<DeviceSession>(response));
}

export async function disconnectDevice() {
  accessToken = null;
  accessTokenExpiresAt = 0;
  await deleteStoredValue(REFRESH_TOKEN_KEY);
}

export async function askCampusQuestion(question: string, currentStopId?: string) {
  const response = await authorizedFetch('/ai-guide/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      campusId: 'missouri-s-and-t',
      currentStopId,
    }),
  });
  return parseResponse<CampusAnswer>(response);
}

export async function transcribeQuestion(uri: string) {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then(response => response.blob());
    form.append('audio', blob, 'question.webm');
  } else {
    form.append('audio', {
      uri,
      name: 'question.m4a',
      type: 'audio/mp4',
    } as unknown as Blob);
  }

  const response = await authorizedFetch('/voice/transcribe', {
    method: 'POST',
    body: form,
  });
  return parseResponse<{ text: string }>(response);
}

export async function createSpeechSource(text: string) {
  const response = await authorizedFetch('/voice/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const result = await parseResponse<{ audioPath: string }>(response);
  return {
    uri: `${apiBaseUrl}${result.audioPath}`,
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
    name: 'Clio campus guide',
  };
}

export async function getCampusTours() {
  const response = await fetch(`${apiBaseUrl}/campuses/missouri-s-and-t/tours`);
  return parseResponse<CampusTourCatalog>(response);
}

export async function getTourStops(tourId: string) {
  const response = await fetch(
    `${apiBaseUrl}/campuses/missouri-s-and-t/stops?tourId=${encodeURIComponent(tourId)}`,
  );
  return parseResponse<TourStop[]>(response);
}

export async function getWalkingRoute(tourId: string) {
  const response = await fetch(
    `${apiBaseUrl}/navigation/walking-route/${encodeURIComponent(tourId)}?campusId=missouri-s-and-t`,
  );
  return parseResponse<CampusWalkingRoute>(response);
}

export async function startTour(tourId: string) {
  const response = await fetch(`${apiBaseUrl}/tour/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campusId: 'missouri-s-and-t', tourId }),
  });
  return parseResponse<TourSession>(response);
}

export async function endTour(sessionId: string) {
  const response = await fetch(`${apiBaseUrl}/tour/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  return parseResponse<{ sessionId: string; status: 'ended' }>(response);
}
