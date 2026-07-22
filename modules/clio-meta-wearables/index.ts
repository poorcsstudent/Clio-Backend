import { requireOptionalNativeModule } from 'expo';
import type { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';

export type MetaRegistrationState =
  | 'unavailable'
  | 'available'
  | 'registering'
  | 'registered';

export type MetaLinkState = 'disconnected' | 'connecting' | 'connected';

export type MetaWearablesDevice = {
  id: string;
  name: string;
  linkState: MetaLinkState;
  deviceType: string;
  compatibility: string;
};

export type MetaWearablesState = {
  platformSupported: boolean;
  sdkLoaded: boolean;
  sdkVersion: string;
  registrationState: MetaRegistrationState;
  devices: MetaWearablesDevice[];
};

type NativeMetaWearablesModule = {
  configure(): Promise<MetaWearablesState>;
  getState(): Promise<MetaWearablesState>;
  startRegistration(): Promise<MetaWearablesState>;
  handleUrl(url: string): Promise<MetaWearablesState & { handled: boolean }>;
  unregister(): Promise<MetaWearablesState>;
};

const nativeModule =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<NativeMetaWearablesModule>('ClioMetaWearables')
    : null;

export const initialMetaWearablesState: MetaWearablesState = {
  platformSupported: Platform.OS === 'ios',
  sdkLoaded: nativeModule !== null,
  sdkVersion: nativeModule ? '0.7.0' : '',
  registrationState: 'unavailable',
  devices: [],
};

export async function configureMetaWearables(): Promise<MetaWearablesState> {
  return nativeModule?.configure() ?? initialMetaWearablesState;
}

export async function getMetaWearablesState(): Promise<MetaWearablesState> {
  return nativeModule?.getState() ?? initialMetaWearablesState;
}

export async function startMetaRegistration(): Promise<MetaWearablesState> {
  if (!nativeModule) throw new Error('Install the Meta-enabled iOS build first.');
  return nativeModule.startRegistration();
}

export async function handleMetaCallback(
  url: string,
): Promise<MetaWearablesState & { handled: boolean }> {
  if (!nativeModule) return { ...initialMetaWearablesState, handled: false };
  return nativeModule.handleUrl(url);
}

export async function unregisterMetaWearables(): Promise<MetaWearablesState> {
  if (!nativeModule) throw new Error('Install the Meta-enabled iOS build first.');
  return nativeModule.unregister();
}

export type WakePhraseMode = 'idle' | 'listening' | 'awaitingCommand' | 'processing' | 'error';

export type WakePhraseState = {
  platformSupported: boolean;
  moduleLoaded: boolean;
  onDeviceSupported: boolean;
  speechAuthorized: boolean;
  microphoneAuthorized: boolean;
  listening: boolean;
  mode: WakePhraseMode;
  phrase: string;
  error?: string;
};

export type WakePhrasePlaybackRoute = {
  bluetoothAvailable: boolean;
  bluetoothSelected: boolean;
  input: string;
  outputs: string[];
};

type WakePhraseDetectedEvent = { phrase: string };
type WakePhraseCommandEvent = { command: string };

type NativeWakePhraseModule = {
  getState(): Promise<WakePhraseState>;
  requestPermissions(): Promise<WakePhraseState>;
  start(phrase: string): Promise<WakePhraseState>;
  stop(): Promise<WakePhraseState>;
  preparePlaybackRoute(): Promise<WakePhrasePlaybackRoute>;
  addListener(
    eventName: 'onWakePhraseState',
    listener: (event: WakePhraseState) => void,
  ): EventSubscription;
  addListener(
    eventName: 'onWakePhraseDetected',
    listener: (event: WakePhraseDetectedEvent) => void,
  ): EventSubscription;
  addListener(
    eventName: 'onWakePhraseCommand',
    listener: (event: WakePhraseCommandEvent) => void,
  ): EventSubscription;
};

const nativeWakePhraseModule =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<NativeWakePhraseModule>('ClioWakePhrase')
    : null;

export const initialWakePhraseState: WakePhraseState = {
  platformSupported: Platform.OS === 'ios',
  moduleLoaded: nativeWakePhraseModule !== null,
  onDeviceSupported: false,
  speechAuthorized: false,
  microphoneAuthorized: false,
  listening: false,
  mode: 'idle',
  phrase: 'hey clio',
};

export async function getWakePhraseState() {
  return nativeWakePhraseModule?.getState() ?? initialWakePhraseState;
}

export async function requestWakePhrasePermissions() {
  if (!nativeWakePhraseModule) {
    throw new Error('Install the Hey Clio-enabled iOS build first.');
  }
  return nativeWakePhraseModule.requestPermissions();
}

export async function startWakePhraseListening(phrase = 'hey clio') {
  if (!nativeWakePhraseModule) {
    throw new Error('Install the Hey Clio-enabled iOS build first.');
  }
  return nativeWakePhraseModule.start(phrase);
}

export async function stopWakePhraseListening() {
  return nativeWakePhraseModule?.stop() ?? initialWakePhraseState;
}

export async function prepareWakePhrasePlaybackRoute(): Promise<WakePhrasePlaybackRoute> {
  if (!nativeWakePhraseModule) {
    return {
      bluetoothAvailable: false,
      bluetoothSelected: false,
      input: '',
      outputs: [],
    };
  }
  return nativeWakePhraseModule.preparePlaybackRoute();
}

export function addWakePhraseStateListener(listener: (event: WakePhraseState) => void) {
  return nativeWakePhraseModule?.addListener('onWakePhraseState', listener) ?? { remove() {} };
}

export function addWakePhraseDetectedListener(
  listener: (event: WakePhraseDetectedEvent) => void,
) {
  return nativeWakePhraseModule?.addListener('onWakePhraseDetected', listener) ?? { remove() {} };
}

export function addWakePhraseCommandListener(listener: (event: WakePhraseCommandEvent) => void) {
  return nativeWakePhraseModule?.addListener('onWakePhraseCommand', listener) ?? { remove() {} };
}
