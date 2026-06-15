import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem, listOutcomesForPicker } from "@/lib/queries";
import { ItemForm } from "@/components/ItemForm";
import { AttachmentsEditor } from "@/components/AttachmentsEditor";
import { OutcomeChildren } from "@/components/OutcomeChildren";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
  const [{ item, attachments, children }, outcomes] = await Promise.all([
    getItem(params.id),
    listOutcomesForPicker(),
  ]);

  if (!item) notFound();

  const back = searchParams.from ? `/${searchParams.from}` : "/intake";

  return (
    <div className="space-y-4">
      <Link href={back} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-loop-600">
        <Icon name="ChevronLeft" className="h-4 w-4" />
        Back
      </Link>

      {item.kind === "outcome" && <OutcomeChildren parentId={item.id} initial={children} />}

      <div className="card p-4">
        <ItemForm item={item} outcomes={outcomes.filter((o) => o.id !== item.id)} />
      </div>

      <div className="card p-4">
        <AttachmentsEditor itemId={item.id} initial={attachments} />
      </div>
    </div>
  );
}
