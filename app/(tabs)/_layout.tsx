import { Tabs } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "휴심컬러",
        }}
      />
      <Tabs.Screen
        name="select"
        options={{
          title: "컬러 선택",
        }}
      />
      <Tabs.Screen
        name="result"
        options={{
          title: "결과",
        }}
      />
    </Tabs>
  );
}
