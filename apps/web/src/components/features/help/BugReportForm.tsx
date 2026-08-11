"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { submitBugReport } from "@/lib/api/resources/bugReports";
import { ApiError } from "@/lib/api/http";
import type { BugReportType, DeviceType } from "@/types/api";

const MIN_DESCRIPTION_LEN = 10;
const MAX_DESCRIPTION_LEN = 2000;
// Mesmo limite do backend (~2MB de imagem, API Spec §14) — validado aqui antes de tentar enviar,
// pra dar retorno imediato em vez de esperar o 413 do servidor.
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;

const BUG_GEMS_REWARD = 10;
const SUGGESTION_GEMS_REWARD = 50;

const deviceTypeOptions: { value: DeviceType; label: string }[] = [
  { value: "mobile", label: "Celular" },
  { value: "desktop", label: "Computador" },
  { value: "tablet", label: "Tablet" },
];

const inputClass =
  "rounded-xl border-2 border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none";

export function BugReportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<BugReportType>("bug");
  const [description, setDescription] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType | "">("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isBug = type === "bug";
  const gemsReward = isBug ? BUG_GEMS_REWARD : SUGGESTION_GEMS_REWARD;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshot(null);
      setScreenshotName(null);
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setError("O print é grande demais — escolha uma imagem de até 2MB.");
      event.target.value = "";
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    setScreenshotName(file.name);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setDescription("");
    setDeviceModel("");
    setDeviceType("");
    removeScreenshot();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LEN || trimmed.length > MAX_DESCRIPTION_LEN) {
      setError(`Descreva com pelo menos ${MIN_DESCRIPTION_LEN} caracteres (até ${MAX_DESCRIPTION_LEN}).`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitBugReport({
        type,
        description: trimmed,
        screenshot_base64: screenshot,
        device_model: isBug && deviceModel.trim() ? deviceModel.trim() : null,
        device_type: isBug && deviceType ? deviceType : null,
      });
      setSent(true);
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar agora — tente de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card padding="lg" radius="lg" className="flex flex-col items-center text-center gap-sm">
        <Icon name="check_circle" filled className="text-5xl text-tertiary" />
        <p className="font-display text-question-sm font-bold text-on-surface">
          {isBug ? "Relato enviado!" : "Sugestão enviada!"}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {isBug
            ? `Obrigado por ajudar a melhorar o ArqLearn. Se esse bug for corrigido, você ganha ${BUG_GEMS_REWARD} gemas e a gente te avisa por notificação.`
            : `Obrigado pela ideia! Se ela for implementada, você ganha ${SUGGESTION_GEMS_REWARD} gemas e a gente te avisa por notificação.`}
        </p>
        <Button variant="ghost" onClick={() => setSent(false)}>
          Enviar outro
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card padding="lg" radius="lg" className="flex flex-col gap-sm">
        <div className="flex gap-sm">
          <Button
            type="button"
            variant={isBug ? "primary" : "ghost"}
            fullWidth
            onClick={() => setType("bug")}
          >
            <Icon name="bug_report" /> Reportar bug
          </Button>
          <Button
            type="button"
            variant={!isBug ? "primary" : "ghost"}
            fullWidth
            onClick={() => setType("suggestion")}
          >
            <Icon name="lightbulb" /> Sugerir melhoria
          </Button>
        </div>

        <div>
          <p className="font-display text-question-sm font-bold text-on-surface">
            {isBug ? "O que deu errado?" : "O que você melhoraria?"}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {isBug
              ? `Descreva o problema e, se puder, anexe um print. Se corrigirmos, você ganha ${gemsReward} gemas.`
              : `Descreva sua ideia. Se a gente implementar, você ganha ${gemsReward} gemas.`}
          </p>
        </div>

        <label className="flex flex-col gap-xs">
          <span className="font-label text-body-sm text-on-surface-variant">
            {isBug ? "O que aconteceu?" : "Sua sugestão"}
          </span>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESCRIPTION_LEN}
            placeholder={
              isBug
                ? "Ex.: Ao clicar em 'Continuar' no Modo Infinito de Maquetes, a tela travou e precisei recarregar a página."
                : "Ex.: Seria ótimo poder filtrar as lições por dificuldade antes de começar uma trilha."
            }
            className={inputClass}
          />
          <span className="font-body-sm text-body-sm text-on-surface-variant self-end">
            {description.length}/{MAX_DESCRIPTION_LEN}
          </span>
        </label>

        {isBug && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            <label className="flex flex-col gap-xs">
              <span className="font-label text-body-sm text-on-surface-variant">Tipo de dispositivo (opcional)</span>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as DeviceType | "")}
                className={inputClass}
              >
                <option value="">Não informar</option>
                {deviceTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label text-body-sm text-on-surface-variant">Modelo do dispositivo (opcional)</span>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="Ex.: iPhone 13, Dell XPS 13…"
                className={inputClass}
              />
            </label>
          </div>
        )}

        {isBug && (
          <label className="flex flex-col gap-xs">
            <span className="font-label text-body-sm text-on-surface-variant">Print (opcional, até 2MB)</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className={inputClass} />
          </label>
        )}

        {screenshot && (
          <div className="flex items-center gap-sm bg-surface-gray rounded-lg p-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI local, não passa pelo otimizador de imagens do Next */}
            <img src={screenshot} alt="Pré-visualização do print anexado" className="w-16 h-16 object-cover rounded-md border border-outline-variant" />
            <span className="font-body-sm text-body-sm text-on-surface-variant flex-1 truncate">{screenshotName}</span>
            <Button type="button" variant="ghost" onClick={removeScreenshot}>
              Remover
            </Button>
          </div>
        )}

        {error && (
          <p className="font-body-sm text-body-sm text-error bg-error-container rounded-md px-md py-sm">{error}</p>
        )}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Enviando…" : isBug ? "Enviar relato" : "Enviar sugestão"}
        </Button>
      </Card>
    </form>
  );
}
