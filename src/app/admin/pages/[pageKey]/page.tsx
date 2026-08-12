import connectDB from "@/lib/db";
import { Page } from "@/models";
import { PageForm } from "@/components/admin/forms/PageForm";
import { serialize } from "@/lib/admin/serialize";
import { PAGE_KEYS } from "@/lib/constants";
import { notFound } from "next/navigation";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}) {
  const { pageKey } = await params;
  if (!PAGE_KEYS.includes(pageKey as (typeof PAGE_KEYS)[number])) {
    notFound();
  }

  await connectDB();
  const page = await Page.findOne({ key: pageKey }).lean();

  return (
    <PageForm
      pageKey={pageKey}
      initialData={page ? serialize(page) : { key: pageKey, slug: pageKey, title: pageKey, status: "draft" }}
      sections={page?.sections ?? []}
    />
  );
}
