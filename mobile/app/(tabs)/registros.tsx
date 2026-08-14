import { useRouter } from "expo-router";

import { useApp } from "../../src/providers/AppProvider";
import { RecordsScreen } from "../../src/screens/RecordsScreen";

export default function RecordsRoute() {
  const router = useRouter();
  const { token, user, online, turmas, criancas, pendingPhotos, refreshKey, queueRecordMutation } = useApp();
  if (!token || !user) return null;

  return (
    <RecordsScreen
      token={token}
      ownerUserId={user.id}
      online={online}
      turmas={turmas}
      criancas={criancas}
      pendingPhotos={pendingPhotos}
      refreshKey={refreshKey}
      onOpen={(id) => router.push({ pathname: "/registro/[id]", params: { id } })}
      onQueueMutation={queueRecordMutation}
    />
  );
}
