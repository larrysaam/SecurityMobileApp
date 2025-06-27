import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

const CreateAlertScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Alert Screen</Text>
      <Text style={styles.subtitle}>This screen will handle alert creation</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    textAlign: 'center',
  },
});

export default CreateAlertScreen;
