import { StyleSheet, Text, View } from 'react-native';

const DietTab = () => {
  return (
    <View style={styles.container}>
      <Text>식단탭</Text>
    </View>
  );
};

export default DietTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
});
