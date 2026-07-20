import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchYouTube } from './api';
import { usePlayer } from './PlayerContext';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    playTrack,
    currentTrack,
    isPlaying,
    isLoadingStream,
    toggleSaveTrack,
    isTrackSaved,
    isBackendConnected,
  } = usePlayer();

  const searchRequestIdRef = useRef(0);

  const executeSearch = async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const currentRequestId = ++searchRequestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchYouTube(trimmed);

      if (currentRequestId === searchRequestIdRef.current) {
        setResults(searchResults);
      }
    } catch (err) {
      if (currentRequestId === searchRequestIdRef.current) {
        console.error('Search error:', err);
        setError(err.message || 'Error searching YouTube. Ensure backend is running.');
        setResults([]);
      }
    } finally {
      if (currentRequestId === searchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  };

  const handleTrackSelect = (track) => {
    playTrack(track);
    navigation?.navigate?.('Player', { track });
  };

  const renderTrackItem = ({ item }) => {
    const isCurrent = currentTrack?.id === item.id;
    const isSaved = isTrackSaved(item.id);
    const minutes = Math.floor(item.duration / 60);
    const seconds = String(item.duration % 60).padStart(2, '0');
    const formattedDuration = `${minutes}:${seconds}`;

    return (
      <Pressable
        style={[styles.resultRow, isCurrent && styles.activeResultRow]}
        onPress={() => handleTrackSelect(item)}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.resultImage}
        />

        <View style={styles.trackDetails}>
          <Text style={[styles.resultTitle, isCurrent && styles.activeTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultArtist} numberOfLines={1}>
            {item.uploader}
          </Text>
          <Text style={styles.resultDuration}>{formattedDuration}</Text>
        </View>

        {/* Action icons */}
        <View style={styles.rowActions}>
          <Pressable
            style={styles.actionIconButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleSaveTrack(item);
            }}
          >
            <MaterialCommunityIcons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? '#1DB954' : '#808080'}
            />
          </Pressable>

          <View style={styles.statusIndicatorContainer}>
            {isCurrent && isLoadingStream ? (
              <ActivityIndicator size="small" color="#1DB954" style={{ width: 20, height: 20 }} />
            ) : isCurrent ? (
              <MaterialCommunityIcons
                name={isPlaying ? 'volume-high' : 'pause'}
                size={22}
                color="#1DB954"
              />
            ) : (
              <MaterialCommunityIcons name="play-circle-outline" size={24} color="#B3B3B3" />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with connection badge */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Search</Text>
        <View style={styles.connectionBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isBackendConnected ? '#1DB954' : '#FF6B6B' },
            ]}
          />
          <Text style={styles.statusText}>
            {isBackendConnected ? 'Backend Connected' : 'Backend Disconnected'}
          </Text>
        </View>
      </View>

      {/* Search Input Bar with explicit Search Button */}
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={(text) => setQuery(text)}
          placeholder="Search songs, artists, or audio..."
          placeholderTextColor="#808080"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => executeSearch(query)}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#808080" />
          </Pressable>
        )}
        <Pressable
          style={styles.searchSubmitButton}
          onPress={() => executeSearch(query)}
        >
          <MaterialCommunityIcons name="magnify" size={22} color="#121212" />
        </Pressable>
      </View>

      {/* Loading state indicator */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1DB954" style={{ width: 40, height: 40 }} />
          <Text style={styles.loadingText}>Fetching YouTube search results...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => executeSearch(query)}>
            <Text style={styles.retryText}>Retry Search</Text>
          </Pressable>
        </View>
      )}

      {/* Empty search results */}
      {!loading && !error && query.trim().length > 0 && results.length === 0 && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="text-search" size={48} color="#404040" />
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        </View>
      )}

      {/* Search Results List */}
      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={renderTrackItem}
        />
      )}

      {/* Initial state placeholder */}
      {query.trim().length === 0 && !loading && !error && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="music-box-outline" size={64} color="#333" />
          <Text style={styles.placeholderTitle}>Discover Local & Streamed Music</Text>
          <Text style={styles.placeholderText}>
            Type any song name or artist and press the search button to stream audio.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  header: { color: '#fff', fontSize: 26, fontWeight: '700' },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#B3B3B3', fontSize: 11, fontWeight: '500' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 4,
    height: 48,
    borderWidth: 1,
    borderColor: '#282828',
  },
  input: { flex: 1, fontSize: 15, color: '#fff' },
  clearButton: { padding: 6, marginRight: 4 },
  searchSubmitButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  activeResultRow: {
    backgroundColor: '#1E2820',
  },
  resultImage: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#282828' },
  trackDetails: { flex: 1, marginLeft: 12, marginRight: 8 },
  resultTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  activeTitle: { color: '#1DB954' },
  resultArtist: { color: '#B3B3B3', fontSize: 13, marginTop: 2 },
  resultDuration: { color: '#777', fontSize: 11, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  actionIconButton: { padding: 6, marginRight: 4 },
  statusIndicatorContainer: { width: 32, alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { color: '#B3B3B3', fontSize: 14, marginTop: 12 },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#282828', borderRadius: 16 },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#B3B3B3', fontSize: 15, marginTop: 12 },
  placeholderTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 16 },
  placeholderText: { color: '#808080', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 18 },
});