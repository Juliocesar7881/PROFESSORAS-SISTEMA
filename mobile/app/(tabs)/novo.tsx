import { useApp } from "../../src/providers/AppProvider";
import { NewRecordScreen } from "../../src/screens/NewRecordScreen";

export default function NewRecordRoute() {
  const { token, user, online, turmas, criancas, queueDraft, recordSaved, saveTurma, saveCrianca } = useApp();
  if (!token || !user) return null;

  return (
    <NewRecordScreen
      ownerUserId={user.id}
      online={online}
      turmas={turmas}
      criancas={criancas}
      onSaved={recordSaved}
      onQueue={queueDraft}
      onSaveTurma={saveTurma}
      onSaveCrianca={saveCrianca}
    />
  );
}
