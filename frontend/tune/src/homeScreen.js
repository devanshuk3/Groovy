import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlayer } from './PlayerContext';

export default function HomeScreen({ navigation }) {
  const {
    recentTracks,
    savedTracks,
    playlists,
    playTrack,
    currentTrack,
    isPlaying,
    isLoadingStream,
    createPlaylist,
    isBackendConnected,
  } = usePlayer();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Determine dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsModalVisible(false);
    }
  };

  const renderTrackItem = (item) => {
    const isCurrent = currentTrack?.id === item.id;
    return (
      <Pressable
        key={item.id}
        style={[styles.trackCard, isCurrent && styles.activeTrackCard]}
        onPress={() => {
          playTrack(item);
          navigation?.navigate?.('Player', { track: item });
        }}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.trackImage} />
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isCurrent && styles.activeTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.uploader || 'YouTube'}
          </Text>
        </View>
        <View style={styles.playIconContainer}>
          {isCurrent && isLoadingStream ? (
            <ActivityIndicator size="small" color="#1DB954" />
          ) : isCurrent ? (
            <MaterialCommunityIcons
              name={isPlaying ? 'volume-high' : 'pause'}
              size={20}
              color="#1DB954"
            />
          ) : (
            <MaterialCommunityIcons name="play-circle" size={24} color="#1DB954" />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>Welcome back to tune</Text>
          </View>
          <View style={styles.connectionBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isBackendConnected ? '#1DB954' : '#FF6B6B' },
              ]}
            />
            <Text style={styles.statusText}>
              {isBackendConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Recently Played */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          {recentTracks.length > 0 ? (
            <View style={styles.listContainer}>
              {recentTracks.slice(0, 6).map(renderTrackItem)}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="music-box-multiple" size={42} color="#404040" />
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptyBody}>Tracks you stream will automatically appear here</Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => navigation?.navigate?.('Search')}
              >
                <Text style={styles.ctaText}>Explore & Play</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Saved Tracks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Tracks ({savedTracks.length})</Text>
          </View>
          {savedTracks.length > 0 ? (
            <View style={styles.listContainer}>
              {savedTracks.map(renderTrackItem)}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="heart-outline" size={42} color="#404040" />
              <Text style={styles.emptyTitle}>No saved tracks</Text>
              <Text style={styles.emptyBody}>
                Tap the heart icon on any song while searching to save it to your library
              </Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => navigation?.navigate?.('Search')}
              >
                <Text style={styles.ctaText}>Search & Save</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Playlists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Playlists</Text>
            <Pressable
              onPress={() => setIsModalVisible(true)}
              style={styles.createPlaylistBtn}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color="#1DB954" />
            </Pressable>
          </View>

          {playlists.length > 0 ? (
            <View style={styles.playlistGrid}>
              {playlists.map((pl) => (
                <View key={pl.id} style={styles.playlistCard}>
                  <MaterialCommunityIcons name="playlist-music" size={32} color="#1DB954" />
                  <Text style={styles.playlistName} numberOfLines={1}>
                    {pl.name}
                  </Text>
                  <Text style={styles.playlistCount}>{pl.tracks.length} tracks</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="playlist-music" size={42} color="#404040" />
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptyBody}>
                Create custom playlists to organize your favorite YouTube audio streams
              </Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.ctaText}>Create Playlist</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Playlist name"
              placeholderTextColor="#808080"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.saveBtnText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  scroll: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subGreeting: { color: '#B3B3B3', fontSize: 13, marginTop: 2 },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#B3B3B3', fontSize: 11, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#282828', marginVertical: 14, marginHorizontal: 16 },
  section: { paddingHorizontal: 16, marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  createPlaylistBtn: { padding: 4 },
  listContainer: { flexDirection: 'column' },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  activeTrackCard: {
    backgroundColor: '#1E2820',
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  trackImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#282828' },
  trackInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  trackTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  activeTitle: { color: '#1DB954' },
  trackArtist: { color: '#B3B3B3', fontSize: 12, marginTop: 2 },
  playIconContainer: { paddingHorizontal: 8 },
  emptyCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#282828',
  },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptyBody: { color: '#B3B3B3', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  ctaButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1DB954',
    borderRadius: 20,
  },
  ctaText: { color: '#121212', fontWeight: '700', fontSize: 14 },
  playlistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  playlistCard: {
    width: '47%',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  playlistName: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 },
  playlistCount: { color: '#808080', fontSize: 12, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#282828',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#121212',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#282828' },
  cancelBtnText: { color: '#B3B3B3', fontWeight: '600' },
  saveBtn: { backgroundColor: '#1DB954' },
  saveBtnText: { color: '#121212', fontWeight: '700' },
});