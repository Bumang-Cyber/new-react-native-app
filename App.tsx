import { NavigationContainer } from '@react-navigation/native';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  // useSafeAreaInsets,
} from 'react-native-safe-area-context';
import TabNavigator from './navigation/TabNavigator';

function App() {
  // const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
