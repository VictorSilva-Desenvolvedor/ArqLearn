import { HelpFaqSection } from "@/components/features/help/HelpFaqSection";
import { BugReportForm } from "@/components/features/help/BugReportForm";

export default function AjudaPage() {
  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-lg">
      <div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">Ajuda e Bugs</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Explicações rápidas sobre como o ArqLearn funciona, e um jeito fácil de nos avisar quando
          algo dá errado.
        </p>
      </div>
      <HelpFaqSection />
      <section className="max-w-2xl">
        <BugReportForm />
      </section>
    </div>
  );
}
