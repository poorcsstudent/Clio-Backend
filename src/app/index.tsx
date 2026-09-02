import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import {
  ApiError,
  apiBaseUrl,
  askCampusQuestion,
  disconnectDevice,
  identifyCampusView,
  pairDevice,
  restoreDeviceSession,
  transcribeQuestion,
  type CampusVisionResult,
  type KnowledgeSource,
} from '@/services/api';
import {
  captureMetaCameraPhoto,
  configureMetaWearables,
  getMetaWearablesState,
  handleMetaCallback,
  initialMetaWearablesState,
  requestMetaCameraPermission,
  startMetaRegistration,
  unregisterMetaWearables,
  type MetaWearablesState,
} from '@/services/meta-wearables';
import {
  addNativeSpeechStateListener,
  addWakePhraseCommandListener,
  addWakePhraseDetectedListener,
  addWakePhraseDiagnosticListener,
  addWakePhraseStateListener,
  getWakePhraseState,
  initialWakePhraseState,
  requestWakePhrasePermissions,
  startNativeAnswerSpeech,
  startWakePhraseListening,
  stopNativeSpeech,
  stopWakePhraseListening,
  type WakePhraseState,
} from '@/services/wake-phrase';

const suggestedQuestions = [
  'Clio, what am I looking at?',
  'What happens in the computer science building?',
  'Which stops are on the computer engineering tour?',
  'What is the Havener Center?',
];

type Phase =
  | 'checking'
  | 'ready'
  | 'recording'
  | 'pairing'
  | 'thinking'
  | 'speaking'
  | 'transcribing'
  | 'seeing';

function isVisualIdentificationCommand(value: string) {
  return /\bwhat\s+am\s+i\s+looking\s+at\b/i.test(value);
}

