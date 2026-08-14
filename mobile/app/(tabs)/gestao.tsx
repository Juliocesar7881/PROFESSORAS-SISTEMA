import { useApp } from "../../src/providers/AppProvider";
import { ManagementScreen } from "../../src/screens/ManagementScreen";

export default function ManagementRoute() {
  const { token, turmas, criancas, refreshBase } = useApp();
  if (!token) return null;

  return <ManagementScreen token={token} turmas={turmas} criancas={criancas} onChanged={refreshBase} />;
}
