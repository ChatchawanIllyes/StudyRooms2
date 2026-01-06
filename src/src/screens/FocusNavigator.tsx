import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./HomeScreen";
import MyWidgetsScreen from "./MyWidgetsScreen";
import WidgetMarketplaceScreen from "./WidgetMarketplaceScreen";

const Stack = createNativeStackNavigator();

export default function FocusNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MyWidgets" component={MyWidgetsScreen} />
      <Stack.Screen
        name="WidgetMarketplace"
        component={WidgetMarketplaceScreen}
      />
    </Stack.Navigator>
  );
}
