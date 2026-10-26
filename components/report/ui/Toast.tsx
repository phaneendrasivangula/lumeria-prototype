"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import s from "./Toast.module.css";

const Ctx = createContext<(message: string) => void>(() => {});

/** A small status message for actions this web preview can't complete (reminders, exports, scanning). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const [shown, setShown] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m);
    setShown(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(false), 2200);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={s.toast} role="status" data-shown={shown ? "" : undefined}>
        {msg}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
