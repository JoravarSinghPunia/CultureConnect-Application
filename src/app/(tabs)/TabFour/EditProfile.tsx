import { useEffect, useState } from "react";
import { supabase } from "@/config/initSupabase";
import { ScrollView, Text, TextInput, View } from "@/src/components/Themed";
import { Alert, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { decode } from "base64-arraybuffer";
import { Button } from "react-native-paper";
import { ActivityIndicator } from "react-native";
import { Stack } from "expo-router";

interface ProfileUpdates {
  first_name?: string;
  second_name?: string;
  bio?: string;
  avatar_url?: string;
}

export default function EditProfile() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [updates, setUpdates] = useState<ProfileUpdates>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const user = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, second_name, bio")
            .eq("id", user.data.user?.id)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setFirstName(data.first_name || "");
            setSecondName(data.second_name || "");
            setBio(data.bio || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user profile", error);
        Alert.alert("Error", "Failed to fetch user profile");
      }
    }

    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (user) {
        const updatedData: ProfileUpdates = {};

        if (firstName.trim() !== "") {
          updatedData.first_name = firstName.trim();
        }
        if (secondName.trim() !== "") {
          updatedData.second_name = secondName.trim();
        }
        if (bio.trim() !== "") {
          updatedData.bio = bio.trim();
        }
        if (image) {
          const imageData = await uploadImage();
          updatedData.avatar_url = imageData;
        }

        if (Object.keys(updatedData).length === 0) {
          throw new Error("No data to update");
        }

        const { data, error } = await supabase
          .from("profiles")
          .update(updatedData)
          .eq("id", user.data.user?.id);

        if (error) {
          throw error;
        }
        Alert.alert("Success", "Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image?.startsWith("file://")) {
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(image, {
      encoding: "base64",
    });
    const filePath = `${randomUUID()}`;
    const contentType = "image/*";
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, decode(base64), { contentType });

    if (data) {
      return data.path;
    }
    console.log(error, "error");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <Stack.Screen options={{ title: "Edit Profile" }} />

      <View style={styles.container}>
        <Text>First Name</Text>
        <TextInput
          style={styles.inputField}
          value={firstName}
          onChangeText={setFirstName}
        />
        <Text>Second Name</Text>
        <TextInput
          style={styles.inputField}
          value={secondName}
          onChangeText={setSecondName}
        />
        <Text>Bio</Text>
        <TextInput
          style={styles.inputField}
          value={bio}
          onChangeText={setBio}
        />
        <Button style={styles.button} onPress={pickImage} mode="contained">
          Change profile picture
        </Button>
        <View style={styles.previewImage}>
          {image && (
            <Image
              source={{ uri: image }}
              style={{ width: 200, height: 200 }}
            />
          )}
        </View>
        <Button
          style={styles.button}
          onPress={handleUpdateProfile}
          mode="contained"
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : "Update Profile"}
        </Button>
      </View>
      <View style={styles.overlayImages}>
        <Image
          source={require("../../../../assets/images/profileCover.png")}
          style={styles.coverImageOne}
        />
        <Image
          source={require("../../../../assets/images/profileCover.png")}
          style={styles.coverImageTwo}
        />
        <Image
          source={require("../../../../assets/images/profileCover.png")}
          style={styles.coverImageThree}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "gray",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: -1000,
  },
  container: {
    flex: 1,
    paddingTop: 20,
    padding: 20,
    zIndex: 1,
    backgroundColor: "transparent",
    top: 100,
  },
  previewImage: {
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    alignSelf: "center",
    marginBottom: 30,
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: "80%",
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
  button: {
    marginVertical: 15,
    alignItems: "center",
  },
  coverImageOne: {
    width: 700,
    height: 500,
    top: -400,
    left: 250,
    borderRadius: 280,
  },
  coverImageTwo: {
    width: 200,
    height: 200,
    top: -350,
    right: 100,
    transform: [{ scaleX: -1 }],
    borderRadius: 100,
  },
  coverImageThree: {
    width: 700,
    height: 500,
    left: -50,
    transform: [{ scaleX: -1 }, { rotate: "90deg" }],
    borderRadius: 1000,
    top: -150,
  },
  overlayImages: {
    top: 100,
    position: "absolute",
  },
});
