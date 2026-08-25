import Link from "next/link";
import { getUploadSummary } from "@/lib/api/resources/materials";
import { getServerAccessToken } from "@/lib/supabase/server";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { DiagramCard } from "@/components/features/materialSummary/DiagramCard";
import { KeyPointsChecklist } from "@/components/features/materialSummary/KeyPointsChecklist";
import { ArchitectTipCallout } from "@/components/features/materialSummary/ArchitectTipCallout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

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
        {/* Superfície opaca pela mesma razão do KeyPointsChecklist: a sinopse é texto corrido de
            leitura e ficava direto sobre a grade blueprint animada do <body>. */}
        <Card padding="md" radius="lg" bordered={false}>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{summary.synopsis}</p>
        </Card>
        <DiagramCard caption={`Diagrama técnico — ${summary.title}`} />
        <KeyPointsChecklist points={summary.key_points} />
        {summary.architect_tip && <ArchitectTipCallout tip={summary.architect_tip} />}
        <div className="flex flex-col gap-xs">
          <Link href={`/materiais/${uploadId}/chat`}>
            <Button variant="primary" fullWidth icon={<Icon name="forum" filled size={20} />}>
              Tirar Dúvidas
            </Button>
          </Link>
          <p className="font-label text-label-caps text-on-surface-variant text-center">
            Converse com o assistente sobre este documento
          </p>
        </div>
      </div>
    </>
  );
}
