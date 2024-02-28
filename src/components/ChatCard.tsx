import React, { useEffect, useState } from "react";
import { Button, Card, Text } from "react-native-paper";
import { fetchDataAndSetProfileData, getChatUserNames } from "../Utils/api";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/config/initSupabase";
import Spinner from "react-native-loading-spinner-overlay";
import { View } from "./Themed";

interface Chat {
  id: number;
  users: string[];
}

interface ProfileData {
  avatar_url: string;
  first_name: string;
  second_name: string;
  email: string;
  bio: string;
}

interface Props {
  chat: Chat;
}

export default function ChatCard({ chat }: Props): JSX.Element {
  const [profileData, setProfileData] = useState<ProfileData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { users } = chat;
  const userIds = getChatUserNames(users);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching current user:", error.message);
        return;
      }
      setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchDataAndSetProfileData(userIds, setProfileData)
      .then(() => setIsLoading(false))
      .catch((error) => {
        console.error(
          "Error fetching and setting profile data:",
          error.message
        );
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!currentUser || profileData.length === 0) return;

    const currentUserProfile = profileData.find(
      (profile) => profile.email === currentUser.email
    );
    if (!currentUserProfile) return;

    const otherUserProfile = profileData.find(
      (profile) => profile.email !== currentUser.email
    );
    if (!otherUserProfile) return;

    setOtherUser(
      `${otherUserProfile.first_name} ${otherUserProfile.second_name}`
    );
  }, [currentUser, profileData]);

  if (isLoading) {
    return <Spinner visible={true} />;
  }

  return (
    <View style={styles.chatContainer}>
      <Link href={`/(tabs)/TabTwo/${chat.id}`}>
        <Card style={{ marginBottom: 10, padding: 10, width: 300 }}>
          <Card.Content style={{}}>
            <Text variant="bodyMedium">Chat with: {otherUser}</Text>
          </Card.Content>
        </Card>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
  chatContainer: {
    marginVertical: 5
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
