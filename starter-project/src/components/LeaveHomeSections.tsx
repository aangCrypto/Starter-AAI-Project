import { Card, CardHeader } from "./ui/Card";
import { LeaveRequestTable, type LeaveRequestRow } from "./LeaveRequestTable";

// The two-table layout every role home page uses (design §12):
// "Action needed" first, then "History".
export function LeaveHomeSections({
  actionRows,
  historyRows,
  rowHref,
}: {
  actionRows: LeaveRequestRow[];
  historyRows: LeaveRequestRow[];
  rowHref?: (row: LeaveRequestRow) => string;
}) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader
          title="Action needed"
          count={actionRows.length}
          description="Requests waiting for you to act."
        />
        <LeaveRequestTable
          rows={actionRows}
          rowHref={rowHref}
          emptyTitle="Nothing waiting for you"
          emptyDescription="New requests will appear here."
        />
      </Card>

      <Card>
        <CardHeader
          title="History"
          count={historyRows.length}
          description="Everything else, newest first."
        />
        <LeaveRequestTable
          rows={historyRows}
          rowHref={rowHref}
          emptyTitle="No requests yet"
        />
      </Card>
    </div>
  );
}
