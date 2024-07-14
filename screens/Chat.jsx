import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  TouchableOpacity,
  View,
  Image,
  Text,
  ImageBackground,
} from 'react-native';
import {GiftedChat, Bubble, Send} from 'react-native-gifted-chat';
import ActionSheet from 'react-native-actions-sheet';
// import {
//   collection,
//   addDoc,
//   orderBy,
//   query,
//   onSnapshot,
// } from 'firebase/firestore';
// import InChatViewFile from '../components/InChatViewFile';
import SoundPlayer from 'react-native-sound-player';
import InChatFileTransfer from '../components/InChatFileTransfer';
import {signOut} from 'firebase/auth';
import {auth} from '../config/firebase';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as DocumentPicker from 'react-native-document-picker';
import database from '@react-native-firebase/database';
import {getDatabase, set, ref} from 'firebase/database';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
export default function Chat() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isAttachImage, setIsAttachImage] = useState(false);
  const [isAttachFile, setIsAttachFile] = useState(false);
  const [isAttachAudio, setIsAttachAudio] = useState(false);
  const [isAttachVideo, setIsAttachVideo] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [filePath, setFilePath] = useState('');
  const [audioPath, setAudioPath] = useState('');
  const [videoPath, setVideoPath] = useState('');
  const [users, setUsers] = useState([]);
  const [logUser, setLogUser] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const actionSheetRef = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    const onFinishedPlayingSubscription = SoundPlayer.addEventListener(
      'FinishedPlaying',
      () => {
        setIsPlaying(false);
        setCurrentPosition(0);
      },
    );

    const onFinishedLoadingSubscription = SoundPlayer.addEventListener(
      'FinishedLoading',
      ({success}) => {
        if (success) {
          SoundPlayer.getInfo().then(info => {
            setDuration(info.duration);
          });
        }
      },
    );

    const onProgressSubscription = SoundPlayer.addEventListener(
      'Progress',
      ({currentTime}) => {
        setCurrentPosition(currentTime);
      },
    );

    return () => {
      onFinishedPlayingSubscription.remove();
      onFinishedLoadingSubscription.remove();
      onProgressSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const onSignOut = async () => {
      const currentUser = auth.currentUser;
      const timestamp = parseInt(Date.now(), 10);
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleString();

      if (currentUser && logUser?.name) {
        database()
          .ref(`/users/${logUser.name}`)
          .update({
            status: 'offline',
            lastLogin: formattedDate,
          })
          .then(() => console.log('Data updated'));
        signOut(auth).catch(error => console.log('Error logging out:', error));
      }
    };
    console.log('USERS', users);
    console.log('LOG', logUser);
    navigation.setOptions({
      headerTitle: () => (
        <View
          style={{
            flexDirection: 'row',
            width: 220,
            alignItems: 'center',
            gap: 10,
            paddingBottom: 4,
          }}>
          <Image
            source={{
              uri: 'https://imgs.search.brave.com/pZ2DKWjtw7hzsB-caM9l5n5xAr6aaH4tXxJAIMSHK5s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA0Lzk4LzcyLzQz/LzM2MF9GXzQ5ODcy/NDMyM19Gb25BeThM/WVlmRDFCVUMwYmNL/NTZhb1l3dUxISjJH/ZS5qcGc',
            }}
            style={{width: 40, height: 40, borderRadius: 50}}
          />
          <Text style={{fontSize: 16, fontWeight: '500', color: 'black'}}>
            {users.name}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{
            marginRight: 10,
          }}
          onPress={onSignOut}>
          <Icon
            name="sign-out-alt"
            size={24}
            color="#C5C5C7"
            style={{marginRight: 10}}
          />
        </TouchableOpacity>
      ),
    });
  }, [logUser, navigation, users]);

  useEffect(() => {
    const currentUserEmail = auth?.currentUser?.email;

    database()
      .ref('/users')
      .once('value')
      .then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.val();
          if (data.email !== currentUserEmail) {
            setUsers(data);
          } else {
            setLogUser(data);
          }
        });
        console.log('User data: ', snapshot.val());
      });
  }, []);

  useEffect(() => {
    database()
      .ref('/chats')
      .once('value')
      .then(snapshot => {
        const messagesArray = [];
        snapshot.forEach(doc => {
          messagesArray.push({
            _id: doc.val()._id,
            text: doc.val().text,
            user: doc.val().user,
            image: doc.val().imagePath,
            file: doc.val().filePath,
            audio: doc.val().audioPath,
            video: doc.val().videoPath,
            createdAt: doc.val().createdAt,
          });
        });
        setMessages(messagesArray);
      });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      console.log('messages: ', messages);
    }
  }, [messages]);

  const scrollToBottomComponent = () => {
    return <Icon name="angle-double-down" size={22} color="#333" />;
  };

  const pickImageDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        copyTo: 'documentDirectory',
        mode: 'import',
        allowMultiSelection: false,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      setImagePath(fileUri);
      setIsAttachImage(true);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker err => ', err);
        throw err;
      }
    }
  };

  const pickFileDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
        mode: 'import',
        allowMultiSelection: false,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      setFilePath(fileUri);
      setIsAttachFile(true);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker err => ', err);
        throw err;
      }
    }
  };

  const pickAudioDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        copyTo: 'documentDirectory',
        mode: 'import',
        allowMultiSelection: false,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      setAudioPath(fileUri);
      setIsAttachAudio(true);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker err => ', err);
        throw err;
      }
    }
  };

  const pickVideoDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        copyTo: 'documentDirectory',
        mode: 'import',
        allowMultiSelection: false,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      setVideoPath(fileUri);
      setIsAttachVideo(true);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker err => ', err);
        throw err;
      }
    }
  };

  // SEND ICONS/DOCUMENTS ICONS FUNCTION
  const renderSend = props => {
    return (
      <View style={{flexDirection: 'row'}}>
        <TouchableOpacity onPress={handleAttachmentPress}>
          <Icon
            name="paperclip"
            style={{
              marginTop: 5,
              marginRight: 10,
              transform: [{rotateY: '180deg'}],
              borderRadius: 5,
              padding: 5,
            }}
            size={25}
            color="black"
          />
        </TouchableOpacity>

        <Send {...props} containerStyle={{justifyContent: 'center'}}>
          <View>
            <Icon
              name="arrow-alt-circle-right"
              style={{
                marginBottom: 3,
                marginRight: 10,
                color: 'black',
              }}
              size={25}
            />
          </View>
        </Send>
      </View>
    );
  };

  // ADD FUNCTION TO VIEW FILE BEFORE SENDING IT
  const renderChatFooter = useCallback(() => {
    if (imagePath) {
      return (
        <View style={{backgroundColor: 'white'}}>
          <Image source={{uri: imagePath}} style={{height: 75, width: 75}} />
          <TouchableOpacity
            onPress={() => setImagePath('')}
            style={{backgroundColor: 'white', justifyContent: 'center'}}>
            <Text
              style={{color: 'black', padding: 10, backgroundColor: 'grey'}}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filePath) {
      return (
        <View style={{backgroundColor: 'white'}}>
          <View style={{marginBottom: 65, padding: 0}}>
            <InChatFileTransfer filePath={filePath} />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFilePath('');
              setAudioPath('');
              setImagePath('');
              setVideoPath('');
            }}
            style={{backgroundColor: 'white', justifyContent: 'center'}}>
            <Text
              style={{color: 'black', padding: 10, backgroundColor: 'grey'}}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (audioPath) {
      return (
        <View style={{backgroundColor: 'white'}}>
          <View style={{marginBottom: 65, padding: 0}}>
            <InChatFileTransfer filePath={audioPath} />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFilePath('');
              setAudioPath('');
              setImagePath('');
              setVideoPath('');
            }}
            style={{backgroundColor: 'white', justifyContent: 'center'}}>
            <Text
              style={{color: 'black', padding: 10, backgroundColor: 'grey'}}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (videoPath) {
      return (
        <View style={{backgroundColor: 'white'}}>
          <View style={{marginBottom: 65, padding: 0}}>
            <InChatFileTransfer filePath={videoPath} />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFilePath('');
              setAudioPath('');
              setImagePath('');
              setVideoPath('');
            }}
            style={{backgroundColor: 'white', justifyContent: 'center'}}>
            <Text
              style={{color: 'black', padding: 10, backgroundColor: 'grey'}}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [filePath, imagePath, audioPath, videoPath]);

  // ADDING CHATS TO DATABASE
  const onSend = useCallback(
    (messages = []) => {
      console.log('Message: ', messages);
      const [messageToSend] = messages;
      const createdTime = new Date();
      console.log('TIME: ', createdTime);
      if (isAttachImage) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          user: {
            _id: 2,
            avatar: '',
          },
          image: imagePath,
          file: '',
          audio: '',
          video: '',
          createdAt: createdTime,
        };
        console.log('Document attached: ', newMessage);
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, text, user, createdAt} = messages[0];
        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          imagePath: imagePath,
          createdAt: createdTime,
        }).then(() => {
          console.log('Chat added!');
        });
        setImagePath('');
        setIsAttachImage(false);
      } else if (isAttachFile) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          user: {
            _id: 2,
            avatar: '',
          },
          image: '',
          file: filePath,
          audio: '',
          video: '',
          createdAt: createdTime,
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          filePath: filePath,
          createdAt: createdTime,
        }).then(() => {
          console.log('Chat added!');
        });
        setFilePath('');
        setIsAttachFile(false);
      } else if (isAttachAudio) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          user: {
            _id: 2,
            avatar: '',
          },
          image: '',
          audio: audioPath,
          file: '',
          video: '',
          createdAt: createdTime,
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          audioPath: audioPath,
          createdAt: createdTime,
        }).then(() => {
          console.log('Chat added!');
        });
        setAudioPath('');
        setIsAttachAudio(false);
      } else if (isAttachVideo) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          user: {
            _id: 2,
            avatar: '',
          },
          image: '',
          video: videoPath,
          audio: '',
          file: '',
          createdAt: createdTime,
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          videoPath: videoPath,
          createdAt: createdTime,
        }).then(() => {
          console.log('Chat added!');
        });
        setVideoPath('');
        setIsAttachVideo(false);
      } else {
        console.log('Text attached:', messages);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, messages),
        );
        const {_id, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          createdAt: createdTime,
        }).then(() => {
          console.log('Chat added!');
        });
      }
    },
    [
      filePath,
      imagePath,
      isAttachFile,
      isAttachImage,
      audioPath,
      isAttachAudio,
      isAttachVideo,
      videoPath,
    ],
  );

  const renderMessageAudio = props => {
    const {currentMessage} = props;

    if (!currentMessage || !currentMessage.audio) {
      return null;
    }

    const playAudio = () => {
      if (!isPlaying) {
        SoundPlayer.playUrl(currentMessage.audio);
        setIsPlaying(true);
      }
    };

    const pauseAudio = () => {
      if (isPlaying) {
        SoundPlayer.pause();
        setIsPlaying(false);
      }
    };

    const seekAudio = value => {
      SoundPlayer.seek(value);
      setCurrentPosition(value);
    };

    if (!currentMessage || !currentMessage.audio) {
      return null;
    }

    return (
      <View
        style={{
          borderRadius: 15,
          overflow: 'hidden',
          backgroundColor: 'white',
          margin: 5,
          padding: 10,
          flexDirection: 'row',
        }}>
        <Image
          source={require('../assets/backImage.png')}
          style={{height: 60, width: 60}}
        />
        <TouchableOpacity
          style={{marginTop: '8%', marginLeft: 10}}
          onPress={isPlaying ? pauseAudio : playAudio}>
          {/* <Text style={{color: 'black'}}>
            {isPlaying ? 'Pause Audio' : 'Play Audio'}
          </Text> */}
          <Icon color="black" size={20} name={isPlaying ? 'pause' : 'play'} />
        </TouchableOpacity>
        <Slider
          style={{width: '55%'}}
          minimumValue={0}
          maximumValue={duration}
          value={currentPosition}
          onSlidingComplete={seekAudio}
          minimumTrackTintColor="#1EB1FC"
          maximumTrackTintColor="#8ED1FC"
          thumbTintColor="#1EB1FC"
        />
      </View>
    );
  };

  const renderMessageVideo = props => {
    const {currentMessage} = props;

    if (!currentMessage || !currentMessage.video) {
      return null;
    }

    return (
      <View
        style={{
          borderRadius: 15,
          overflow: 'hidden',
          backgroundColor: 'white',
          margin: 5,
        }}>
        <Video
          source={{uri: currentMessage.video}}
          style={{width: 200, height: 140}}
          controls={true}
          // resizeMode="cover"
          paused={true}
          resizeMode="stretch"
        />
      </View>
    );
  };

  const renderMessageFile = props => {
    const {currentMessage} = props;
    if (!currentMessage || !currentMessage.file) {
      return null;
    }

    return (
      <TouchableOpacity
        style={{
          width: '50%',
          height: '50%',
          backgroundColor:
            props.currentMessage.user._id === 2 ? '#2e64e5' : '#efefef',
          borderBottomLeftRadius: props.currentMessage.user._id === 2 ? 15 : 5,
          borderBottomRightRadius: props.currentMessage.user._id === 2 ? 5 : 15,
        }}
        onPress={() => navigation.navigate('View', {currentMessage})}>
        <InChatFileTransfer
          style={{marginTop: -10}}
          filePath={currentMessage.file}
        />
        {/* <InChatViewFile
            props={props}
            visible={fileVisible}
            onClose={() => setFileVisible(false)}
          /> */}
        <View style={{flexDirection: 'column'}}>@@ -209,7 +289,78 @@</View>
      </TouchableOpacity>
    );
  };

  // SHOW THE ACTION SHEET
  const handleAttachmentPress = () => {
    actionSheetRef.current?.show();
  };

  return (
    <>
      <View style={{padding: 10}}>
        <Text style={{color: 'black'}}>User Status: {users.status}</Text>
        <Text style={{color: 'black'}}>User Last Login: {users.lastLogin}</Text>
        <Text style={{color: 'black'}}>
          Status of My Login: {logUser.status}
        </Text>
      </View>
      <ImageBackground
        source={require('../assets/pattern.png')}
        style={{flex: 1}}>
        <GiftedChat
          alwaysShowSend
          renderMessageVideo={renderMessageVideo}
          renderMessageAudio={renderMessageAudio}
          renderMessageFile={renderMessageFile}
          renderSend={renderSend}
          renderBubble={props => {
            const {currentMessage} = props;
            if (currentMessage.file) {
              return (
                <TouchableOpacity
                  style={{
                    // width: '50%',
                    // height: '50%',
                    backgroundColor:
                      props.currentMessage.user._id === 2
                        ? 'white'
                        : 'lightgreen',
                    borderBottomLeftRadius:
                      props.currentMessage.user._id === 2 ? 15 : 5,
                    borderBottomRightRadius:
                      props.currentMessage.user._id === 2 ? 5 : 15,
                  }}
                  onPress={() => navigation.navigate('View', {currentMessage})}>
                  <InChatFileTransfer
                    style={{marginTop: -10}}
                    filePath={currentMessage.file}
                  />
                </TouchableOpacity>
              );
            }

            return (
              <Bubble
                {...props}
                wrapperStyle={{
                  right: {backgroundColor: 'lightgreen'},
                }}
                textStyle={{right: {color: 'black'}}}
              />
            );
          }}
          scrollToBottom
          scrollToBottomComponent={scrollToBottomComponent}
          messages={messages}
          showAvatarForEveryMessage={false}
          showUserAvatar={false}
          onSend={messages => onSend(messages)}
          textInputStyle={{
            backgroundColor: '#fff',
            borderRadius: 20,
            color: 'black',
          }}
          renderAvatar={null}
          renderChatFooter={renderChatFooter}
          user={{
            _id: auth?.currentUser?.email,
            avatar:
              'https://imgs.search.brave.com/pZ2DKWjtw7hzsB-caM9l5n5xAr6aaH4tXxJAIMSHK5s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA0Lzk4LzcyLzQz/LzM2MF9GXzQ5ODcy/NDMyM19Gb25BeThM/WVlmRDFCVUMwYmNL/NTZhb1l3dUxISjJH/ZS5qcGc',
          }}
        />
        <ActionSheet
          containerStyle={{backgroundColor: '#2F3645'}}
          ref={actionSheetRef}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: 20,
            }}>
            <TouchableOpacity onPress={pickFileDocument}>
              <View
                style={{
                  backgroundColor: '#36C2CE',
                  borderRadius: 10,
                  padding: 10,
                }}>
                <Icon name="file" size={30} color="white" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImageDocument}>
              <View
                style={{
                  backgroundColor: '#FF4191',
                  borderRadius: 10,
                  padding: 10,
                }}>
                <Icon name="image" size={30} color="white" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideoDocument}>
              <View
                style={{
                  backgroundColor: '#FFF455',
                  borderRadius: 10,
                  padding: 10,
                }}>
                <Icon name="video" size={30} color="white" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickAudioDocument}>
              <View
                style={{
                  backgroundColor: '#667BC6',
                  borderRadius: 10,
                  padding: 10,
                }}>
                <Icon name="file-audio" size={30} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => actionSheetRef.current?.hide()}
            style={{
              height: 100,
              width: '10%',
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>X</Text>
          </TouchableOpacity>
        </ActionSheet>
      </ImageBackground>
    </>
  );
}
