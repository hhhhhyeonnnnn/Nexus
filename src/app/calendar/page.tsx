import type { Metadata } from "next";
import { getCalendarData } from "@/features/calendar/actions";
import { CalendarView } from "@/features/calendar/components/calendar-view";

export const metadata: Metadata = {
  title: "캘린더",
  description: "학생회의 행사, 프로젝트 일정, 업무 마감일을 한눈에 확인하세요.",
};

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : undefined;
  const month = params.month ? parseInt(params.month, 10) : undefined;

  const data = await getCalendarData(year, month);

  return <CalendarView data={data} />;
}
