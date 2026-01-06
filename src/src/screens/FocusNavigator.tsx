import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./HomeScreen";
import MyWidgetsScreen from "./MyWidgetsScreen";
import WidgetMarketplaceScreen from "./WidgetMarketplaceScreen";
import PlaceWidgetScreen from "./PlaceWidgetScreen";
import TimerScreen from "./TimerScreen";
import TasksScreen from "./TasksScreen";
import StatsScreen from "./StatsScreen";

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
      <Stack.Screen name="PlaceWidget" component={PlaceWidgetScreen} />
      <Stack.Screen
        name="WidgetMarketplace"
        component={WidgetMarketplaceScreen}
      />
      <Stack.Screen name="Timer" component={TimerScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
    </Stack.Navigator>
  );
}
