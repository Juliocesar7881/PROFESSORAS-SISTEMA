"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const removeAccount = async () => {
    if (confirmation !== "EXCLUIR" || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Não foi possível excluir a conta.");
      toast.success("Conta e dados excluídos.");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a conta.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-7 rounded-xl border border-[#f2cbd5] bg-[#fff7f9] p-4">
      <label htmlFor="delete-confirmation" className="text-sm font-black text-[#17213f]">
        Digite <span className="text-[#c44461]">EXCLUIR</span> para confirmar
      </label>
      <input
        id="delete-confirmation"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value.toLocaleUpperCase("pt-BR"))}
        autoComplete="off"
        spellCheck={false}
        className="pf-input mt-2 h-11"
        placeholder="EXCLUIR"
      />
      <Button
        type="button"
        variant="destructive"
        onClick={() => void removeAccount()}
        disabled={confirmation !== "EXCLUIR" || submitting}
        className="mt-3 w-full"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Excluir permanentemente
      </Button>
    </div>
  );
}
