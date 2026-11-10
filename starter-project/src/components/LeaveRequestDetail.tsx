import {
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  formatTimestamp,
} from "@/lib/constants";
import { DetailList, type DetailRow } from "./ui/DetailSection";

type RequestForDetail = {
  employeeName: string;
  supervisorName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: string;
  reason: string | null;
  supervisorRemark: string | null;
  hrRemark: string | null;
  hrDecidedByName: string | null;
};

// The label/value block on every request detail screen (design §12).
export function LeaveRequestDetail({ request }: { request: RequestForDetail }) {
  const rows: DetailRow[] = [
    { label: "Employee", value: request.employeeName },
    { label: "Supervisor", value: request.supervisorName },
    {
      label: "Type",
      value: (LEAVE_TYPE_LABELS as Record<string, string>)[request.leaveType] ?? request.leaveType,
    },
    {
      label: "Status",
      value: (LEAVE_STATUS_LABELS as Record<string, string>)[request.status] ?? request.status,
    },
    {
      label: "Dates",
      value: `${formatTimestamp(request.startDate)} – ${formatTimestamp(request.endDate)}`,
    },
    { label: "Days", value: request.days },
    { label: "Reason", value: request.reason ?? "–", wide: true },
    { label: "Supervisor remark", value: request.supervisorRemark ?? "–", wide: true },
    { label: "HR remark", value: request.hrRemark ?? "–", wide: true },
    { label: "Decided by HR", value: request.hrDecidedByName ?? "–" },
  ];
  return <DetailList rows={rows} />;
}
