import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { getTourStops, type TourStop } from '@/services/api';

export default function CampusScreen() {
  const [stops, setStops] = useState<TourStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getTourStops()
      .then(setStops)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load stops'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>EXPLORE CAMPUS</Text>
        <Text style={styles.title}>Five stops.{`\n`}One living guide.</Text>
        <Text style={styles.subtitle}>
          These are the verified records Clio can currently use. Add richer campus facts on the backend to expand every answer.
        </Text>

        {loading && <ActivityIndicator color="#7EE2AE" size="large" style={styles.loader} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.timeline}>
          {stops.map((stop, index) => {
            const open = selected === stop.id;
            return (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.markerColumn}>
                  <View style={[styles.marker, index === 0 && styles.markerActive]}>
                    <Text style={[styles.markerText, index === 0 && styles.markerTextActive]}>{index + 1}</Text>
                  </View>
                  {index < stops.length - 1 && <View style={styles.line} />}
                </View>
                <Pressable
                  style={({ pressed }) => [styles.stopCard, pressed && styles.pressed]}
                  onPress={() => setSelected(open ? null : stop.id)}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopDescription}>{stop.description}</Text>
                  <View style={styles.tags}>
                    {stop.tourTags.map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag.replaceAll('-', ' ')}</Text>
                      </View>
                    ))}
                  </View>
                  {open && (
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>LOCATION</Text>
                      <Text style={styles.detailText}>{stop.latitude}, {stop.longitude}</Text>
                      {stop.suggestedQuestions?.map(question => (
                        <Text key={question} style={styles.question}>• {question}</Text>
                      ))}
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.dataCard}>
          <Text style={styles.dataValue}>{stops.length}</Text>
          <View style={styles.dataCopy}>
            <Text style={styles.dataTitle}>grounded campus stops</Text>
            <Text style={styles.dataText}>The AI refuses to invent facts outside this knowledge base.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071A15' },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: BottomTabInset + 36 },
  eyebrow: { color: '#7EE2AE', fontSize: 12, fontWeight: '800', letterSpacing: 2.2 },
  title: { color: '#F5F3EB', fontSize: 38, lineHeight: 44, fontWeight: '800', marginTop: 9 },
  subtitle: { color: '#9BAAA3', fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 520 },
  loader: { marginTop: 42 },
  error: { color: '#FF9E88', marginTop: 24 },
  timeline: { marginTop: 30 },
  stopRow: { flexDirection: 'row', alignItems: 'stretch' },
  markerColumn: { width: 44, alignItems: 'center' },
  marker: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#17372D', borderWidth: 1, borderColor: '#32634F', alignItems: 'center', justifyContent: 'center' },
  markerActive: { backgroundColor: '#7EE2AE', borderColor: '#7EE2AE' },
  markerText: { color: '#BFD0C8', fontSize: 11, fontWeight: '900' },
  markerTextActive: { color: '#071A15' },
  line: { width: 1, flex: 1, minHeight: 30, backgroundColor: '#245142' },
  stopCard: { flex: 1, backgroundColor: '#102A22', borderRadius: 18, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1D4437' },
  stopName: { color: '#F5F3EB', fontSize: 18, fontWeight: '800' },
  stopDescription: { color: '#9CACA4', fontSize: 13, lineHeight: 19, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { backgroundColor: '#173C30', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  tagText: { color: '#89D9B0', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  detail: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#315247', marginTop: 14, paddingTop: 12, gap: 4 },
  detailLabel: { color: '#6F8C7F', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  detailText: { color: '#CAD5D0', fontSize: 12, marginBottom: 6 },
  question: { color: '#AFC4BA', fontSize: 12, lineHeight: 18 },
  dataCard: { marginTop: 12, backgroundColor: '#7EE2AE', borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  dataValue: { color: '#071A15', fontSize: 46, fontWeight: '900' },
  dataCopy: { flex: 1 },
  dataTitle: { color: '#071A15', fontSize: 15, fontWeight: '800' },
  dataText: { color: '#254B3E', fontSize: 11, lineHeight: 16, marginTop: 3 },
  pressed: { opacity: 0.75 },
});
