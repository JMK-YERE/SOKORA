import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Browser builds must not import expo-video's native SharedObject module.
// App.js renders HTML5 <video> directly on web; this fallback is defensive.
export default function NativeProductVideo({ product }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.text}>Video ya bidhaa: {product}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070B13' },
  text: { color: '#FFFFFF' },
});
