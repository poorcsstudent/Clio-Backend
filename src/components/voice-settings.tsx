import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getClioVoiceSettings, setClioVoiceSettings, type ClioVoiceSettings } from '../../modules/clio-meta-wearables';

export default function VoiceSettings({ disabled, onPreview }: { disabled: boolean; onPreview: () => void }) {
  const [settings, setSettings] = useState<ClioVoiceSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    getClioVoiceSettings().then(value => { if (active) setSettings(value); })
      .catch(() => { if (active) setMessage('Voice settings could not be loaded.'); });
    return () => { active = false; };
  }, []);
  async function save(identifier: string, speed: number) {
    if (saving || disabled) return;
    setSaving(true);
    try { setSettings(await setClioVoiceSettings(identifier, speed)); setMessage('Voice preference saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save voice.'); }
    finally { setSaving(false); }
  }
  if (!settings) return null;
  const locked = disabled || saving;
  return <View style={styles.card}>
    <Text style={styles.title}>Clio’s voice</Text>
    <Text style={styles.body}>Choose an installed female voice. Automatic prefers higher-quality voices. Download enhanced voices in iPhone accessibility speech settings for more natural sound.</Text>
    {[{ identifier: '', name: 'Automatic', quality: 0 }, ...settings.voices].map(voice =>
      <Pressable key={voice.identifier} accessibilityRole="radio" accessibilityState={{ checked: settings.identifier === voice.identifier, disabled: locked }} disabled={locked} style={[styles.button, settings.identifier === voice.identifier && styles.selected]} onPress={() => save(voice.identifier, settings.speed)}>
        <Text style={styles.label}>{voice.name}{voice.quality > 1 ? ' · Enhanced quality' : ''}{settings.identifier === voice.identifier ? ' ✓' : ''}</Text>
      </Pressable>)}
    <Text style={styles.body}>Speech speed</Text>
    <View style={styles.row}>{[{ label: 'Gentle', value: 0.78 }, { label: 'Balanced', value: 0.88 }, { label: 'Normal', value: 1 }].map(speed =>
      <Pressable key={speed.value} accessibilityRole="radio" accessibilityState={{ checked: settings.speed === speed.value, disabled: locked }} disabled={locked} style={[styles.button, settings.speed === speed.value && styles.selected]} onPress={() => save(settings.identifier, speed.value)}><Text style={styles.label}>{speed.label}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" disabled={locked} accessibilityState={{ disabled: locked }} style={styles.button} onPress={onPreview}><Text style={styles.label}>Preview voice</Text></Pressable>
    {message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#142b23', borderRadius: 24, padding: 20, gap: 12, marginBottom: 20 },
  title: { color: '#f4f3e9', fontSize: 22, fontWeight: '700' },
  body: { color: '#b8ccc1', fontSize: 15, lineHeight: 22 },
  button: { minHeight: 48, borderRadius: 14, padding: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#6a9a83' },
  selected: { backgroundColor: '#315443' },
  label: { color: '#eff9f2', fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
