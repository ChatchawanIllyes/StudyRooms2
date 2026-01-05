import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyRoomsScreen from "./MyRoomsScreen";
import JoinRoomScreen from "./JoinRoomScreen";
import CreateRoomScreen from "./CreateRoomScreen";

const Stack = createNativeStackNavigator();

export default function RoomsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="MyRooms" component={MyRoomsScreen} />
      <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
    </Stack.Navigator>
  );
}
