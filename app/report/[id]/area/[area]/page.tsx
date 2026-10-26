import { AreaScreen } from "@/components/report/AreaScreen";

// /report/:id/area/:area — one body area in detail (e.g. /report/noor/area/left-cheek).
export default async function AreaPage({ params, searchParams }: { params: Promise<{ id: string; area: string }>; searchParams: Promise<{ fail?: string }> }) {
  const { id, area } = await params;
  const { fail } = await searchParams;
  return <AreaScreen id={id} slug={area} fail={fail === "1"} />;
}
