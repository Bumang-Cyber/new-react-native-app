import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '@/screens/HomeScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import MyPageScreen from '@/screens/MyPageScreen';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

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
  const insets = useSafeAreaInsets();

  // 안드 전용 기본 여유값(디자인에 맞게 조절)
  const ANDROID_BASE = 56; // 기본 높이
  const MIN_BOTTOM_PAD = 16; // 최소 하단 패딩

  const androidBottomMargin = React.useMemo(
    () => ({
      height: ANDROID_BASE + Math.max(insets.bottom, MIN_BOTTOM_PAD),
      paddingBottom: Math.max(insets.bottom, MIN_BOTTOM_PAD),
      paddingTop: 6,
    }),
    [insets.bottom],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon({ route, focused, color, size }),
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          marginTop: 8,
          fontSize: 10,
        },
        tabBarStyle: {
          ...(Platform.OS === 'android' && androidBottomMargin),
          elevation: 8,
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
