"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface UploadPromptCardProps {
  onFileSelected: (file: File) => void;
}

export function UploadPromptCard({ onFileSelected }: UploadPromptCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card radius="xl" className="flex flex-col md:flex-row items-center justify-between gap-md">
      <div className="flex items-center gap-md">
        <Icon name="upload_file" filled className="text-4xl text-primary" />
        <div>
          <p className="font-display text-question-sm text-on-surface font-bold">Upload de Material</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Envie PDFs, apresentações, imagens ou vídeos e gere exercícios automaticamente.
          </p>
          <p className="font-body-sm text-body-sm text-outline mt-1">Tamanho máximo: 2 GB</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />
      <Button variant="primary" onClick={() => inputRef.current?.click()}>
        Novo Upload
      </Button>
    </Card>
  );
}
