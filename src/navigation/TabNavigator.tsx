import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '@/screens/HomeScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import MyPageScreen from '@/screens/MyPageScreen';
import Icon from 'react-native-vector-icons/FontAwesome6';

const Tab = createBottomTabNavigator();

type IconType = 'house' | 'calendar' | 'dumbbell' | 'user-large';
const getTabBarIcon = ({ route, color, size }: any) => {
  let iconName: IconType;

  switch (route.name) {
    case 'HOME':
      iconName = 'house';
      break;
    case 'CALENDAR':
      iconName = 'calendar';
      break;
    case 'LIBRARY':
      iconName = 'dumbbell';
      break;
    case 'MY PAGE':
      iconName = 'user-large';
      break;
    default:
      iconName = 'house';
  }

  return <Icon name={iconName} size={size} color={color} />;
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon({ route, focused, color, size }),
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarLabelStyle: {
          marginTop: 8,
          fontSize: 10,
        },
      })}
    >
      <Tab.Screen name="HOME" component={HomeScreen} />
      <Tab.Screen name="CALENDAR" component={CalendarScreen} />
      <Tab.Screen name="LIBRARY" component={LibraryScreen} />
      <Tab.Screen name="MY PAGE" component={MyPageScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
