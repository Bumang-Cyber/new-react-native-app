import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CalendarScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendar</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default CalendarScreen;
