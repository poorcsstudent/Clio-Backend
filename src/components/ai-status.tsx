import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getAiStatus } from '@/services/api';
import { describeAiStatus } from '@/services/aiStatus';

export default function AiStatus() {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('No observation checked yet.');
  return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
      disabled={busy} style={styles.button} onPress={async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        try { setMessage(describeAiStatus(await getAiStatus())); }
        catch { setMessage('Could not read AI observations. Check connectivity and pairing, or try again. Older backends may not support this check.'); }
        finally { inFlight.current = false; setBusy(false); }
      }}>
      <Text style={styles.title}>{busy ? 'Checking observations…' : 'Check AI observations'}</Text>
    </Pressable>
    <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>
    <Text style={styles.body}>Snapshot of this server’s latest question request, which may be from another device. Not a live AI test. Refresh to update; no question, photo, or audio is sent by this check.</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { gap: 10, marginTop: 16 },
  button: { minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: '#264638' },
  title: { color: '#a0e4ba', fontSize: 16, fontWeight: '700' },
  body: { color: '#c4d5cb', fontSize: 14, lineHeight: 21 },
});
