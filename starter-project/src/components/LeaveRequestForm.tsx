"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyForLeaveAction, type ActionResult } from "@/app/actions";
import { LEAVE_TYPE_LABELS, LEAVE_TYPES } from "@/lib/constants";
import { daysInclusive } from "@/lib/leave";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { SuccessModal } from "./ui/SuccessModal";
import { ErrorMessage, Label, inputClass } from "./ui/Field";

// The apply form (design §12): type, own-division supervisor, start, end,
// optional reason. The day count shows live; submit confirms, then reports
// success. Empty fields are stopped by the browser (required + reportValidity).
export function LeaveRequestForm({
  supervisors,
  today,
}: {
  supervisors: { id: number; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [saved, setSaved] = useState<FormData | null>(null);
  const [days, setDays] = useState<number>(0);

  function onFieldChange() {
    const form = formRef.current;
    if (!form) return;
    const start = (form.elements.namedItem("startDate") as HTMLInputElement | null)?.value ?? "";
    const end = (form.elements.namedItem("endDate") as HTMLInputElement | null)?.value ?? "";
    const count = start && end ? daysInclusive(start, end) : 0;
    setDays(count > 0 ? count : 0);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    // Keep the browser's "please fill this in" bubbles (AC-11).
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setSaved(new FormData(form));
    setError(undefined);
    setConfirmOpen(true);
  }

  function submit() {
    if (!saved) return;
    const data = saved;
    startTransition(async () => {
      const result: ActionResult = await applyForLeaveAction({}, data);
      if (result?.error) {
        setConfirmOpen(false);
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
      setSuccessOpen(true);
    });
  }

  function finish() {
    setSuccessOpen(false);
    router.push("/employee");
    router.refresh();
  }

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="max-w-lg space-y-5" onChange={onFieldChange}>
        <ErrorMessage message={error} />

        <div>
          <Label htmlFor="leaveType">Leave type</Label>
          <select id="leaveType" name="leaveType" required className={inputClass}>
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="supervisorId">Supervisor (from your division)</Label>
          <select id="supervisorId" name="supervisorId" required className={inputClass}>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Start date</Label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              min={today}
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End date</Label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              min={today}
              className={inputClass}
            />
          </div>
        </div>

        {days > 0 ? (
          <p className="text-sm text-slate-600">
            That is <span className="font-semibold">{days} day{days === 1 ? "" : "s"}</span> (calendar days, inclusive).
          </p>
        ) : null}

        <div>
          <Label htmlFor="reason">Reason (optional)</Label>
          <textarea id="reason" name="reason" rows={3} className={inputClass} />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Submit leave request?"
        message="Your supervisor will be asked to sign this request."
        confirmLabel={pending ? "Submitting…" : "Submit"}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />

      <SuccessModal
        open={successOpen}
        title="Request submitted"
        message="Your request is with your supervisor."
        onAction={finish}
      />
    </>
  );
}
