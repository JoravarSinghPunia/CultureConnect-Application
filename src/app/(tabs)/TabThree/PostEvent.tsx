import { useCallback, useEffect, useState } from "react";
import React from "react";
import Spinner from "react-native-loading-spinner-overlay";
import { supabase } from "@/config/initSupabase";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from "react-native";
import { Button } from "react-native-paper";
import {
  DatePickerInput,
  TimePickerModal,
  enGB,
  registerTranslation,
} from "react-native-paper-dates";
registerTranslation("en-GB", enGB);
import { Text, View, ScrollView, TextInput } from "@/src/components/Themed";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { decode } from "base64-arraybuffer";
import { Stack } from "expo-router";

export default function PostEvent() {
  const [title, setTitle] = useState<string>("");
  const [postcode, setPostcode] = useState<string>("");
  const [postcodeError, setPostcodeError] = useState<boolean>(false);
  const [locationObject, setLocationObject] = useState<object | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [maxAttendees, setMaxAttendees] = useState<string | undefined>(
    undefined
  );
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [hostId, setHostId] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputDate, setInputDate] = useState<Date | undefined>(undefined);
  const [visible, setVisible] = useState<boolean>(false);
  const [timeHours, setTimeHours] = useState<number>(0);
  const [timeMinutes, setTimeMinutes] = useState<number>(0);
  const [file, setFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const router = useRouter();
  const theme = useColorScheme();

  const fetchData = async () => {
    const user = await supabase.auth.getUser();
    setHostId(user.data.user?.id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPostcodeError(false);
    geoCode();
  }, [postcode]);

  const handleSubmit = () => {
    setLoading(true);
    setIsError(false);
    uploadImage()
      .then((imagePath) => {
        date?.setHours(timeHours);
        date?.setMinutes(date.getMinutes() + timeMinutes);
        if (isNaN(Number(maxAttendees))) {
          setMaxAttendees(undefined);
        }
        if (description?.length === 0) {
          setDescription(undefined);
        }
        if (imagePath?.length === 0) {
          setImage(undefined);
        } else {
          setImage(imagePath);
        }
        const newEvent = {
          title: title,
          address: `${address}, ${postcode}`,
          location: locationObject,
          date: date,
          host_id: hostId,
          max_attendees: maxAttendees,
          description: description,
          image: image,
        };
        return supabase.from("events").insert([newEvent]).select();
      })
      .then((result) => {
        if (result.error) {
          setLoading(false);
          setIsError(true);
        } else {
          setLoading(false);
          router.navigate("/TabThree/MyEvents");
        }
      });
  };

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const onConfirm = useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setVisible(false);
      setTimeHours(hours);
      if (minutes < 1) {
        setTimeMinutes(0);
      } else {
        setTimeMinutes(minutes);
      }
    },
    [setVisible]
  );

  const onDateChange = useCallback(
    (dateData: Date | undefined) => {
      setInputDate(dateData);
      setDate(dateData);
    },
    [setInputDate, setDate]
  );

  const uploadImage = async () => {
    if (!file?.startsWith("file://")) {
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(file, {
      encoding: "base64",
    });
    const filePath = `${randomUUID()}`;
    const contentType = "image/*";
    const { data, error } = await supabase.storage
      .from("event_images")
      .upload(filePath, decode(base64), { contentType });

    if (data) {
      return data.path;
    }
    console.log(error, "error");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        `Sorry, we need camera  
            roll permission to upload images.`
      );
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFile(result.assets[0].uri);
        setError(null);
      }
    }
  };

  const geoCode = async () => {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${postcode}`
    );
    const locationData = await response.json();
    if (!locationData.error) {
      setLocationObject({
        latitude: locationData.result.latitude,
        longitude: locationData.result.longitude,
      });
    } else {
      setPostcodeError(true);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: "Host Event" }} />
      <View style={[styles.container, { display: "flex" }]}>
        <Spinner visible={loading} />

        <Text style={[styles.header, { margin: 5 }]}>Host an Event!</Text>
        {isError ? (
          <Text style={[styles.label, { color: "red" }]}>
            Ensure all required fields are completed!
          </Text>
        ) : null}
        <Text style={[styles.label, { color: "red" }]}>
          Title, location, date, and time are required.
        </Text>
        <View style={styles.updatedContainer}>
          <TextInput
            placeholder="Event Title"
            placeholderTextColor={theme === "dark" ? "#d3d3d3" : "#666666"}
            value={title}
            onChangeText={setTitle}
            style={styles.inputField}
          />
        </View>
        <View style={styles.updatedContainer}>
          <TextInput
            placeholder="Address"
            placeholderTextColor={theme === "dark" ? "#d3d3d3" : "#666666"}
            value={address}
            onChangeText={setAddress}
            style={styles.inputField}
          />
        </View>
        <View style={styles.updatedContainer}>
          <TextInput
            placeholder="Postcode"
            placeholderTextColor={theme === "dark" ? "#d3d3d3" : "#666666"}
            value={postcode}
            onChangeText={setPostcode}
            style={styles.inputField}
          />
          {postcodeError ? (
            <Text style={[styles.label, { color: "red" }]}>
              Please enter a valid postcode
            </Text>
          ) : null}
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            backgroundColor: "transparent",
            maxHeight: 70,
          }}
        >
          <DatePickerInput
            withDateFormatInLabel={false}
            presentationStyle="pageSheet"
            locale="en-GB"
            placeholder="DD/MM/YYYY"
            placeholderTextColor={theme === "dark" ? "#d3d3d3" : "#666666"}
            value={inputDate}
            onChange={onDateChange}
            inputMode="start"
            style={{ width: 180, ...styles.updatedContainer }}
            mode="outlined"
          />
          <View
            style={{
              justifyContent: "center",
              flex: 1,
              alignItems: "center",
              backgroundColor: "transparent",
              marginLeft: 115,
              marginBottom: 10,
            }}
          >
            <Text style={{ marginBottom: 5, marginTop: 5 }}>
              Time: {timeHours < 10 ? `0${timeHours}` : timeHours}:
              {timeMinutes < 10 ? `0${timeMinutes}` : timeMinutes}
            </Text>
            <Button
              onPress={() => setVisible(true)}
              uppercase={false}
              mode="contained"
              style={{
                height: 40,
              }}
            >
              Pick time
            </Button>
            <TimePickerModal
              visible={visible}
              onDismiss={onDismiss}
              onConfirm={onConfirm}
              hours={0}
              minutes={0}
            />
          </View>
        </View>
        <View style={styles.updatedContainer}>
          <TextInput
            placeholder="Max attendees"
            placeholderTextColor={theme === "dark" ? "#d3d3d3" : "#666666"}
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            style={styles.maxAttendeesInput}
          />
        </View>
        <View style={styles.updatedContainer}>
          <TextInput
            placeholder="Description"
            placeholderTextColor={theme === "dark" ? "#d3d3d3" : "#666666"}
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.descriptionInput}
          />
        </View>
        <View style={styles.buttonContainer}>
          {file ? (
            <View style={[styles.imageContainer, { maxWidth: 150 }]}>
              <Image source={{ uri: file }} style={styles.image} />
            </View>
          ) : (
            <Text style={styles.errorText}>{error}</Text>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              { height: 50, width: 150, alignSelf: "flex-end" },
            ]}
            onPress={pickImage}
          >
            <Text style={styles.buttonText}>Choose Image</Text>
          </TouchableOpacity>
        </View>
        <Button
          children="Submit"
          mode="contained"
          style={{ bottom: 45 }}
          onPress={handleSubmit}
        ></Button>
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
  container: {
    flex: 1,
    paddingTop: 20,
    padding: 20,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  header: {
    fontSize: 30,
    textAlign: "center",
    margin: 50,
  },
  inputField: {
    marginVertical: 10,
    marginBottom: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 5,
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  inputContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  button: {
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    position: "relative",
    backgroundColor: "#2b825b",
    padding: 12,
    borderRadius: 4,
    top: -45,
    left: -100,
  },
  buttonText: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 16,
  },
  imageContainer: {
    borderRadius: 8,
    marginBottom: 10,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    marginTop: 16,
  },
  maxAttendeesInput: {
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
    height: 50,
    width: 350,
    overflow: "scroll",
    borderWidth: 1,

    borderRadius: 4,
    padding: 5,
  },
  descriptionInput: {
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
    height: 125,
    width: 350,
    overflow: "scroll",
    borderWidth: 1,

    borderRadius: 4,
    padding: 5,
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
  updatedContainer: {
    backgroundColor: "transparent",
  },
});
