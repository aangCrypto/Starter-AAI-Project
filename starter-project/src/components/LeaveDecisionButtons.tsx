"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveAction,
  hrRejectAction,
  sendToHrAction,
  signAction,
  supervisorRejectAction,
  withdrawAction,
  type ActionResult,
} from "@/app/actions";
import { Button, type ButtonVariant } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { SuccessModal } from "./ui/SuccessModal";
import { AlertIcon } from "./ui/Icons";
import { ErrorMessage, Label, inputClass } from "./ui/Field";

// The action buttons on a request's detail screen. Every action confirms
// first and reports success afterwards — requirement U15 / AC-18. Rejections
// carry a remark box (required), signing and approving an optional one.
export type DecisionAction = {
  kind: "send" | "withdraw" | "sign" | "supervisorReject" | "approve" | "hrReject";
  label: string;
  confirmTitle: string;
  confirmMessage: string;
  variant?: ButtonVariant;
  danger?: boolean;
  needsRemark?: boolean;
  remarkRequired?: boolean;
};

const RUNNERS: Record<
  DecisionAction["kind"],
  (id: number, remark?: string) => Promise<ActionResult>
> = {
  send: (id) => sendToHrAction(id),
  withdraw: (id) => withdrawAction(id),
  sign: (id, remark) => signAction(id, remark),
  supervisorReject: (id, remark) => supervisorRejectAction(id, remark),
  approve: (id, remark) => approveAction(id, remark),
  hrReject: (id, remark) => hrRejectAction(id, remark),
};

export function LeaveDecisionButtons({
  requestId,
  actions,
  redirectTo,
}: {
  requestId: number;
  actions: DecisionAction[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<DecisionAction | null>(null);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  if (actions.length === 0) return null;

  function openDialog(action: DecisionAction) {
    setError(undefined);
    setRemark("");
    setSelected(action);
  }

  function confirm() {
    if (!selected) return;
    if (selected.remarkRequired && !remark.trim()) {
      setError("A remark is required when rejecting.");
      return;
    }
    const runner = RUNNERS[selected.kind];
    const text = remark.trim() || undefined;
    startTransition(async () => {
      const result = await runner(requestId, text);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSelected(null);
      setSuccess(result.message ?? "Done.");
    });
  }

  function finish() {
    setSuccess(undefined);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Button
          key={action.kind}
          variant={action.variant ?? (action.danger ? "danger" : "primary")}
          onClick={() => openDialog(action)}
        >
          {action.label}
        </Button>
      ))}

      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        <div className="flex gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              selected?.danger ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-600"
            }`}
          >
            <AlertIcon />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              {selected?.confirmTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{selected?.confirmMessage}</p>
          </div>
        </div>

        {selected?.needsRemark ? (
          <div className="mt-4">
            <Label htmlFor="decision-remark">
              Remark{selected.remarkRequired ? " (required)" : " (optional)"}
            </Label>
            <textarea
              id="decision-remark"
              rows={3}
              className={inputClass}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        ) : null}

        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSelected(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={selected?.danger ? "danger" : selected?.variant ?? "primary"}
            onClick={confirm}
            disabled={pending}
          >
            {pending ? "Working…" : selected?.label ?? "Confirm"}
          </Button>
        </div>
      </Modal>

      <SuccessModal
        open={success !== undefined}
        title="Success"
        message={success}
        onAction={finish}
      />
    </div>
  );
}
