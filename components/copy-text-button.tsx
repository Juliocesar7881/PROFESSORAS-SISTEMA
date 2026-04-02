"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyTextButtonProps {
  text: string;
  label?: string;
}

export function CopyTextButton({ text, label = "Copiar texto" }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Texto copiado");

      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Não foi possível copiar o texto");
    }
  };

  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold text-[#165DAD] underline">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : label}
    </button>
  );
}