export default function HomeScreen() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [paired, setPaired] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [question, setQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [visionIdentification, setVisionIdentification] = useState<
    CampusVisionResult['identification'] | null
  >(null);
  const [status, setStatus] = useState('Checking the secure connection…');
  const [metaState, setMetaState] = useState<MetaWearablesState>(initialMetaWearablesState);
  const [metaBusy, setMetaBusy] = useState(false);
  const [metaError, setMetaError] = useState('');
  const [wakeState, setWakeState] = useState<WakePhraseState>(initialWakePhraseState);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [appIsActive, setAppIsActive] = useState(true);
  const [voiceDiagnostics, setVoiceDiagnostics] = useState<string[]>([]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  function addVoiceDiagnostic(message: string) {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setVoiceDiagnostics(current => [`${timestamp}  ${message}`, ...current].slice(0, 10));
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone access needed', 'Enable microphone access to ask Clio by voice.');
      }
      const restored = await restoreDeviceSession();
      if (!active) return;
      setPaired(restored);
      setPhase('ready');
      setStatus(restored ? 'Encrypted device session ready' : 'Enter the private pairing code');
    })().catch(error => {
      if (!active) return;
      setPhase('ready');
      setStatus(error instanceof Error ? error.message : 'Connection check failed');
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function updateMetaState() {
      try {
        const nextState = await getMetaWearablesState();
        if (active) {
          setMetaState(nextState);
          setMetaError('');
        }
      } catch (error) {
        if (active) {
          setMetaError(error instanceof Error ? error.message : 'Meta glasses status is unavailable');
        }
      }
    }

    async function processMetaUrl(url: string | null) {
      if (!url?.startsWith('cliovision://')) return;
      try {
        const nextState = await handleMetaCallback(url);
        if (active && nextState.handled) {
          setMetaState(nextState);
          setMetaError('');
        }
      } catch (error) {
        if (active) {
          setMetaError(error instanceof Error ? error.message : 'Meta registration callback failed');
        }
      }
    }

    configureMetaWearables()
      .then(nextState => {
        if (active) setMetaState(nextState);
      })
      .catch(error => {
        if (active) {
          setMetaError(error instanceof Error ? error.message : 'Meta Wearables SDK could not start');
        }
      });
    Linking.getInitialURL().then(processMetaUrl).catch(() => undefined);

    const urlSubscription = Linking.addEventListener('url', event => {
      void processMetaUrl(event.url);
    });
    const appStateSubscription = AppState.addEventListener('change', nextState => {
      setAppIsActive(nextState === 'active');
      if (nextState === 'active') void updateMetaState();
    });

    return () => {
      active = false;
      urlSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    getWakePhraseState()
      .then(nextState => {
        if (active) setWakeState(nextState);
      })
      .catch(() => undefined);

    const stateSubscription = addWakePhraseStateListener(nextState => {
      if (!active) return;
      setWakeState(nextState);
      if (nextState.error) {
        setStatus(nextState.error);
        addVoiceDiagnostic(`Wake listener error: ${nextState.error}`);
      }
    });
    const detectedSubscription = addWakePhraseDetectedListener(() => {
      if (!active || !paired) return;
      addVoiceDiagnostic('Wake phrase event reached React Native');
      setStatus('Hey Clio heard - local "Hey User" acknowledgement queued; ask your question');
    });
    const diagnosticSubscription = addWakePhraseDiagnosticListener(event => {
      if (!active) return;
      const outputs = event.outputs.filter(Boolean).join(', ') || 'no output route';
      addVoiceDiagnostic(
        `${event.message} Output: ${outputs}; Bluetooth: ${
          event.bluetoothSelected ? 'selected' : 'not selected'
        }`,
      );
      if (event.stage === 'commandListenerStarted') {
        setStatus('Listening for your question now…');
      } else if (event.stage === 'commandSpeechDetected') {
        setStatus('Question heard - waiting for you to finish…');
      } else if (event.stage === 'commandTimeout') {
        setStatus('No question was heard; say “Hey Clio” and try again');
      } else if (event.stage === 'commandCaptureError') {
        setStatus('Question capture stopped; say “Hey Clio” and try again');
      }
    });
    const speechSubscription = addNativeSpeechStateListener(event => {
      if (!active) return;
      const outputs = event.outputs.filter(Boolean).join(', ') || 'no output route';
      addVoiceDiagnostic(
        `${event.kind === 'answer' ? 'Answer' : 'Acknowledgement'} speech ${
          event.stage
        }. Output: ${outputs}; Bluetooth: ${
          event.bluetoothSelected ? 'selected' : 'not selected'
        }`,
      );

      if (event.kind === 'acknowledgement') {
        if (event.stage === 'finished') {
          setStatus('“Hey User” finished - listening for your question…');
        }
        return;
      }
      if (event.stage === 'queued') {
        setStatus('Answer text queued for native iOS speech');
      } else if (event.stage === 'started') {
        setStatus(
          event.bluetoothSelected
            ? `Speaking through ${outputs}`
            : event.bluetoothAvailable
              ? 'Speaking now; iOS did not select the glasses output route'
              : 'Speaking through the iPhone; connect the Meta glasses for in-ear audio',
        );
      } else if (event.stage === 'finished') {
        setPhase('ready');
        setStatus('Answer complete - Hey Clio is ready for another question');
      } else if (event.stage === 'cancelled') {
        setPhase('ready');
        setStatus('Native answer speech stopped; the text answer remains available');
      }
    });
    const commandSubscription = addWakePhraseCommandListener(event => {
      if (!active || !paired || !event.command.trim()) return;
      addVoiceDiagnostic(`Command captured: "${event.command}"`);
      setStatus(`Heard: “${event.command}”`);
      void submitQuestion(event.command);
    });

    return () => {
      active = false;
      stateSubscription.remove();
      detectedSubscription.remove();
      diagnosticSubscription.remove();
      speechSubscription.remove();
      commandSubscription.remove();
    };
  }, [paired]);

  useEffect(() => {
    let active = true;
    const shouldListen =
      wakeEnabled &&
      paired &&
      appIsActive &&
      phase === 'ready' &&
      !recorderState.isRecording;

    const syncWakeListener = async () => {
      try {
        if (!shouldListen && phase === 'speaking') return;
        const nextState = shouldListen
          ? await startWakePhraseListening('hey clio')
          : await stopWakePhraseListening();
        if (active) setWakeState(nextState);
      } catch (error) {
        if (!active) return;
        setWakeEnabled(false);
        setStatus(error instanceof Error ? error.message : 'Hey Clio listening is unavailable');
      }
    };

    void syncWakeListener();
    return () => {
      active = false;
    };
  }, [appIsActive, paired, phase, recorderState.isRecording, wakeEnabled]);

  useEffect(() => () => {
    void stopWakePhraseListening();
    void stopNativeSpeech();
  }, []);

  useEffect(() => {
    if (phase !== 'speaking') return;

    const timeoutMs = Math.max(45_000, Math.min(300_000, answer.length * 90 + 20_000));
    const speechTimeout = setTimeout(() => {
      addVoiceDiagnostic('Native answer speech watchdog expired');
      void stopNativeSpeech().finally(() => {
        setPhase('ready');
        setStatus('Native speech timed out; the text answer remains available');
      });
    }, timeoutMs);

    return () => clearTimeout(speechTimeout);
  }, [answer, phase]);

  useEffect(() => {
    const spokenText = answer.trim();
    if (phase !== 'speaking' || !spokenText) return;

    let active = true;
    const speakCommittedAnswer = async () => {
      try {
        addVoiceDiagnostic(
          `Reading the committed answer bubble through native iOS speech (${spokenText.length} characters)`,
        );
        const route = await startNativeAnswerSpeech(spokenText);
        if (!active) return;
        addVoiceDiagnostic(
          `Native answer speech queued. Output: ${
            route.outputs.filter(Boolean).join(', ') || 'no output route'
          }; Bluetooth: ${route.bluetoothSelected ? 'selected' : 'not selected'}`,
        );
      } catch (error) {
        if (!active) return;
        addVoiceDiagnostic(
          `Native answer speech failed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        setPhase('ready');
        setStatus(
          error instanceof Error
            ? `Answer ready; native speech unavailable: ${error.message}`
            : 'Answer ready; native speech unavailable',
        );
      }
    };

    void speakCommittedAnswer();
    return () => {
      active = false;
    };
  }, [answer, phase]);

  async function handlePair() {
    if (pairingCode.trim().length < 8) {
      setStatus('Pairing codes contain at least 8 characters');
      return;
    }
    setPhase('pairing');
    setStatus('Pairing this device…');
    try {
      await pairDevice(pairingCode.trim());
      setPairingCode('');
      setPaired(true);
      setStatus('Encrypted device session ready');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Pairing failed');
    } finally {
      setPhase('ready');
    }
  }

  async function submitQuestion(value = question) {
    const cleaned = value.trim();
    if (!cleaned || !paired) return;
    if (isVisualIdentificationCommand(cleaned)) {
      await submitVisualQuestion(cleaned);
      return;
    }

    await stopWakePhraseListening().catch(() => undefined);
    addVoiceDiagnostic(`Sending question to Clio: "${cleaned}"`);
    setPhase('thinking');
    setQuestion(cleaned);
    setTranscript(cleaned);
    setVisionIdentification(null);
    setStatus('Searching verified campus knowledge…');
    let answered = false;
    try {
      const result = await askCampusQuestion(cleaned);
      addVoiceDiagnostic('Text answer received from the backend');
      setAnswer(result.answer);
      setSources(result.sources);
      setQuestion('');
      setStatus('Answer shown below; preparing the glasses audio route…');
      setPhase('speaking');
      answered = true;
    } catch (error) {
      addVoiceDiagnostic(
        `Question pipeline failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (error instanceof ApiError && error.status === 401) setPaired(false);
      setStatus(error instanceof Error ? error.message : 'Clio could not answer');
    } finally {
      if (!answered) setPhase('ready');
    }
  }

  async function submitVisualQuestion(value: string) {
    const cleaned = value.trim();
    if (!paired || !cleaned) return;

    await stopWakePhraseListening().catch(() => undefined);
    await stopNativeSpeech().catch(() => false);
    setPhase('seeing');
    setQuestion(cleaned);
    setTranscript(cleaned);
    setAnswer('');
    setSources([]);
    setVisionIdentification(null);
    setStatus('Preparing the glasses camera…');
    addVoiceDiagnostic('Visual command detected; stopping the microphone route before camera capture');

    let photoUri = '';
    let answered = false;
    try {
      if (!metaState.devices.some(device => device.linkState === 'connected')) {
        throw new Error('Connect the Meta glasses before asking what you are looking at.');
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      // Give iOS time to release the Bluetooth HFP microphone route. The Meta
      // camera transport can otherwise stall while the glasses mic is active.
      await new Promise(resolve => setTimeout(resolve, 400));
      const permission = await requestMetaCameraPermission();
      if (permission !== 'granted') {
        throw new Error('Approve Clio camera access in Meta AI, then try again.');
      }

      setStatus('Capturing one first-person photo…');
      addVoiceDiagnostic('Meta camera permission granted; starting a temporary camera stream');
      const photo = await captureMetaCameraPhoto();
      addVoiceDiagnostic(`Glasses photo captured at ${photo.width} × ${photo.height}`);

      if (!FileSystem.cacheDirectory) throw new Error('The iPhone photo cache is unavailable.');
      photoUri = `${FileSystem.cacheDirectory}clio-campus-view-${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(photoUri, photo.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const locationPermission = await Location.getForegroundPermissionsAsync();
      const position = locationPermission.granted
        ? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            .catch(() => null)
        : null;

      setStatus('Comparing the view with verified campus landmarks…');
      addVoiceDiagnostic(
        position
          ? 'Sending the encrypted photo with approximate campus coordinates'
          : 'Sending the encrypted photo without coordinates',
      );
      const result = await identifyCampusView(
        photoUri,
        position ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        } : undefined,
      );
      setAnswer(result.answer);
      setSources(result.sources);
      setVisionIdentification(result.identification);
      setQuestion('');
      addVoiceDiagnostic(
        result.identification.name
          ? `Vision identified ${result.identification.name} at ${Math.round(result.identification.confidence * 100)}% confidence`
          : 'Vision could not identify the campus view confidently',
      );
      setStatus('Visual answer shown below; preparing the glasses audio route…');
      setPhase('speaking');
      answered = true;
    } catch (error) {
      addVoiceDiagnostic(
        `Visual question failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (error instanceof ApiError && error.status === 401) setPaired(false);
      setStatus(error instanceof Error ? error.message : 'Clio could not identify this view');
    } finally {
      if (photoUri) {
        await FileSystem.deleteAsync(photoUri, { idempotent: true }).catch(() => undefined);
      }
      if (!answered) setPhase('ready');
    }
  }

  async function handleReplayAnswer() {
    if (!answer.trim() || phase !== 'ready') return;
    await stopNativeSpeech().catch(() => false);
    addVoiceDiagnostic('Replay requested for the exact answer bubble text');
    setStatus('Replaying the answer through the glasses…');
    setPhase('speaking');
  }

  async function handleWakeToggle() {
    if (!paired || (phase !== 'ready' && phase !== 'checking')) return;

    if (wakeEnabled) {
      setWakeEnabled(false);
      setWakeState(await stopWakePhraseListening());
      setStatus('Hey Clio listening is off');
      return;
    }

    try {
      const permissionState = await requestWakePhrasePermissions();
      setWakeState(permissionState);
      if (!permissionState.speechAuthorized || !permissionState.microphoneAuthorized) {
        throw new Error('Microphone and speech recognition permissions are required for Hey Clio.');
      }
      if (!permissionState.onDeviceSupported) {
        throw new Error('This iPhone does not currently support private on-device wake listening.');
      }
      setWakeEnabled(true);
      addVoiceDiagnostic('Hey Clio foreground listener enabled');
      setStatus('Active listening is on — say “Hey Clio” while this screen is open');
    } catch (error) {
      setWakeEnabled(false);
      setStatus(error instanceof Error ? error.message : 'Hey Clio listening could not start');
    }
  }

  async function handleVoicePress() {
    if (!paired || (phase !== 'ready' && phase !== 'recording')) return;

    if (recorderState.isRecording) {
      setPhase('transcribing');
      setStatus('Transcribing securely…');
      try {
        await recorder.stop();
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
        });
        if (!recorder.uri) throw new Error('No recording was captured');
        const result = await transcribeQuestion(recorder.uri);
        if (!result.text) throw new Error('I could not hear a question');
        await submitQuestion(result.text);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Voice request failed');
        setPhase('ready');
      }
      return;
    }

    try {
      await stopWakePhraseListening().catch(() => undefined);
      await stopNativeSpeech().catch(() => false);
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
      setStatus('Listening through the active microphone route… tap again when finished');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Recording could not start');
      setPhase('ready');
    }
  }

  async function handleDisconnect() {
    setWakeEnabled(false);
    await stopWakePhraseListening().catch(() => undefined);
    await stopNativeSpeech().catch(() => false);
    await disconnectDevice();
    setPaired(false);
    setAnswer('');
    setSources([]);
    setVisionIdentification(null);
    setStatus('Device session removed');
  }

  async function handleMetaAction() {
    if (!metaState.sdkLoaded || metaBusy) return;
    setMetaBusy(true);
    setMetaError('');
    try {
      const nextState =
        metaState.registrationState === 'registered'
          ? await unregisterMetaWearables()
          : await startMetaRegistration();
      setMetaState(nextState);
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : 'Meta glasses action failed');
    } finally {
      setMetaBusy(false);
    }
  }

  async function refreshMetaState() {
    setMetaBusy(true);
    setMetaError('');
    try {
      setMetaState(await getMetaWearablesState());
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : 'Meta glasses status is unavailable');
    } finally {
      setMetaBusy(false);
    }
  }

  const busy = !['ready', 'checking', 'recording'].includes(phase);
  const connectedMetaDevice = metaState.devices.find(device => device.linkState === 'connected');
  const metaStatus = !metaState.platformSupported
    ? 'Native Meta integration is currently available on iOS.'
    : !metaState.sdkLoaded
      ? 'Install the new Meta-enabled preview build to connect.'
      : connectedMetaDevice
        ? `${connectedMetaDevice.name} is connected.`
        : metaState.registrationState === 'registered'
          ? 'Registered. Turn on the glasses and keep Meta AI available.'
          : metaState.registrationState === 'registering'
            ? 'Finish registration in Meta AI, then return to ClioVision.'
            : 'Ready to register through the Meta AI app.';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>MISSOURI S&T</Text>
              <Text style={styles.title}>Meet Clio.</Text>
              <Text style={styles.subtitle}>Your campus guide, in your ear.</Text>
            </View>
            <View style={[styles.statusDot, paired ? styles.statusDotReady : styles.statusDotIdle]} />
          </View>

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}><Text style={styles.securityIconText}>✓</Text></View>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>{paired ? 'Secure session active' : 'Pair this device'}</Text>
              <Text style={styles.securityText}>{status}</Text>
            </View>
            {paired && (
              <Pressable onPress={handleDisconnect} hitSlop={12}>
                <Text style={styles.disconnectText}>Remove</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <View>
                <Text style={styles.metaEyebrow}>META AI GLASSES</Text>
                <Text style={styles.metaTitle}>Wearables connection</Text>
              </View>
              <View
                style={[
                  styles.metaStatePill,
                  connectedMetaDevice ? styles.metaStatePillConnected : styles.metaStatePillIdle,
                ]}>
                <Text
                  style={[
                    styles.metaStateText,
                    connectedMetaDevice && styles.metaStateTextConnected,
                  ]}>
                  {connectedMetaDevice ? 'Connected' : metaState.registrationState}
                </Text>
              </View>
            </View>
            <Text style={styles.metaBody}>{metaStatus}</Text>
            {metaState.devices.map(device => (
              <View key={device.id} style={styles.metaDeviceRow}>
                <View style={styles.metaDeviceCopy}>
                  <Text style={styles.metaDeviceName}>{device.name}</Text>
                  <Text style={styles.metaDeviceDetail}>
                    {device.deviceType} · {device.compatibility}
                  </Text>
                </View>
                <Text style={styles.metaDeviceState}>{device.linkState}</Text>
              </View>
            ))}
            {metaError ? <Text style={styles.metaError}>{metaError}</Text> : null}
            <View style={styles.metaActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.metaPrimaryButton,
                  (!metaState.sdkLoaded || metaBusy) && styles.disabledButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleMetaAction}
                disabled={!metaState.sdkLoaded || metaBusy}>
                {metaBusy ? (
                  <ActivityIndicator color="#071A15" />
                ) : (
                  <Text style={styles.metaPrimaryButtonText}>
                    {metaState.registrationState === 'registered'
                      ? 'Disconnect Meta'
                      : 'Connect Meta glasses'}
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.metaRefreshButton, pressed && styles.pressed]}
                onPress={refreshMetaState}
                disabled={!metaState.sdkLoaded || metaBusy}>
                <Text style={styles.metaRefreshText}>Refresh</Text>
              </Pressable>
            </View>
            {metaState.sdkLoaded ? (
              <Text style={styles.metaSdkText}>Meta Wearables DAT Core {metaState.sdkVersion}</Text>
            ) : null}
          </View>

          {paired ? (
            <View style={styles.debugCard}>
              <View style={styles.debugHeader}>
                <View style={styles.debugHeaderCopy}>
                  <Text style={styles.debugEyebrow}>VOICE DEBUG</Text>
                  <Text style={styles.debugTitle}>Wake, route, and native speech checkpoints</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear voice debug log"
                  hitSlop={10}
                  onPress={() => setVoiceDiagnostics([])}>
                  <Text style={styles.debugClear}>Clear</Text>
                </Pressable>
              </View>
              <Text style={styles.debugHelp}>
                {'"Hey User" is generated locally before Clio contacts the backend. If you hear it in '
                  + 'the glasses, wake detection and the iOS Bluetooth output route are working. Answer '
                  + 'speech uses the exact text shown in the answer bubble below.'}
              </Text>
              {voiceDiagnostics.length > 0 ? (
                <View style={styles.debugLog}>
                  {voiceDiagnostics.map((entry, index) => (
                    <Text key={`${entry}-${index}`} style={styles.debugEntry} selectable>
                      {entry}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.debugEmpty}>Enable Hey Clio to begin collecting checkpoints.</Text>
              )}
            </View>
          ) : null}

          {!paired ? (
            <View style={styles.pairingCard}>
              <Text style={styles.cardTitle}>Private pairing code</Text>
              <Text style={styles.cardBody}>
                Enter the code configured on your Clio backend. It is exchanged once and is never saved.
              </Text>
              <TextInput
                style={styles.pairingInput}
                value={pairingCode}
                onChangeText={setPairingCode}
                placeholder="Enter pairing code"
                placeholderTextColor="#7A8191"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={phase !== 'pairing'}
                onSubmitEditing={handlePair}
              />
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={handlePair}
                disabled={phase === 'pairing'}>
                {phase === 'pairing' ? (
                  <ActivityIndicator color="#071A15" />
                ) : (
                  <Text style={styles.primaryButtonText}>Pair securely</Text>
                )}
              </Pressable>
              <Text style={styles.apiHint}>Backend: {apiBaseUrl}</Text>
            </View>
          ) : (
            <>
              {wakeState.moduleLoaded ? (
                <View style={styles.voiceArea}>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: wakeEnabled }}
                    accessibilityLabel={wakeEnabled ? 'Disable Hey Clio' : 'Enable Hey Clio'}
                    style={({ pressed }) => [
                      styles.voiceHalo,
                      wakeEnabled && styles.voiceHaloWake,
                      wakeState.mode === 'awaitingCommand' && styles.voiceHaloAwaiting,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleWakeToggle}
                    disabled={busy || phase === 'recording'}>
                    <View style={styles.voiceButton}>
                      {busy ? (
                        <ActivityIndicator color="#071A15" size="large" />
                      ) : (
                        <Text style={styles.micIcon}>{wakeEnabled ? '◉' : '●'}</Text>
                      )}
                    </View>
                  </Pressable>
                  <Text style={styles.voiceLabel}>
                    {wakeState.mode === 'awaitingCommand'
                      ? 'I’m listening — ask now'
                      : wakeEnabled
                        ? 'Say “Hey Clio”'
                        : 'Enable Hey Clio'}
                  </Text>
                  <Text style={styles.voiceHint}>
                    {wakeEnabled
                      ? 'Active only while Clio is open; ambient speech stays on this iPhone'
                      : 'Tap once to enable private foreground wake listening'}
                  </Text>
                  <Text style={styles.wakePrivacyLabel}>ON-DEVICE · FOREGROUND ONLY</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={recorderState.isRecording ? 'Stop recording' : 'Use tap to talk'}
                    style={({ pressed }) => [styles.tapToTalkButton, pressed && styles.pressed]}
                    onPress={handleVoicePress}
                    disabled={busy}>
                    <Text style={styles.tapToTalkText}>
                      {recorderState.isRecording ? 'Finish tap-to-talk' : 'Use tap-to-talk instead'}
                    </Text>
                  </Pressable>
                </View>
              ) : (
              <View style={styles.voiceArea}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={recorderState.isRecording ? 'Stop recording' : 'Ask Clio by voice'}
                  style={({ pressed }) => [
                    styles.voiceHalo,
                    recorderState.isRecording && styles.voiceHaloRecording,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleVoicePress}
                  disabled={busy}>
                  <View style={styles.voiceButton}>
                    {busy ? (
                      <ActivityIndicator color="#071A15" size="large" />
                    ) : (
                      <Text style={styles.micIcon}>{recorderState.isRecording ? '■' : '●'}</Text>
                    )}
                  </View>
                </Pressable>
                <Text style={styles.voiceLabel}>
                  {recorderState.isRecording ? 'Tap to finish' : 'Tap to ask Clio'}
                </Text>
                <Text style={styles.voiceHint}>Keep the app open while speaking</Text>
              </View>
              )}

              <View style={styles.askRow}>
                <TextInput
                  style={styles.questionInput}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Or type a campus question…"
                  placeholderTextColor="#7A8191"
                  returnKeyType="send"
                  editable={!busy}
                  onSubmitEditing={() => submitQuestion()}
                />
                <Pressable
                  style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}
                  onPress={() => submitQuestion()}
                  disabled={busy || !question.trim()}>
                  <Text style={styles.sendButtonText}>↑</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestions}>
                {suggestedQuestions.map(item => (
                  <Pressable
                    key={item}
                    style={({ pressed }) => [styles.suggestionChip, pressed && styles.pressed]}
                    onPress={() => submitQuestion(item)}
                    disabled={busy}>
                    <Text style={styles.suggestionText}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {(answer || transcript) && (
                <View style={styles.answerCard}>
                  {transcript ? <Text style={styles.transcript}>“{transcript}”</Text> : null}
                  {visionIdentification?.name ? (
                    <View style={styles.visionResultRow}>
                      <Text style={styles.visionResultLabel}>VIEW IDENTIFIED</Text>
                      <Text style={styles.visionResultText}>
                        {visionIdentification.name} · {Math.round(visionIdentification.confidence * 100)}%
                      </Text>
                    </View>
                  ) : null}
                  {answer ? <Text style={styles.answer}>{answer}</Text> : null}
                  {answer ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Play the answer through the Meta glasses"
                      style={({ pressed }) => [
                        styles.answerSpeechButton,
                        phase !== 'ready' && styles.disabledButton,
                        pressed && phase === 'ready' && styles.pressed,
                      ]}
                      onPress={handleReplayAnswer}
                      disabled={phase !== 'ready'}>
                      <Text style={styles.answerSpeechButtonText}>
                        {phase === 'speaking' ? 'Speaking through glasses…' : 'Play through glasses'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {sources.length > 0 && (
                    <View style={styles.sourcesRow}>
                      <Text style={styles.sourcesLabel}>GROUNDED IN</Text>
                      <Text style={styles.sourcesText}>
                        {sources.slice(0, 3).map(source => source.title).join(' · ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071A15' },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: BottomTabInset + 36,
    gap: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#7EE2AE', fontSize: 12, fontWeight: '800', letterSpacing: 2.2 },
  title: { color: '#F5F3EB', fontSize: 44, lineHeight: 50, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#A6B3AC', fontSize: 17, marginTop: 4 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 9 },
  statusDotReady: { backgroundColor: '#7EE2AE', boxShadow: '0 0 10px rgba(126, 226, 174, 0.8)' },
  statusDotIdle: { backgroundColor: '#59655F' },
  securityCard: {
    backgroundColor: '#102A22',
    borderWidth: 1,
    borderColor: '#1F493B',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#7EE2AE', alignItems: 'center', justifyContent: 'center' },
  securityIconText: { color: '#071A15', fontWeight: '900' },
  securityCopy: { flex: 1 },
  securityTitle: { color: '#F5F3EB', fontSize: 14, fontWeight: '700' },
  securityText: { color: '#94A49C', fontSize: 12, marginTop: 2, lineHeight: 17 },
  disconnectText: { color: '#7EE2AE', fontSize: 12, fontWeight: '700' },
  metaCard: {
    backgroundColor: '#102A22',
    borderWidth: 1,
    borderColor: '#285343',
    borderRadius: 20,
    padding: 17,
    gap: 12,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaEyebrow: { color: '#7EE2AE', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  metaTitle: { color: '#F5F3EB', fontSize: 17, fontWeight: '800', marginTop: 4 },
  metaStatePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  metaStatePillConnected: { backgroundColor: '#7EE2AE' },
  metaStatePillIdle: { backgroundColor: '#28483E' },
  metaStateText: { color: '#F5F3EB', fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  metaStateTextConnected: { color: '#071A15' },
  metaBody: { color: '#A6B3AC', fontSize: 13, lineHeight: 19 },
  metaDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#285343',
    paddingTop: 11,
  },
  metaDeviceCopy: { flex: 1 },
  metaDeviceName: { color: '#F5F3EB', fontSize: 13, fontWeight: '700' },
  metaDeviceDetail: { color: '#829189', fontSize: 10, marginTop: 2 },
  metaDeviceState: { color: '#7EE2AE', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaError: { color: '#F3A28E', fontSize: 12, lineHeight: 17 },
  metaActions: { flexDirection: 'row', gap: 9 },
  metaPrimaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#7EE2AE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  metaPrimaryButtonText: { color: '#071A15', fontSize: 13, fontWeight: '800' },
  metaRefreshButton: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#376B59',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  metaRefreshText: { color: '#BFD0C8', fontSize: 12, fontWeight: '700' },
  metaSdkText: { color: '#667B71', fontSize: 9 },
  debugCard: {
    backgroundColor: '#0B211B',
    borderWidth: 1,
    borderColor: '#376B59',
    borderRadius: 18,
    padding: 16,
    gap: 11,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  debugHeaderCopy: { flex: 1 },
  debugEyebrow: { color: '#F6D77A', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  debugTitle: { color: '#F5F3EB', fontSize: 15, fontWeight: '800', marginTop: 4 },
  debugClear: { color: '#7EE2AE', fontSize: 11, fontWeight: '800' },
  debugHelp: { color: '#A6B3AC', fontSize: 11, lineHeight: 16 },
  debugLog: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#285343',
    paddingTop: 8,
    gap: 6,
  },
  debugEntry: { color: '#BFD0C8', fontSize: 10, lineHeight: 15, fontFamily: 'Courier' },
  debugEmpty: { color: '#667B71', fontSize: 10, fontStyle: 'italic' },
  disabledButton: { opacity: 0.45 },
  pairingCard: { backgroundColor: '#F3F0E6', borderRadius: 24, padding: 20, gap: 14 },
  cardTitle: { color: '#102A22', fontSize: 22, fontWeight: '800' },
  cardBody: { color: '#52615A', fontSize: 14, lineHeight: 20 },
  pairingInput: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, height: 54, color: '#102A22', fontSize: 16, borderWidth: 1, borderColor: '#D9DDD6' },
  primaryButton: { backgroundColor: '#7EE2AE', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#071A15', fontSize: 16, fontWeight: '800' },
  apiHint: { color: '#7A837D', fontSize: 11 },
  voiceArea: { alignItems: 'center', paddingVertical: 16 },
  voiceHalo: { width: 148, height: 148, borderRadius: 74, backgroundColor: '#163B30', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#28634F' },
  voiceHaloWake: { backgroundColor: '#174B3A', borderColor: '#7EE2AE', borderWidth: 2 },
  voiceHaloAwaiting: { backgroundColor: '#315B43', borderColor: '#F6D77A', borderWidth: 3 },
  voiceHaloRecording: { backgroundColor: '#583129', borderColor: '#F38B70' },
  voiceButton: { width: 105, height: 105, borderRadius: 53, backgroundColor: '#7EE2AE', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(126, 226, 174, 0.35)' },
  micIcon: { color: '#071A15', fontSize: 35, fontWeight: '900' },
  voiceLabel: { color: '#F5F3EB', fontSize: 18, fontWeight: '700', marginTop: 16 },
  voiceHint: { color: '#829189', fontSize: 12, marginTop: 5 },
  wakePrivacyLabel: { color: '#667B71', fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginTop: 9 },
  tapToTalkButton: { marginTop: 14, minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: '#376B59', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  tapToTalkText: { color: '#BFD0C8', fontSize: 11, fontWeight: '700' },
  askRow: { flexDirection: 'row', gap: 10 },
  questionInput: { flex: 1, backgroundColor: '#102A22', borderRadius: 16, height: 54, paddingHorizontal: 16, color: '#F5F3EB', borderWidth: 1, borderColor: '#1F493B', fontSize: 15 },
  sendButton: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#7EE2AE', alignItems: 'center', justifyContent: 'center' },
  sendButtonText: { color: '#071A15', fontSize: 27, lineHeight: 30, fontWeight: '800' },
  suggestions: { gap: 9, paddingRight: 20 },
  suggestionChip: { borderRadius: 999, borderWidth: 1, borderColor: '#285343', backgroundColor: '#0E261F', paddingHorizontal: 14, paddingVertical: 10, maxWidth: 240 },
  suggestionText: { color: '#BFD0C8', fontSize: 12 },
  answerCard: { backgroundColor: '#F3F0E6', borderRadius: 24, padding: 20, gap: 14 },
  transcript: { color: '#718078', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  visionResultRow: {
    borderRadius: 14,
    backgroundColor: '#DDF4E6',
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 3,
  },
  visionResultLabel: { color: '#3E6D59', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  visionResultText: { color: '#102A22', fontSize: 13, fontWeight: '800' },
  answer: { color: '#102A22', fontSize: 18, lineHeight: 27, fontWeight: '600' },
  answerSpeechButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#102A22',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  answerSpeechButtonText: { color: '#7EE2AE', fontSize: 13, fontWeight: '800' },
  sourcesRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C7CFC9', paddingTop: 12, gap: 4 },
  sourcesLabel: { color: '#748078', fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  sourcesText: { color: '#40564C', fontSize: 11, lineHeight: 16 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
