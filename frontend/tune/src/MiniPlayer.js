import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlayer } from './PlayerContext';

export default function MiniPlayer({ navigation }) {
  const {
    currentTrack,
    isPlaying,
    isLoadingStream,
    togglePlayPause,
    position,
    duration,
  } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleOpenPlayer = () => {
    if (navigation) {
      navigation.navigate('Player', { track: currentTrack });
    }
  };

  return (
    <View style={styles.container}>
      {/* Top progress bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
      </View>

      <Pressable style={styles.contentRow} onPress={handleOpenPlayer}>
        <Image
          source={{ uri: currentTrack.thumbnail }}
          style={styles.thumbnail}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {isLoadingStream ? 'Fetching audio stream...' : currentTrack.uploader || 'YouTube Music'}
          </Text>
        </View>

        <Pressable
          style={styles.playButton}
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          disabled={isLoadingStream}
        >
          {isLoadingStream ? (
            <ActivityIndicator size="small" color="#1DB954" />
          ) : (
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color="#fff"
            />
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#282828',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  progressBarBackground: {
    height: 2,
    backgroundColor: '#333',
    width: '100%',
  },
  progressBarFill: {
    height: 2,
    backgroundColor: '#1DB954',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: '#282828',
  },
});
