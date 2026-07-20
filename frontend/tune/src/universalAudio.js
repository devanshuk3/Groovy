/**
 * Universal Audio Engine for Groovy
 * Safely handles audio playback across Expo Go, Native Builds, and Web
 * without crashing when native modules like ExponentAV are missing.
 */

let expoAvModule = null;
let expoAudioModule = null;

// Safe dynamic imports wrapped in try/catch to avoid top-level require errors
try {
  expoAvModule = require('expo-av');
} catch (e) {
  console.log('[UniversalAudio] expo-av unavailable:', e.message);
}

try {
  expoAudioModule = require('expo-audio');
} catch (e) {
  console.log('[UniversalAudio] expo-audio unavailable:', e.message);
}

export class UniversalSound {
  constructor() {
    this.soundInstance = null;
    this.webAudio = null;
    this.onStatusCallback = null;
    this.pollInterval = null;
    this.type = 'none'; // 'web', 'expo-av', 'expo-audio'
  }

  async loadAndPlay(uri, onStatusUpdate) {
    this.onStatusCallback = onStatusUpdate;
    await this.stop();

    // 1. Try HTML5 Web Audio if available (Browser or Web container)
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      try {
        console.log('🎵 [UniversalAudio] Loading HTML5 Web Audio:', uri);
        this.webAudio = new window.Audio(uri);
        this.type = 'web';

        this.webAudio.addEventListener('timeupdate', () => {
          if (this.onStatusCallback && this.webAudio) {
            this.onStatusCallback({
              isLoaded: true,
              isPlaying: !this.webAudio.paused,
              positionMillis: Math.floor((this.webAudio.currentTime || 0) * 1000),
              durationMillis: Math.floor((this.webAudio.duration || 0) * 1000),
              didJustFinish: false,
            });
          }
        });

        this.webAudio.addEventListener('ended', () => {
          if (this.onStatusCallback) {
            this.onStatusCallback({
              isLoaded: true,
              isPlaying: false,
              positionMillis: Math.floor((this.webAudio?.duration || 0) * 1000),
              durationMillis: Math.floor((this.webAudio?.duration || 0) * 1000),
              didJustFinish: true,
            });
          }
        });

        this.webAudio.addEventListener('error', (err) => {
          console.warn('[UniversalAudio] Web Audio error:', err);
          if (this.onStatusCallback) {
            this.onStatusCallback({
              isLoaded: false,
              error: 'Failed to stream audio file via Web Audio driver',
            });
          }
        });

        await this.webAudio.play();
        return;
      } catch (webErr) {
        console.warn('[UniversalAudio] Web Audio play failed, trying native drivers:', webErr);
      }
    }

    // 2. Try expo-av if ExponentAV native module exists
    if (expoAvModule?.Audio?.Sound) {
      try {
        console.log('🎵 [UniversalAudio] Loading expo-av Sound...');
        const { sound } = await expoAvModule.Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (this.onStatusCallback) {
              this.onStatusCallback(status);
            }
          }
        );
        this.soundInstance = sound;
        this.type = 'expo-av';
        return;
      } catch (avErr) {
        console.warn('[UniversalAudio] expo-av native module missing in this build:', avErr.message);
      }
    }

    // 3. Try expo-audio if createAudioPlayer exists
    if (expoAudioModule?.createAudioPlayer) {
      try {
        console.log('🎵 [UniversalAudio] Loading expo-audio Player:', uri);
        const player = expoAudioModule.createAudioPlayer(uri);
        if (player && typeof player.play === 'function') {
          player.play();
        }
        this.soundInstance = player;
        this.type = 'expo-audio';

        this.pollInterval = setInterval(() => {
          if (this.onStatusCallback && this.soundInstance) {
            const current = this.soundInstance.currentStatus || {};
            const pos = Math.floor((current.currentTime || this.soundInstance.currentTime || 0) * 1000);
            const dur = Math.floor((current.duration || this.soundInstance.duration || 0) * 1000);
            const playing = current.playing ?? (this.soundInstance.playing ?? true);

            this.onStatusCallback({
              isLoaded: true,
              isPlaying: playing,
              positionMillis: pos,
              durationMillis: dur,
              didJustFinish: false,
            });
          }
        }, 500);
        return;
      } catch (audioErr) {
        console.warn('[UniversalAudio] expo-audio native player error:', audioErr.message);
      }
    }

    throw new Error('No supported audio driver (Web Audio, expo-av, or expo-audio) is available in this environment.');
  }

  async play() {
    if (this.type === 'web' && this.webAudio) {
      await this.webAudio.play();
    } else if (this.type === 'expo-av' && this.soundInstance) {
      await this.soundInstance.playAsync();
    } else if (this.type === 'expo-audio' && this.soundInstance) {
      if (typeof this.soundInstance.play === 'function') {
        this.soundInstance.play();
      }
    }
  }

  async pause() {
    if (this.type === 'web' && this.webAudio) {
      this.webAudio.pause();
    } else if (this.type === 'expo-av' && this.soundInstance) {
      await this.soundInstance.pauseAsync();
    } else if (this.type === 'expo-audio' && this.soundInstance) {
      if (typeof this.soundInstance.pause === 'function') {
        this.soundInstance.pause();
      }
    }
  }

  async setPosition(positionMillis) {
    const seconds = positionMillis / 1000;
    if (this.type === 'web' && this.webAudio) {
      this.webAudio.currentTime = seconds;
    } else if (this.type === 'expo-av' && this.soundInstance) {
      await this.soundInstance.setPositionAsync(positionMillis);
    } else if (this.type === 'expo-audio' && this.soundInstance) {
      if (typeof this.soundInstance.seekTo === 'function') {
        this.soundInstance.seekTo(seconds);
      }
    }
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.webAudio) {
      try {
        this.webAudio.pause();
        this.webAudio.currentTime = 0;
        this.webAudio.src = '';
        this.webAudio.removeAttribute('src');
        this.webAudio.load();
      } catch (e) {}
      this.webAudio = null;
    }

    if (this.soundInstance) {
      try {
        if (this.type === 'expo-av') {
          if (typeof this.soundInstance.stopAsync === 'function') {
            await this.soundInstance.stopAsync();
          }
          if (typeof this.soundInstance.unloadAsync === 'function') {
            await this.soundInstance.unloadAsync();
          }
        } else if (this.type === 'expo-audio') {
          if (typeof this.soundInstance.pause === 'function') {
            this.soundInstance.pause();
          }
          if (typeof this.soundInstance.remove === 'function') {
            this.soundInstance.remove();
          }
        }
      } catch (e) {}
      this.soundInstance = null;
    }
    this.type = 'none';
  }
}

export const setAudioModeSafe = async () => {
  if (expoAvModule?.Audio?.setAudioModeAsync) {
    try {
      await expoAvModule.Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      console.log('[UniversalAudio] Audio mode setup notice:', e.message);
    }
  }
};
