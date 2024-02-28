import { supabase } from "@/config/initSupabase";
import MessagesCard from "@/src/components/MessagesCard";
import RemoteImage from "@/src/components/RemoteImage";
import { ScrollView, View } from "@/src/components/Themed";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Button,
  Platform,
} from "react-native";
import { TextInput } from "react-native";
import { defaultProfileImage } from "../TabFour/UserProfile";
import Spinner from "react-native-loading-spinner-overlay";

interface Message {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
}

interface Chat {
  user_id: string;
}

interface UserData {
  id: string;
  first_name: string;
  second_name: string;
  avatar_url: string;
}

export default function ChatRoom() {
  const { chat_id } = useLocalSearchParams() as { chat_id: string };
  const [isLoading, setIsLoading] = useState(false);
  const [messageData, setMessageData] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [chatData, setChatData] = useState<Chat[]>([]);
  const [hostUserData, setHostUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<UserData | null>(null);
  const currentUser = profileData?.id;
  useEffect(() => {
    async function fetchProfileData() {
      try {
        const user = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.data.user?.id)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setProfileData(data);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data");
        setIsLoading(false);
      }
    }
    if (chat_id) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [chat_id]);

  useEffect(() => {
    const fetchChatById = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_users")
          .select("*")
          .eq("chats_id", chat_id);

        if (error) throw error;
        if (data) setChatData(data);
      } catch (error: any) {
        console.error("Error fetching chat:", error.message);
        return null;
      }
    };
    fetchChatById();
  }, [chat_id]);

  useEffect(() => {
    const fetchHostUserData = async () => {
      try {
        const hostUserChat = chatData.find(
          (user) => user.user_id !== currentUser
        );
        if (hostUserChat) {
          const hostUserId = hostUserChat.user_id;

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", hostUserId)
            .single();
          if (error) {
            throw error;
          }

          if (data) {
            setHostUserData(data);
          }
        }
      } catch (error: any) {
        console.error("Error fetching host user data:", error.message);
      }
    };
    fetchHostUserData();
  }, [profileData]);

  useEffect(() => {
    const fetchMessagesAndChat = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat_id);

      if (error) {
        throw error;
      }
      setMessageData(data);
    };
    fetchMessagesAndChat();
  }, [chat_id]);

  const sendMessage = async () => {
    const msg = message.trim();
    if (msg.length === 0) return;

    const newMessage = {
      chat_id: chat_id,
      author_id: currentUser,
      content: msg,
      created_at: new Date().toISOString(),
    };

    try {
      const { data: insertedMessages, error } = await supabase
        .from("messages")
        .insert([newMessage])
        .select();

      if (error) throw error;
      const insertedMessage = insertedMessages[0];
      if (!insertedMessage?.id) {
        throw new Error("Inserted message does not contain an ID.");
      }
      setMessageData([...messageData, insertedMessage]);
      setMessage("");
      console.log("Message added successfully:", insertedMessage);
    } catch (error: any) {
      console.error("Error adding message:", error.message);
    }
  };

  if (isLoading || !hostUserData) {
    return (
      <>
        <Spinner visible={true} />
        <Stack.Screen options={{ title: "Loading Chat" }} />
      </>
    );
  }
  return (
    <>
      <Stack.Screen
        options={{
          title: `Chatting with: ${hostUserData?.first_name} ${hostUserData?.second_name}`,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <RemoteImage
                path={hostUserData?.avatar_url}
                fallback={defaultProfileImage}
                style={styles.profileImage}
                bucket="avatars"
              />
            </View>
          ),
          headerTitleStyle: {
            fontSize: 18,
          },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={130}
      >
        <ScrollView style={styles.messageContainer}>
          {messageData.map((chat) => (
            <MessagesCard
              key={chat.id}
              chat={chat}
              hostUserData={hostUserData}
            />
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            multiline
            value={message}
            onChangeText={(text) => setMessage(text)}
            placeholder="Type a message"
            style={styles.messageInput}
          />
          <Button
            disabled={message === ""}
            title="Send"
            onPress={sendMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRightContainer: {
    marginRight: 10,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
    backgroundColor: "#fff",
  },
  messageInput: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
  },
  messageContainer: {
    flex: 1,
    padding: 10,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  profileImage: {
    width: 25,
    height: 25,
    alignSelf: "center",
    borderRadius: 125,
    marginBottom: 1,
  },
});
