import {
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ScrollView, Text, View } from "@/src/components/Themed";
import EventsList from "@/src/components/EventsList";
import { Link, router } from "expo-router";
import { Button } from "react-native-paper";
import { useState } from "react";

export default function Homepage() {
  const [refreshing, setRefreshing] = useState(false);

  function viewMap() {
    router.navigate("/(tabs)/Home/Map");
  }

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        {refreshing && (
          <ActivityIndicator size="large" color="#fff" style={styles.refresh} />
        )}
        <Image
          source={require("../../../../assets/images/profileCover.png")}
          style={styles.coverImage}
        />
        <Text style={[styles.title, { zIndex: 1 }]}>Home</Text>
        <View style={styles.separator} />
        <Button mode="contained" onPress={viewMap} style={styles.map}>
          Map View
        </Button>

        <View style={styles.listContainer}>
          <EventsList />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
    minHeight: "100%",
    marginBottom: -340,
  },
  refresh: {
    zIndex: 1,
    position: "absolute",
    top: 35,
    left: "50%",
    marginLeft: -20,
  },
  listContainer: {
    top: -350,
    marginTop: 20,
  },
  title: {
    color: "white",
    bottom: 415,
    fontSize: 30,
    fontWeight: "bold",
    alignSelf: "center",
    justifyContent: "center",
  },
  map: {
    marginVertical: 10,
    top: -385,
  },
  coverImage: {
    top: -240,
    width: 700,
    height: 500,
    borderRadius: 280,
  },
  separator: {
    marginTop: 30,
    marginBottom: -25,
    height: 1,
    width: "80%",
    top: -440,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
