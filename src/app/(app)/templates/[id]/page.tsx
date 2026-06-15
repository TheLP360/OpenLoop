import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/queries";
import { TemplateEditor } from "@/components/TemplateEditor";
import { Icon } from "@/components/Icon";
import { KINDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TemplateEditPage({ params }: { params: { id: string } }) {
  const template = await getTemplate(params.id);
  if (!template) notFound();

  const meta = KINDS[template.kind === "outcome" ? "outcome" : "thought"];

  return (
    <div className="space-y-4">
      <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-loop-600">
        <Icon name="ChevronLeft" className="h-4 w-4" />
        Templates
      </Link>
      <div className="flex items-center gap-2">
        <Icon name={meta.icon} className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">
          {template.kind === "outcome" ? "Outcome template" : "Thought template"}
        </h1>
      </div>
      <TemplateEditor template={template} />
    </div>
  );
}
