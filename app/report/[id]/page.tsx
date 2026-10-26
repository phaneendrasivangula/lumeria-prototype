import { SummaryScreen } from "@/components/report/SummaryScreen";

// /report/:id — the Summary for one person. Data comes from GET /api/reports/:id on the client,
// so the slow API shows the loading state and ?fail=1 shows the error state, as in production.
export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fail?: string }> }) {
  const { id } = await params;
  const { fail } = await searchParams;
  return <SummaryScreen id={id} fail={fail === "1"} />;
}
