import Link from "next/link";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  formatTimestamp,
  type LeaveStatus,
} from "@/lib/constants";
import { EmptyState } from "./ui/EmptyState";

// The one table used by all four home pages (design §12): employee, type,
// dates, days, status, latest remark. When rowHref is given, the employee
// name links to that role's detail screen.
export type LeaveRequestRow = {
  id: number;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: string;
  remark: string | null;
  // The HR officer who decided, when there is a decision (admin table).
  decidedBy: string | null;
};

function typeLabel(value: string): string {
  return (LEAVE_TYPE_LABELS as Record<string, string>)[value] ?? value;
}

function statusLabel(value: string): string {
  return (LEAVE_STATUS_LABELS as Record<string, string>)[value] ?? value;
}

const STATUS_STYLES: Record<LeaveStatus, string> = {
  AWAITING_SUPERVISOR: "bg-amber-100 text-amber-800",
  SIGNED: "bg-sky-100 text-sky-800",
  AWAITING_HR: "bg-violet-100 text-violet-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-slate-100 text-slate-600",
};

function statusBadge(value: string) {
  const style =
    STATUS_STYLES[value as LeaveStatus] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {statusLabel(value)}
    </span>
  );
}

export function LeaveRequestTable({
  rows,
  rowHref,
  showDecider = false,
  emptyTitle = "Nothing waiting for you",
  emptyDescription,
}: {
  rows: LeaveRequestRow[];
  rowHref?: (row: LeaveRequestRow) => string;
  showDecider?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">Employee</th>
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Dates</th>
            <th className="px-5 py-3 font-medium">Days</th>
            <th className="px-5 py-3 font-medium">Status</th>
            {showDecider ? (
              <th className="px-5 py-3 font-medium">Decided by HR</th>
            ) : null}
            <th className="px-5 py-3 font-medium">Latest remark</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-50 last:border-0">
              <td className="px-5 py-3 font-medium text-slate-900">
                {rowHref ? (
                  <Link
                    href={rowHref(row)}
                    className="text-brand-700 hover:underline"
                  >
                    {row.employeeName}
                  </Link>
                ) : (
                  row.employeeName
                )}
              </td>
              <td className="px-5 py-3 text-slate-700">{typeLabel(row.leaveType)}</td>
              <td className="px-5 py-3 text-slate-700">
                {formatTimestamp(row.startDate)} – {formatTimestamp(row.endDate)}
              </td>
              <td className="px-5 py-3 text-slate-700">{row.days}</td>
              <td className="px-5 py-3">{statusBadge(row.status)}</td>
              {showDecider ? (
                <td className="px-5 py-3 text-slate-700">{row.decidedBy ?? "–"}</td>
              ) : null}
              <td className="px-5 py-3 text-slate-500">{row.remark ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Latest remark: the HR one if there is one, else the supervisor's.
export function latestRemark(
  request: { supervisorRemark: string | null; hrRemark: string | null },
): string | null {
  return request.hrRemark ?? request.supervisorRemark;
}

// Maps a request row (with its employee's name included) to a table row.
export function toLeaveRequestRow(request: {
  id: number;
  employee: { name: string };
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: string;
  supervisorRemark: string | null;
  hrRemark: string | null;
  hrDecidedBy?: { name: string } | null;
}): LeaveRequestRow {
  return {
    id: request.id,
    employeeName: request.employee.name,
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    days: request.days,
    status: request.status,
    remark: latestRemark(request),
    decidedBy: request.hrDecidedBy?.name ?? null,
  };
}
