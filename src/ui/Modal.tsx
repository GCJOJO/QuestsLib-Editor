import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { X } from "lucide-react";
import { t } from "../i18n";

type ModalProps = { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode };

export function Modal({ title, onClose, children, wide, footer }: ModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={wide ? "modal wide" : "modal"} role="dialog" aria-modal="true">
                <div className="modal-head">
                    <h2>{title}</h2>
                    <button className="icon-btn" onClick={onClose} title={t("Fermer")} aria-label={t("Fermer")}>
                        <X size={16} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-foot">{footer}</div>}
            </div>
        </div>
    );
}

// --- Boîtes de dialogue en promesse (remplacent prompt/confirm du navigateur) ------------------

type Request =
    | { kind: "prompt"; title: string; message?: string; value: string; resolve: (v: string | null) => void }
    | { kind: "confirm"; title: string; message: string; danger?: boolean; confirmLabel?: string; resolve: (v: boolean) => void };

let pending: Request | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function askText(title: string, value = "", message?: string): Promise<string | null> {
    return new Promise((resolve) => {
        pending = { kind: "prompt", title, message, value, resolve };
        emit();
    });
}

export function askConfirm(title: string, message: string, opts: { danger?: boolean; confirmLabel?: string } = {}): Promise<boolean> {
    return new Promise((resolve) => {
        pending = { kind: "confirm", title, message, ...opts, resolve };
        emit();
    });
}

export function DialogHost() {
    const req = useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => pending,
    );
    if (!req) return null;
    return <Dialog key={req.title + req.kind} req={req} />;
}

function Dialog({ req }: { req: Request }) {
    const [value, setValue] = useState(req.kind === "prompt" ? req.value : "");
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => {
        input.current?.select();
    }, []);

    const close = (result: boolean) => {
        pending = null;
        emit();
        if (req.kind === "prompt") req.resolve(result && value.trim() ? value.trim() : null);
        else req.resolve(result);
    };

    return (
        <Modal
            title={req.title}
            onClose={() => close(false)}
            footer={
                <>
                    <button className="btn" onClick={() => close(false)}>
                        {t("Annuler")}
                    </button>
                    <button
                        className={req.kind === "confirm" && req.danger ? "btn danger" : "btn primary"}
                        onClick={() => close(true)}
                        disabled={req.kind === "prompt" && !value.trim()}
                    >
                        {req.kind === "confirm" ? (req.confirmLabel ?? t("Confirmer")) : t("Valider")}
                    </button>
                </>
            }
        >
            {req.message && <p className="dialog-message">{req.message}</p>}
            {req.kind === "prompt" && (
                <input
                    ref={input}
                    className="mono"
                    value={value}
                    autoFocus
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && value.trim() && close(true)}
                />
            )}
        </Modal>
    );
}

// --- Notifications brèves -----------------------------------------------------------------------

type Toast = { id: number; text: string; kind: "ok" | "error" };
let toasts: Toast[] = [];
const toastListeners = new Set<() => void>();

export function toast(text: string, kind: Toast["kind"] = "ok") {
    const id = Date.now() + Math.random();
    toasts = [...toasts, { id, text, kind }];
    toastListeners.forEach((l) => l());
    setTimeout(() => {
        toasts = toasts.filter((x) => x.id !== id);
        toastListeners.forEach((l) => l());
    }, 4000);
}

export function ToastHost() {
    const list = useSyncExternalStore(
        (l) => {
            toastListeners.add(l);
            return () => toastListeners.delete(l);
        },
        () => toasts,
    );
    return (
        <div className="toasts" role="status" aria-live="polite">
            {list.map((x) => (
                <div key={x.id} className={`toast ${x.kind}`}>
                    {x.text}
                </div>
            ))}
        </div>
    );
}
