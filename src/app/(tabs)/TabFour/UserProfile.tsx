import { StyleSheet, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { Text, View, ScrollView } from "@/src/components/Themed";
import { Image } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/config/initSupabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Loading from "@/src/components/Loading";
import RemoteImage from "@/src/components/RemoteImage";
import { Button } from "react-native-paper";

export const defaultProfileImage =
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
interface ProfileData {
  avatar_url: string;
  first_name: string;
  second_name: string;
  email: string;
  bio: string;
}

export default function ProfileDataScreen() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    navigation.setOptions({ headerShown: false });
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
      }
    }

    fetchProfileData();
  }, []);

  const goToEditProfile = () => {
    router.navigate(`/TabFour/EditProfile`);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading />
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <Image
          source={require("../../../../assets/images/profileCover.png")}
          style={styles.coverImage}
        />
        <Text style={[styles.viewProfileText, { zIndex: 1 }]}> My Profile</Text>
        <RemoteImage
          path={profileData?.avatar_url}
          fallback={defaultProfileImage}
          style={styles.profileImage}
          bucket="avatars"
        />
        <Text style={styles.name}>
          {profileData?.first_name} {profileData?.second_name}
        </Text>
        <Text style={styles.bio}>{profileData?.bio}</Text>
        <Text style={styles.profileData}>{profileData?.email}</Text>
        <Button
          mode="contained"
          onPress={goToEditProfile}
          style={styles.editProfile}
        >
          Edit Profile
        </Button>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: -250,
    marginBottom: -75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImage: {
    width: 700,
    height: 500,
    top: 10,
    borderRadius: 280,
  },
  viewProfileText: {
    bottom: 190,
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    alignSelf: "center",
    justifyContent: "center",
  },
  editProfile: {
    marginTop: 10,
    marginBottom: 10,
    top: -140,
  },
  profileData: {
    padding: 10,
    fontSize: 18,
    top: -140,
    marginBottom: 30,
  },
  bio: {
    padding: 20,
    fontSize: 20,
    top: -140,
    fontWeight: "bold",
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
  },
  name: {
    fontSize: 40,
    fontWeight: "bold",
    top: -140,
    marginBottom: 20,
  },
  profileImage: {
    width: 225,
    height: 225,
    alignSelf: "center",
    borderRadius: 125,
    top: -140,
    marginBottom: 20,
  },
  signOut: {
    padding: 15,
    top: -135,
    backgroundColor: "#50C878",
    borderRadius: 25,
  },
  signOutText: {
    color: "white",
    fontWeight: "500",
  },
});
