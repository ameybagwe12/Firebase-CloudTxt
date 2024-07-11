import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {TouchableOpacity, View, Image, Text} from 'react-native';
import {GiftedChat, Bubble, Send} from 'react-native-gifted-chat';
import {
  collection,
  addDoc,
  orderBy,
  query,
  onSnapshot,
} from 'firebase/firestore';
import InChatViewFile from '../components/InChatViewFile';
import InChatFileTransfer from '../components/InChatFileTransfer';
import {signOut} from 'firebase/auth';
import {auth, database} from '../config/firebase';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as DocumentPicker from 'react-native-document-picker';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isAttachImage, setIsAttachImage] = useState(false);
  const [isAttachFile, setIsAttachFile] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileVisible, setFileVisible] = useState(false);

  const navigation = useNavigation();

  const onSignOut = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
  };

  useLayoutEffect(() => {
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
  }, [navigation]);

  useLayoutEffect(() => {
    const collectionRef = collection(database, 'chats');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      console.log('querySnapshot unsusbscribe');
      setMessages(
        querySnapshot.docs.map(doc => ({
          _id: doc.data()._id,
          createdAt: doc.data().createdAt.toDate(),
          text: doc.data().text,
          user: doc.data().user,
          image: doc.data().imagePath,
          file: doc.data().filePath,
        })),
      );
      if (messages) {
        console.log('messages: ', messages);
      }
    });
    return unsubscribe;
  }, []);

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
          onPress={() => setFileVisible(true)}>
          <InChatFileTransfer
            style={{marginTop: -10}}
            filePath={currentMessage.file}
          />
          <InChatViewFile
            props={props}
            visible={fileVisible}
            onClose={() => setFileVisible(false)}
          />
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
        addDoc(collection(database, 'chats'), {
          _id,
          createdAt,
          text,
          user,
          imagePath,
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
        addDoc(collection(database, 'chats'), {
          _id,
          createdAt,
          text,
          user,
          filePath,
        });
        setFilePath('');
        setIsAttachFile(false);
      } else {
        console.log('Text attached: ', messages);

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, messages),
        );
        const {_id, createdAt, text, user} = messages[0];
        addDoc(collection(database, 'chats'), {
          _id,
          createdAt,
          text,
          user,
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
