import React, { useEffect } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';

export default function NativeProductVideo({ uri, active, product }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.audioMixingMode = 'mixWithOthers';
  });

  useEffect(() => {
    if (!player) return;
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="cover"
      nativeControls={false}
      accessibilityLabel={'Video ya bidhaa: ' + product}
    />
  );
}

const styles = StyleSheet.create({
  video: { flex: 1, width: '100%', height: '100%' },
});
