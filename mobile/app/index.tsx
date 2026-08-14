import { Redirect } from "expo-router";

import { useApp } from "../src/providers/AppProvider";

export default function IndexScreen() {
  const { token } = useApp();
  return <Redirect href={token ? "/(tabs)/novo" : "/(auth)/login"} />;
}
