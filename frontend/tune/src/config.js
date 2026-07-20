import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the backend host IP address.
 * Automatically extracts the Metro bundler IP so physical Android/iOS devices
 * running Expo Go over Wi-Fi connect directly to the local backend on port 5000.
 */
const getBackendHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.developer?.tooling ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
};

const HOST = getBackendHost();
export const API_BASE_URL = `http://${HOST}:5000`;

export const API_ENDPOINTS = {
  SEARCH: `${API_BASE_URL}/api/search`,
  GET_URL: `${API_BASE_URL}/api/url`,
  HEALTH: `${API_BASE_URL}/api/health`,
};