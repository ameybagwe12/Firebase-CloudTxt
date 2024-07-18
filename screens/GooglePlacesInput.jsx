import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Draggable from 'react-native-draggable';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {Linking} from 'react-native';

const GOOGLE_PLACES_API_KEY = '';

const GooglePlacesInput = () => {
  const [location, setLocation] = useState('');

  const openGoogleMaps = location => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location,
    )}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <>
      <View style={{backgroundColor: 'white', flex: 0.5}}>
        <GooglePlacesAutocomplete
          query={{
            key: GOOGLE_PLACES_API_KEY,
            language: 'en', // language of the results
          }}
          onPress={(data, details) => {
            console.log('Data: ', data, 'Details: ', details);
            setLocation(data.description);
          }}
          textInputProps={{
            style: styles.input,
            placeholder: 'Enter location',
            autoCapitalize: 'none',
            autoFocus: true,
            placeholderTextColor: 'gray',
          }}
          styles={{
            textInputContainer: {
              backgroundColor: 'transparent',
            },
            listView: {
              backgroundColor: 'white',
              width: '70%',
              marginLeft: 20,
            },
            row: {
              backgroundColor: '#F6F7FB',
              padding: 13,
              height: 44,
              flexDirection: 'row',
            },
            separator: {
              height: 0.5,
              backgroundColor: '#c8c7cc',
            },
            description: {
              color: 'black',
            },
            predefinedPlacesDescription: {
              color: '#1faadb',
            },
          }}
        />
      </View>
      <View>
        {location && (
          <Draggable>
            <TouchableOpacity onPress={() => openGoogleMaps(location)}>
              <View style={styles.draggableItem}>
                <View style={{marginRight: 5, justifyContent: 'center'}}>
                  <Icon name="map-marker-alt" size={16} color="black" />
                </View>
                <View>
                  <Text style={{color: 'black'}}>{location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Draggable>
        )}
      </View>
    </>
  );
};

export default GooglePlacesInput;

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F6F7FB',
    height: 58,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 10,
    padding: 12,
    color: 'black',
    width: '70%',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 20,
    marginTop: 50,
    borderColor: 'blue',
    borderWidth: 1,
  },
  draggableItem: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    margin: 20,
    borderColor: 'black',
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
