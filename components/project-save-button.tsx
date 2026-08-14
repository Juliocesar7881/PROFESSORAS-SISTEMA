"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface ProjectSaveButtonProps {
  projectId: string;
  initialSaved: boolean;
  disabled?: boolean;
}

export function ProjectSaveButton({ projectId, initialSaved, disabled = false }: ProjectSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (disabled) {
      toast.info("Conecte o banco para salvar favoritos.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/projetos", {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projetoId: projectId }),
    });
    const payload = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      toast.error(payload?.error?.message ?? "Não foi possível atualizar favorito");
      return;
    }

    setSaved((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        saved
          ? "border-[#dcd3f7] bg-[#f3f0ff] text-[#6757c8] hover:bg-[#ebe6fb]"
          : "border-[#e8e3f0] bg-[#f3f0ff] text-[#6757c8] hover:bg-[#ebe6fb]",
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Heart className={cn("size-4", saved && "fill-current")} />}
      {saved ? "Salvo" : "Salvar"}
    </button>
  );
}
