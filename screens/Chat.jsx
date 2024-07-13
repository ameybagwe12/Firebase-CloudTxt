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
import InChatFileTransfer from '../components/InChatFileTransfer';
import {signOut} from 'firebase/auth';
import {auth} from '../config/firebase';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as DocumentPicker from 'react-native-document-picker';
import database from '@react-native-firebase/database';
import {getDatabase, set, ref} from 'firebase/database';
import Video from 'react-native-video';

export default function Chat() {
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
  const actionSheetRef = useRef(null);

  const navigation = useNavigation();

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
            createdAt: new Date(doc.val().createdAt), // Ensure createdAt is converted to Date object if it's a timestamp
            text: doc.val().text,
            user: doc.val().user,
            image: doc.val().imagePath,
            file: doc.val().filePath,
            audio: doc.val().audioPath,
            video: doc.val().videoPath,
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

  const renderBubble = props => {
    const {currentMessage} = props;
    console.log('Current: ', currentMessage);
    if (currentMessage.file) {
      return (
        <TouchableOpacity
          style={{
            width: '50%',
            height: '50%',
            backgroundColor:
              props.currentMessage.user._id === 2 ? '#2e64e5' : '#efefef',
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
          {/* <InChatViewFile
            props={props}
            visible={fileVisible}
            onClose={() => setFileVisible(false)}
          /> */}
          <View style={{flexDirection: 'column'}}>
            <Text
              style={{
                width: '50%',
                height: '50%',
                color: currentMessage.user._id === 2 ? 'white' : 'black',
              }}>
              {currentMessage.text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (currentMessage.audio) {
      return (
        <TouchableOpacity
          style={{
            width: '50%',
            height: '50%',
            backgroundColor:
              props.currentMessage.user._id === 2 ? '#2e64e5' : '#efefef',
            borderBottomLeftRadius:
              props.currentMessage.user._id === 2 ? 15 : 5,
            borderBottomRightRadius:
              props.currentMessage.user._id === 2 ? 5 : 15,
          }}
          onPress={() => navigation.navigate('View', {currentMessage})}>
          <InChatFileTransfer
            style={{marginTop: -10}}
            filePath={currentMessage.audio}
          />
          {/* <InChatViewFile
            props={props}
            visible={fileVisible}
            onClose={() => setFileVisible(false)}
          /> */}
          <View style={{flexDirection: 'column'}}>
            <Text
              style={{
                width: '50%',
                height: '50%',
                color: currentMessage.user._id === 2 ? 'white' : 'black',
              }}>
              {currentMessage.text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (currentMessage.video) {
      return (
        <TouchableOpacity
          style={{
            width: '50%',
            height: '50%',
            backgroundColor:
              props.currentMessage.user._id === 2 ? '#2e64e5' : '#efefef',
            borderBottomLeftRadius:
              props.currentMessage.user._id === 2 ? 15 : 5,
            borderBottomRightRadius:
              props.currentMessage.user._id === 2 ? 5 : 15,
          }}
          onPress={() => navigation.navigate('View', {currentMessage})}>
          <InChatFileTransfer
            style={{marginTop: -10}}
            filePath={currentMessage.video}
          />
          {/* <InChatViewFile
            props={props}
            visible={fileVisible}
            onClose={() => setFileVisible(false)}
          /> */}
          <View style={{flexDirection: 'column'}}>
            <Text
              style={{
                width: '50%',
                height: '50%',
                color: currentMessage.user._id === 2 ? 'white' : 'black',
              }}>
              {currentMessage.text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#DEF9C4',
          },
        }}
        textStyle={{
          right: {
            color: 'black',
          },
        }}
      />
    );
  };

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

  // add a function to view your file picked before click send it
  const renderChatFooter = useCallback(() => {
    if (imagePath) {
      return (
        <View style={{backgroundColor: 'yellow'}}>
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
        <View style={{backgroundColor: 'yellow'}}>
          <View style={{paddingVertical: 50, marginBottom: 20}}>
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
        <View style={{backgroundColor: 'yellow'}}>
          <View style={{paddingVertical: 50, marginBottom: 20}}>
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
        <View style={{backgroundColor: 'yellow'}}>
          <View style={{paddingVertical: 50, marginBottom: 20}}>
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

  const onSend = useCallback(
    (messages = []) => {
      console.log('Message: ', messages);
      const [messageToSend] = messages;
      if (isAttachImage) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          createdAt: new Date(),
          user: {
            _id: 2,
            avatar: '',
          },
          image: imagePath,
          file: '',
          audio: '',
          video: '',
        };
        console.log('Document attached: ', newMessage);
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, createdAt, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          imagePath: imagePath,
        }).then(() => {
          console.log('Chat added!');
        });
        setImagePath('');
        setIsAttachImage(false);
      } else if (isAttachFile) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          createdAt: new Date(),
          user: {
            _id: 2,
            avatar: '',
          },
          image: '',
          file: filePath,
          audio: '',
          video: '',
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, createdAt, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          filePath: filePath,
        }).then(() => {
          console.log('Chat added!');
        });
        setFilePath('');
        setIsAttachFile(false);
      } else if (isAttachAudio) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          createdAt: new Date(),
          user: {
            _id: 2,
            avatar: '',
          },
          image: '',
          audio: audioPath,
          file: '',
          video: '',
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, createdAt, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          audioPath: audioPath,
        }).then(() => {
          console.log('Chat added!');
        });
        setAudioPath('');
        setIsAttachAudio(false);
      } else if (isAttachVideo) {
        const newMessage = {
          _id: messages[0]._id + 1,
          text: messageToSend.text,
          createdAt: new Date(),
          user: {
            _id: 2,
            avatar: '',
          },
          image: '',
          video: videoPath,
          audio: '',
          file: '',
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, createdAt, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
          videoPath: videoPath,
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
        const {_id, createdAt, text, user} = messages[0];

        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
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

  const handleAttachmentPress = () => {
    actionSheetRef.current?.show();
  };

  return (
    <>
      <ImageBackground
        source={require('../assets/pattern.png')}
        style={{flex: 1}}>
        <GiftedChat
          alwaysShowSend
          renderSend={renderSend}
          scrollToBottom
          scrollToBottomComponent={scrollToBottomComponent}
          renderBubble={renderBubble}
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
