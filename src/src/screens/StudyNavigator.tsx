import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TimerScreen from "./TimerScreen";
import StatsScreen from "./StatsScreen";
import TasksScreen from "./TasksScreen";

const Stack = createNativeStackNavigator();

export default function StudyNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="Timer" component={TimerScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
    </Stack.Navigator>
  );
}
