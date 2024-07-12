import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {TouchableOpacity, View, Image, Text} from 'react-native';
import {GiftedChat, Bubble, Send} from 'react-native-gifted-chat';
// import {
//   collection,
//   addDoc,
//   orderBy,
//   query,
//   onSnapshot,
// } from 'firebase/firestore';
import InChatViewFile from '../components/InChatViewFile';
import InChatFileTransfer from '../components/InChatFileTransfer';
import {signOut} from 'firebase/auth';
import {auth} from '../config/firebase';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as DocumentPicker from 'react-native-document-picker';
import database from '@react-native-firebase/database';
import {getDatabase, set, ref} from 'firebase/database';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isAttachImage, setIsAttachImage] = useState(false);
  const [isAttachFile, setIsAttachFile] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [filePath, setFilePath] = useState('');
  const [users, setUsers] = useState([]);
  const [logUser, setLogUser] = useState([]);

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

    navigation.setOptions({
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
  }, [logUser, navigation]);

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

  const _pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
        mode: 'import',
        allowMultiSelection: true,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      if (fileUri.indexOf('.png') !== -1 || fileUri.indexOf('.jpg') !== -1) {
        setImagePath(fileUri);
        setIsAttachImage(true);
      } else {
        setFilePath(fileUri);
        setIsAttachFile(true);
      }
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
    if (currentMessage.file && currentMessage.file) {
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
    }
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#2e64e5',
          },
        }}
        textStyle={{
          right: {
            color: '#efefef',
          },
        }}
      />
    );
  };

  const renderSend = props => {
    return (
      <View style={{flexDirection: 'row'}}>
        <TouchableOpacity onPress={_pickDocument}>
          <Icon
            name="paperclip"
            style={{
              marginTop: 5,
              marginRight: 10,
              transform: [{rotateY: '180deg'}],
              backgroundColor: 'skyblue',
              borderRadius: 5,
              padding: 5,
            }}
            size={25}
            color="white"
          />
        </TouchableOpacity>

        <Send {...props}>
          <View>
            <Icon
              name="share"
              style={{
                marginBottom: 3,
                marginRight: 10,
                backgroundColor: 'skyblue',
                borderRadius: 5,
                padding: 5,
              }}
              size={25}
              color="white"
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
            onPress={() => setFilePath('')}
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
  }, [filePath, imagePath]);

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
        };
        console.log('Document attached: ', newMessage);
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, createdAt, text, user} = messages[0];
        // addDoc(collection(database, 'chats'), {
        //   _id,
        //   createdAt,
        //   text,
        //   user,
        //   imagePath,
        // });
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
        };
        console.log('Document attached: ', newMessage);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessage),
        );
        const {_id, createdAt, text, user} = messages[0];
        // addDoc(collection(database, 'chats'), {
        //   _id,
        //   createdAt,
        //   text,
        //   user,
        //   filePath,
        // });
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
      } else {
        console.log('Text attached: ', messages);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, messages),
        );
        const {_id, createdAt, text, user} = messages[0];
        // addDoc(collection(database, 'chats'), {
        //   _id,
        //   createdAt,
        //   text,
        //   user,
        // });
        set(ref(getDatabase(), 'chats/' + _id), {
          text: text,
          user: user,
          _id: _id,
        }).then(() => {
          console.log('Chat added!');
        });
      }
      // setMessages([...messages, ...messages]);
    },
    [filePath, imagePath, isAttachFile, isAttachImage],
  );

  return (
    <>
      {/* {messages.map(message => (
        <>
          <Text style={{color: 'black'}} key={message._id}>
            {message.text}
          </Text>
          {message.imagePath ? (
            <Image
              style={{
                width: 50,
                height: 50,
              }}
              source={{uri: message.imagePath}}
            />
          ) : null}
        </>
      ))} */}
      <View style={{padding: 10}}>
        <Text style={{color: 'black'}}>User Status: {users.status}</Text>
        <Text style={{color: 'black'}}>User Last Login: {users.lastLogin}</Text>
        <Text style={{color: 'black'}}>
          Status of My Login: {logUser.status}
        </Text>
      </View>
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
        messagesContainerStyle={{
          backgroundColor: '#fff',
        }}
        textInputStyle={{
          backgroundColor: '#fff',
          borderRadius: 20,
          color: 'black',
        }}
        renderChatFooter={renderChatFooter}
        user={{
          _id: auth?.currentUser?.email,
          avatar:
            'https://imgs.search.brave.com/pZ2DKWjtw7hzsB-caM9l5n5xAr6aaH4tXxJAIMSHK5s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA0Lzk4LzcyLzQz/LzM2MF9GXzQ5ODcy/NDMyM19Gb25BeThM/WVlmRDFCVUMwYmNL/NTZhb1l3dUxISjJH/ZS5qcGc',
        }}
      />
    </>
  );
}
