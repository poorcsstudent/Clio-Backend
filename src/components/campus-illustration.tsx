import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

/** An illustration reference only. Never project GPS onto an unscaled drawing. */
export function CampusIllustration() {
  const [zoom, setZoom] = useState(1);
  const width = Math.max(260, Math.min(1000, useWindowDimensions().width - 100));
  return <View style={{ marginVertical: 16, gap: 12 }}>
    <Text style={{ color: '#9CE2BD', fontWeight: '700' }}>OPTIONAL S&amp;T CAMPUS ILLUSTRATION</Text>
    <Text style={{ color: '#B6CBC0' }}>Pan and zoom for visual context. This drawing is not to scale, does not show your live position, and does not control spoken turns.</Text>
    <View style={{ flexDirection: 'row', gap: 12 }}>{[1, 2, 3].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: zoom === value }} onPress={() => setZoom(value)} style={{ padding: 12, borderRadius: 12, backgroundColor: zoom === value ? '#90DDB1' : '#274A3A' }}><Text style={{ color: zoom === value ? '#10251A' : '#fff' }}>{value}×</Text></Pressable>)}</View>
    <ScrollView horizontal style={{ height: 360, borderRadius: 16 }} nestedScrollEnabled>
      <ScrollView style={{ width: width * zoom, height: 360 }} nestedScrollEnabled>
        <Image source={require('../../preview/campus-tracing-source.png')} accessibilityLabel="Illustrated Missouri S&T campus map; visual reference only" resizeMode="contain" style={{ width: width * zoom, height: width * zoom * 1746 / 3114 }} />
      </ScrollView>
    </ScrollView>
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://www.mst.edu/map/overlay-map/')}><Text style={{ color: '#9CE2BD' }}>Map artwork © Missouri S&amp;T · Open official map ↗</Text></Pressable>
  </View>;
}
