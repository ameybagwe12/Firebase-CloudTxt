import React, {useEffect} from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import Pdf from 'react-native-pdf';
import Video from 'react-native-video';
import SoundPlayer from 'react-native-sound-player';

function InChatViewFile({route, navigation}) {
  const currentMessage = route.params.currentMessage;
  const filePath =
    currentMessage.file || currentMessage.audio || currentMessage.video;
  const fileExtension = filePath ? filePath.split('.').pop().toLowerCase() : '';

  useEffect(() => {
    if (fileExtension === 'mp3' || fileExtension === 'wav') {
      SoundPlayer.playUrl(filePath);
    }

    return () => {
      SoundPlayer.stop();
    };
  }, [filePath, fileExtension]);

  const renderFile = () => {
    switch (fileExtension) {
      case 'pdf':
        return <Pdf source={{uri: filePath}} style={styles.pdf} />;
      case 'mp3':
      case 'wav':
        return <Text style={styles.audioPlayingText}>Playing Audio...</Text>;
      case 'mp4':
      case 'mov':
      case 'avi':
        return (
          <Video
            source={{uri: filePath}}
            controls={true}
            style={styles.media}
          />
        );
      default:
        return <Text>Unsupported file type</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {filePath ? renderFile() : <Text>No file to display</Text>}
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Chat');
          SoundPlayer.stop();
        }}
        style={styles.buttonCancel}>
        <Text style={styles.textBtn}>X</Text>
      </TouchableOpacity>
    </View>
  );
}

export default InChatViewFile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  media: {
    flex: 1,
    width: '100%',
  },
  audioPlayingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonCancel: {
    width: 35,
    height: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderColor: 'black',
    backgroundColor: 'white',
    left: 13,
    top: 20,
    zIndex: 1,
  },
  textBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});
