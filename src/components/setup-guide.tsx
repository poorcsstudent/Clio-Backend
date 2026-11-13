import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SetupGuide({ paired, glassesConnected, listeningEnabled }: {
  paired: boolean; glassesConnected: boolean; listeningEnabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
      accessibilityLabel={expanded ? 'Hide Clio setup guide' : 'Show Clio setup guide'}
      style={styles.toggle} onPress={() => setExpanded(value => !value)}>
      <Text style={styles.title}>Getting started</Text>
      <Text style={styles.body}>{expanded ? 'Hide' : 'Show steps'}</Text>
    </Pressable>
    {expanded ? <View style={styles.steps}>
      <Text style={styles.body}><Text style={styles.bold}>1. Pair this phone {paired ? '(connected)' : '(not paired)'}</Text>{'\n'}Enter your private enrollment code below. Keep the code private; do not include it in screenshots or support logs.</Text>
      <Text style={styles.body}><Text style={styles.bold}>2. Connect glasses {glassesConnected ? '(connected)' : '(not connected)'}</Text>{'\n'}Set up the glasses in Meta AI, then use Connect Meta in Clio. A wearable connection alone does not confirm the audio output; use Preview voice to check what you hear.</Text>
      <Text style={styles.body}><Text style={styles.bold}>3. Try a conversation {listeningEnabled ? '(Hey Clio enabled)' : ''}</Text>{'\n'}Allow microphone and speech permissions when requested. Enable Hey Clio, say “Hey Clio,” wait for “Hey User,” then ask your question. Keep Clio in the foreground during testing.</Text>
      <Text style={styles.body}><Text style={styles.bold}>4. Identify a building</Text>{'\n'}Ask “Clio, what am I looking at?” after the acknowledgement. Approve camera access when prompted. A photo is sent for identification; avoid capturing people or private information. Matches may be wrong.</Text>
      <Text style={styles.body}><Text style={styles.bold}>5. Start a walking tour</Text>{'\n'}Open Campus, choose a tour, and start at Havener Center. Allow location access for automatic arrival. Follow posted sidewalks and crossings; pilot routes still need field verification.</Text>
      <Text style={styles.notice}>{Platform.OS === 'ios'
        ? 'This pilot needs internet for AI responses. Native voice and camera features require the installed Clio iOS build, not a browser preview.'
        : 'The current native glasses voice and camera integration is iOS-only. Android parity is still in development; this screen is not confirmation of Android support.'}</Text>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#142b23', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#426856' },
  toggle: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#f4f3e9' },
  body: { fontSize: 15, lineHeight: 22, color: '#c4d5cb' },
  bold: { fontWeight: '700', color: '#f4f3e9' },
  steps: { gap: 16, paddingTop: 12 },
  notice: { fontSize: 14, lineHeight: 21, color: '#f3d78b' },
});
