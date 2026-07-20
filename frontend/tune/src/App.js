import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './homeScreen';
import SearchScreen from './searchScreen';
import PlayerScreen from './playerScreen';
import MiniPlayer from './MiniPlayer';
import { PlayerProvider } from './PlayerContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="SearchHome" component={SearchScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  );
}

function CustomTabBar(props) {
  return (
    <View>
      <MiniPlayer navigation={props.navigation} />
      <BottomTabBar {...props} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <NavigationContainer>
            <Tab.Navigator
              tabBar={(props) => <CustomTabBar {...props} />}
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: '#1E1E1E',
                  borderTopColor: '#282828',
                  borderTopWidth: 1,
                  height: 56,
                  paddingBottom: 6,
                  paddingTop: 4,
                },
                tabBarActiveTintColor: '#1DB954',
                tabBarInactiveTintColor: '#B3B3B3',
                tabBarIcon: ({ color, size }) => {
                  const iconName = route.name === 'Home' ? 'home' : 'magnify';
                  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
              <Tab.Screen name="Search" component={SearchStack} options={{ tabBarLabel: 'Search' }} />
            </Tab.Navigator>
          </NavigationContainer>
        </View>
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});