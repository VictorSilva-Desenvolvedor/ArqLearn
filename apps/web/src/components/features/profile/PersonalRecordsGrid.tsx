import { PersonalRecordCard } from "./PersonalRecordCard";
import type { PersonalRecord } from "@/types/api";

export function PersonalRecordsGrid({ records }: { records: PersonalRecord[] }) {
  return (
    <div>
      <h2 className="font-display text-headline-md text-on-surface mb-sm">Recordes Pessoais</h2>
      <div className="grid grid-cols-4 gap-sm">
        {records.map((record) => (
          <PersonalRecordCard key={record.metric} record={record} />
        ))}
      </div>
    </div>
  );
}
