import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const RefundPhotoVerificationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        Alert.alert('Permissions are required for camera and location access.');
      }
    })();
  }, []);

  const takePhoto = async () => {
    setLoading(true);
    try {
      const locationPromise = Location.getCurrentPositionAsync({});
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const locationData = await locationPromise;
        const { latitude, longitude } = locationData.coords;

        const addressData = await Location.reverseGeocodeAsync({ latitude, longitude });
        const currentAddress = addressData.length > 0 ? 
          `${addressData[0].name}, ${addressData[0].city}, ${addressData[0].region}, ${addressData[0].postalCode}, ${addressData[0].country}` : 
          'Address not available';

        const currentDateTime = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Chicago',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const formattedDateTime = formatter.format(currentDateTime);

        const exifData = result.assets[0].exif || {};
        const exifDateTime = exifData.DateTimeOriginal || formattedDateTime;

        navigation.navigate('PhotoScreen', {
          photoUri: photoUri,
          metadata: {
            dateTime: exifDateTime,
            gpsLatitude: latitude,
            gpsLongitude: longitude,
            address: currentAddress,
          },
        });
      } else {
        console.error('Photo capture failed or was cancelled');
      }
    } catch (error) {
      console.error("Error taking photo or fetching location", error);
      Alert.alert("Error", "Unable to take photo or fetch location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Take Photo" onPress={takePhoto} />
        </View>
      )}
    </View>
  );
};

const PhotoScreen = ({ route }) => {
  const { photoUri, metadata } = route.params;

  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} />
      ) : (
        <Text>No image available.</Text>
      )}
      {metadata && (
        <View style={styles.metadataContainer}>
          <Text style={styles.metadataText}>Date/Time: {metadata.dateTime}</Text>
          <Text style={styles.metadataText}>GPS Latitude: {metadata.gpsLatitude}</Text>
          <Text style={styles.metadataText}>GPS Longitude: {metadata.gpsLongitude}</Text>
          <Text style={styles.metadataText}>Address: {metadata.address}</Text>
        </View>
      )}
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Refund Photo Verification">
        <Stack.Screen name="Refund Photo Verification" component={RefundPhotoVerificationScreen} />
        <Stack.Screen name="PhotoScreen" component={PhotoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  metadataContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  metadataText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  loading: {
    marginBottom: 20,
  },
});

export default App;
