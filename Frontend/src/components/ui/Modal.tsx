import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}

function Modal({
  isOpen,
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;