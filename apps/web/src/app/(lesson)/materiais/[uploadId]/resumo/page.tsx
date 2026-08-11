import Link from "next/link";
import { getUploadSummary } from "@/lib/api/resources/materials";
import { getServerAccessToken } from "@/lib/supabase/server";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { DiagramCard } from "@/components/features/materialSummary/DiagramCard";
import { KeyPointsChecklist } from "@/components/features/materialSummary/KeyPointsChecklist";
import { ArchitectTipCallout } from "@/components/features/materialSummary/ArchitectTipCallout";
import { Button } from "@/components/ui/Button";

export default async function MaterialSummaryPage({
  params,
}: {
  params: Promise<{ uploadId: string }>;
}) {
  const { uploadId } = await params;
  const summary = await getUploadSummary(uploadId, await getServerAccessToken());

  return (
    <>
      <SummaryHeader title={summary.title} />
      <div className="max-w-2xl mx-auto px-md py-lg flex flex-col gap-lg flex-1">
        <p className="font-body-lg text-body-lg text-on-surface-variant">{summary.synopsis}</p>
        <DiagramCard caption={`Diagrama técnico — ${summary.title}`} />
        <KeyPointsChecklist points={summary.key_points} />
        {summary.architect_tip && <ArchitectTipCallout tip={summary.architect_tip} />}
        <Link href={`/materiais/${uploadId}/chat`}>
          <Button variant="primary" fullWidth>
            Tirar Dúvidas
          </Button>
        </Link>
      </div>
    </>
  );
}
