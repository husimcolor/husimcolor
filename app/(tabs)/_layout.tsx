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
      <Tabs.Screen
        name="reviews"
        options={{
          title: "후기",
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: "결제",
          href: null,
        }}
      />
      <Tabs.Screen
        name="premium-select"
        options={{
          title: "심화 카드 선택",
          href: null,
        }}
      />
      <Tabs.Screen
        name="premium-result"
        options={{
          title: "심화 결과",
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "관리자",
          href: null,
        }}
      />
    </Tabs>
  );
}
