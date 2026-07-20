import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchAudioURL, checkBackendHealth } from './api';
import { UniversalSound, setAudioModeSafe } from './universalAudio';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  const soundPlayerRef = useRef(null);
  const playRequestIdRef = useRef(0);

  // Safe audio mode initialization
  useEffect(() => {
    setAudioModeSafe();

    // Check backend connection health
    checkBackendHealth().then(setIsBackendConnected);
    const healthInterval = setInterval(() => {
      checkBackendHealth().then(setIsBackendConnected);
    }, 15000);

    return () => clearInterval(healthInterval);
  }, []);

  // Cleanup sound instance on unmount
  useEffect(() => {
    return () => {
      if (soundPlayerRef.current) {
        soundPlayerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Playback status callback from UniversalSound
  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      if (status.error) {
        setPlaybackError(`Playback error: ${status.error}`);
        setIsPlaying(false);
      }
      return;
    }

    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const playTrack = async (track) => {
    if (!track || !track.url) {
      setPlaybackError('Invalid track selected');
      return;
    }

    // Toggle play/pause if clicking currently loaded track that is already playing or loaded
    if (currentTrack?.id === track.id && soundPlayerRef.current && !isLoadingStream) {
      await togglePlayPause();
      return;
    }

    const currentRequestId = ++playRequestIdRef.current;

    // Forcefully stop and cleanup any existing audio player instance first
    if (soundPlayerRef.current) {
      try {
        await soundPlayerRef.current.stop();
      } catch (err) {
        console.log('Stop sound warning:', err);
      }
      soundPlayerRef.current = null;
    }

    setCurrentTrack(track);
    setPlaybackError(null);
    setIsLoadingStream(true);
    setIsPlaying(false);
    setPosition(0);
    setDuration(track.duration ? track.duration * 1000 : 0);

    try {
      // Fetch fresh streaming audio URL from backend (yt-dlp)
      const streamUrl = await fetchAudioURL(track.url);

      // Abort if another track selection occurred during the fetch request
      if (currentRequestId !== playRequestIdRef.current) {
        console.log('🎵 Track selection changed during fetch, discarding obsolete stream:', track.title);
        return;
      }

      setAudioUrl(streamUrl);

      // Extra check: stop any lingering player reference
      if (soundPlayerRef.current) {
        await soundPlayerRef.current.stop();
        soundPlayerRef.current = null;
      }

      // Create UniversalSound player
      const player = new UniversalSound();
      await player.loadAndPlay(streamUrl, (status) => {
        if (currentRequestId === playRequestIdRef.current) {
          onPlaybackStatusUpdate(status);
        }
      });

      // Abort if another track selection occurred while loading audio
      if (currentRequestId !== playRequestIdRef.current) {
        await player.stop();
        return;
      }

      soundPlayerRef.current = player;
      setIsPlaying(true);

      // Add to recent tracks (deduplicated)
      setRecentTracks((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered].slice(0, 20);
      });
    } catch (err) {
      if (currentRequestId === playRequestIdRef.current) {
        console.error('Failed to play track:', err);
        setPlaybackError(err.message || 'Failed to stream audio file');
        setIsPlaying(false);
      }
    } finally {
      if (currentRequestId === playRequestIdRef.current) {
        setIsLoadingStream(false);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!soundPlayerRef.current) {
      if (currentTrack) {
        await playTrack(currentTrack);
      }
      return;
    }

    try {
      if (isPlaying) {
        await soundPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        await soundPlayerRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Toggle play/pause error:', err);
      setPlaybackError('Failed to control audio playback');
    }
  };

  const seekTo = async (positionMillis) => {
    if (!soundPlayerRef.current) return;
    try {
      const clamped = Math.max(0, Math.min(positionMillis, duration));
      await soundPlayerRef.current.setPosition(clamped);
      setPosition(clamped);
    } catch (err) {
      console.error('Seek error:', err);
    }
  };

  const skipForward = async (amountMs = 15000) => {
    await seekTo(position + amountMs);
  };

  const skipBackward = async (amountMs = 15000) => {
    await seekTo(position - amountMs);
  };

  const toggleSaveTrack = (track) => {
    if (!track) return;
    setSavedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const isTrackSaved = (trackId) => {
    return savedTracks.some((t) => t.id === trackId);
  };

  const createPlaylist = (name) => {
    if (!name || !name.trim()) return;
    const newPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      tracks: [],
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
  };

  const addToPlaylist = (playlistId, track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const exists = pl.tracks.some((t) => t.id === track.id);
          if (!exists) {
            return { ...pl, tracks: [...pl.tracks, track] };
          }
        }
        return pl;
      })
    );
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        audioUrl,
        isPlaying,
        isLoadingStream,
        position,
        duration,
        playbackError,
        recentTracks,
        savedTracks,
        playlists,
        isBackendConnected,
        playTrack,
        togglePlayPause,
        seekTo,
        skipForward,
        skipBackward,
        toggleSaveTrack,
        isTrackSaved,
        createPlaylist,
        addToPlaylist,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
