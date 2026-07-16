import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { NotifBanner } from '../../components/NotifBanner';
import { colors, fonts } from '../../theme/tokens';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NotifBanner />
      <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: 'Paspor Petani',
        headerStyle: { backgroundColor: colors.cover },
        headerTintColor: colors.onCover,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 20 },
        tabBarActiveTintColor: colors.cover,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontFamily: fonts.uiMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lapangan',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="leaf" color={color} />,
        }}
      />
      <Tabs.Screen
        name="kartu"
        options={{
          title: 'Kartu',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="id-card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rantai"
        options={{
          title: 'Rantai',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="link" color={color} />,
        }}
      />
      <Tabs.Screen
        name="izin"
        options={{
          title: 'Izin',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="shield-checkmark" color={color} />,
        }}
      />
      </Tabs>
    </View>
  );
}
