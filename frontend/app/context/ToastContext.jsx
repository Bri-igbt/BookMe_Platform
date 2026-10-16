'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BadgeCheck, AlertCircle } from "lucide-react";

const ToastContext = createContext(null);

export const userToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const timeoutRef = useRef(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    setToast({
      show: true,
      message,
      type,
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isSuccess = toast.type === "success";

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        role={isSuccess ? "status" : "alert"}
        aria-live={isSuccess ? "polite" : "assertive"}
        aria-hidden={!toast.show}
        className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg transition-all duration-300 transform z-[9999] ${toast.show
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 pointer-events-none"
          } ${isSuccess ? "bg-slate-900 text-white" : "bg-red-600 text-white"}`}
      >
        {isSuccess ? (
          <BadgeCheck className="w-5 h-5 text-emerald-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-white" />
        )}

        <p className="font-medium text-sm">{toast.message}</p>
      </div>
    </ToastContext.Provider>
  );
};