"use client";

import { useEffect, useState, useCallback } from "react";
import { Minus, Square, X, Cards } from "@phosphor-icons/react";

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      onMaximized: (callback: (maximized: boolean) => void) => () => void;
    };
  }
}

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onMaximized(setIsMaximized);
  }, []);

  const handleMinimize = useCallback(() => window.electronAPI?.minimize(), []);
  const handleMaximize = useCallback(() => window.electronAPI?.maximize(), []);
  const handleClose = useCallback(() => window.electronAPI?.close(), []);

  return (
    <div
      className="h-9 flex items-center shrink-0 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex-1" />
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <TitlebarBtn onClick={handleMinimize} label="Minimize">
          <Minus size={13} weight="light" />
        </TitlebarBtn>
        <TitlebarBtn
          onClick={handleMaximize}
          label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <Cards size={13} weight="light" /> : <Square size={13} weight="light" />}
        </TitlebarBtn>
        <TitlebarBtn onClick={handleClose} label="Close" danger>
          <X size={13} weight="light" />
        </TitlebarBtn>
      </div>
    </div>
  );
}

function TitlebarBtn({
  children,
  onClick,
  label,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        h-9 w-[46px] flex items-center justify-center
        transition-colors text-white/60
        ${danger
          ? "hover:bg-red-500/90 hover:text-white"
          : "hover:bg-white/[0.07]"
        }
        active:bg-white/[0.12]
      `}
    >
      {children}
    </button>
  );
}
