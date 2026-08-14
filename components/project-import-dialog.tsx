"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function apiError(json: unknown) {
  if (json && typeof json === "object" && "error" in json) {
    return (json as { error?: { message?: string } }).error?.message;
  }
  return undefined;
}

export function ProjectImportDialog({
  onCreated,
  compact = false,
}: {
  onCreated?: (projectId: string) => void;
  compact?: boolean;
}) {
  const [processing, setProcessing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("arquivo", file);
      form.append("confirmar", "true");

      const response = await fetch("/api/projetos/importar", { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json) ?? "Falha ao importar o documento");

      const projectId = String(json.data?.projectId ?? json.data?.projeto?.id ?? "");
      if (!projectId) throw new Error("O projeto foi lido, mas não pôde ser salvo");

      toast.success("Projeto importado e salvo");
      onCreated?.(projectId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar o documento");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={compact ? "outline" : "default"}
        onClick={() => fileInput.current?.click()}
        disabled={processing}
        className="h-11"
      >
        {processing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        {processing ? "Importando projeto..." : "Importar projeto"}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (file) void processFile(file);
        }}
      />
    </>
  );
}
