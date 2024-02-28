import React, { useEffect, useState } from "react";
import { fetchChatsByUserID } from "../../../Utils/api";
import { ScrollView, Text, View } from "@/src/components/Themed";
import { Image, StyleSheet } from "react-native";
import { setupSubscription } from "../../../Utils/api";
import ChatCard from "@/src/components/ChatCard";
import { Link } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import Spinner from "react-native-loading-spinner-overlay";

interface Chat {
  id: number;
  users: string[];
}

export default function Messages(): JSX.Element {
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  let chatsWatcher: any;

  const fetchData = async (): Promise<void> => {
    try {
      const fetchedChats: Chat[] = await fetchChatsByUserID();
      setAllChats(fetchedChats);
      setupSubscription(async () => {
        try {
          const updatedChats = await fetchChatsByUserID();
          setAllChats(updatedChats);
        } catch (error: any) {
          setError(error.message);
        }
      });
    } catch (error) {
      setError("Failed to fetch chats");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    navigation.setOptions({ headerShown: false });
  }, []);

  const cleanup = (): void => {
    if (chatsWatcher) {
      chatsWatcher.unsubscribe();
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  // if (isLoading) {
  //   return <Spinner visible={true} />;
  // }
  return (
    <ScrollView>
      <View style={styles.container}>
        <Image
          source={require("../../../../assets/images/profileCover.png")}
          style={styles.coverImage}
        />
        <Text style={styles.title}>Messages</Text>
        <View style={styles.separator} />
        <View style={styles.chatContainer}>
          {allChats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: -250,
  },
  title: {
    bottom: 165,
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    alignSelf: "center",
    justifyContent: "center",
  },
  coverImage: {
    width: 700,
    height: 500,
    top: 10,
    borderRadius: 280,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
    bottom: 190,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chatContainer: {
    flex: 1,
    alignItems: "center",
  },
});
