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
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    setIsElectron(true);
    return window.electronAPI.onMaximized(setIsMaximized);
  }, []);

  const handleMinimize = useCallback(() => {
    window.electronAPI?.minimize();
  }, []);

  const handleMaximize = useCallback(() => {
    window.electronAPI?.maximize();
  }, []);

  const handleClose = useCallback(() => {
    window.electronAPI?.close();
  }, []);

  if (!isElectron) return null;

  return (
    <header
      className="
        h-9 w-full
        flex items-center justify-end
        select-none
      "
      style={{ WebkitAppRegion: "drag" }}
    >
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <TitlebarButton onClick={handleMinimize} ariaLabel="Minimize">
          <Minus size={14} />
        </TitlebarButton>

        <TitlebarButton
          onClick={handleMaximize}
          ariaLabel={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Cards size={14} />
          ) : (
            <Square size={14} />
          )}
        </TitlebarButton>

        <TitlebarButton
          onClick={handleClose}
          ariaLabel="Close"
          danger
        >
          <X size={14} />
        </TitlebarButton>
      </div>
    </header>
  );
}

function TitlebarButton({
  children,
  onClick,
  ariaLabel,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        h-9 w-10
        flex items-center justify-center
        transition-colors
        text-white
        ${
          danger
            ? "hover:bg-red-500/90 hover:text-white"
            : "hover:bg-white/10"
        }
        active:bg-white/20
      `}
    >
      {children}
    </button>
  );
}
