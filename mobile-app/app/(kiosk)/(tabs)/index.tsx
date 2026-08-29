import { Redirect } from 'expo-router';

export default function KioskHomeRedirect() {
  return <Redirect href="/(kiosk)/(tabs)/home" />;
}
