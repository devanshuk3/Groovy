import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlayer } from './PlayerContext';

const { width } = Dimensions.get('window');
const ART_SIZE = Math.min(width - 64, 320);

export default function PlayerScreen({ route, navigation }) {
  const routeTrack = route?.params?.track;

  const {
    currentTrack,
    isPlaying,
    isLoadingStream,
    position,
    duration,
    playbackError,
    playTrack,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    toggleSaveTrack,
    isTrackSaved,
  } = usePlayer();

  // If a track was passed in route params and is not currently loaded/playing, trigger play
  useEffect(() => {
    if (routeTrack && routeTrack.id !== currentTrack?.id) {
      playTrack(routeTrack);
    }
  }, [routeTrack]);

  const activeTrack = currentTrack || routeTrack;

  if (!activeTrack) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="music-off" size={64} color="#404040" />
          <Text style={styles.emptyTitle}>No Track Selected</Text>
          <Text style={styles.emptySubtitle}>Select a track from Search or Home to start playing</Text>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isSaved = isTrackSaved(activeTrack.id);
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;

  // Handle interactive seeking when user taps progress bar
  const handleSeekPress = (event) => {
    if (duration <= 0) return;
    const { locationX } = event.nativeEvent;
    const barWidth = width - 48; // paddingHorizontal 24 * 2
    const percentage = Math.max(0, Math.min(locationX / barWidth, 1));
    seekTo(percentage * duration);
  };

  const formatTime = (ms) => {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.top}>
        <Pressable onPress={() => navigation?.goBack?.()} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-down" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.topLabel}>NOW PLAYING</Text>
        <Pressable onPress={() => toggleSaveTrack(activeTrack)} hitSlop={12}>
          <MaterialCommunityIcons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={24}
            color={isSaved ? '#1DB954' : '#fff'}
          />
        </Pressable>
      </View>

      {/* Album Artwork Container */}
      <View style={styles.artworkContainer}>
        <Image source={{ uri: activeTrack.thumbnail }} style={styles.artwork} />
        {isLoadingStream && (
          <View style={styles.artworkOverlay}>
            <ActivityIndicator size="large" color="#1DB954" style={{ width: 40, height: 40 }} />
            <Text style={styles.loadingStreamText}>Fetching Audio Stream...</Text>
          </View>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.infoRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {activeTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {activeTrack.uploader || 'YouTube Music'}
          </Text>
        </View>

        <Pressable onPress={() => toggleSaveTrack(activeTrack)} style={styles.heartBtn}>
          <MaterialCommunityIcons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={26}
            color={isSaved ? '#1DB954' : '#B3B3B3'}
          />
        </Pressable>
      </View>

      {/* Interactive Seek Bar */}
      <Pressable style={styles.progressTrackContainer} onPress={handleSeekPress}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          <View style={[styles.progressDot, { left: `${progressRatio * 100}%` }]} />
        </View>
      </Pressable>

      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      {/* Error Box */}
      {playbackError && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#FF6B6B" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.errorText}>{playbackError}</Text>
          </View>
          <Pressable style={styles.retryBtn} onPress={() => playTrack(activeTrack)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Playback Controls */}
      <View style={styles.controls}>
        <Pressable onPress={() => skipBackward(15000)} disabled={isLoadingStream} hitSlop={12}>
          <MaterialCommunityIcons name="rewind-15" size={28} color={isLoadingStream ? '#404040' : '#fff'} />
        </Pressable>

        <Pressable onPress={() => skipBackward(5000)} disabled={isLoadingStream} hitSlop={12}>
          <MaterialCommunityIcons name="skip-previous" size={34} color={isLoadingStream ? '#404040' : '#fff'} />
        </Pressable>

        <Pressable
          style={[styles.playButton, isLoadingStream && styles.playButtonLoading]}
          onPress={togglePlayPause}
          disabled={isLoadingStream}
        >
          {isLoadingStream ? (
            <ActivityIndicator color="#121212" size="small" style={{ width: 24, height: 24 }} />
          ) : (
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#121212"
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          )}
        </Pressable>

        <Pressable onPress={() => skipForward(5000)} disabled={isLoadingStream} hitSlop={12}>
          <MaterialCommunityIcons name="skip-next" size={34} color={isLoadingStream ? '#404040' : '#fff'} />
        </Pressable>

        <Pressable onPress={() => skipForward(15000)} disabled={isLoadingStream} hitSlop={12}>
          <MaterialCommunityIcons name="fast-forward-15" size={28} color={isLoadingStream ? '#404040' : '#fff'} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#B3B3B3', fontSize: 14, marginTop: 8, textAlign: 'center' },
  backButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#1DB954', borderRadius: 24 },
  backButtonText: { color: '#121212', fontWeight: '700', fontSize: 15 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  topLabel: { color: '#B3B3B3', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  artworkContainer: {
    width: ART_SIZE,
    height: ART_SIZE,
    alignSelf: 'center',
    marginTop: 28,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingStreamText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    justifyContent: 'space-between',
  },
  titleColumn: { flex: 1, marginRight: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  artist: { color: '#B3B3B3', fontSize: 14, marginTop: 4 },
  heartBtn: { padding: 6 },
  progressTrackContainer: {
    height: 20,
    justifyContent: 'center',
    marginTop: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    justifyContent: 'center',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#1DB954',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    position: 'absolute',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: { color: '#808080', fontSize: 12 },
  errorBox: {
    backgroundColor: '#2C1617',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { color: '#FF6B6B', fontSize: 12, fontWeight: '500' },
  retryBtn: { backgroundColor: '#FF6B6B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  retryBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 28,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonLoading: {
    backgroundColor: '#1E1E1E',
  },
});