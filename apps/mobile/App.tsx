import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'

export default function App() {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log("Deep link received:", event.url);
    };
    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Chordially mobile foundation</Text>
      <StatusBar style='auto' />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
