"use client";

import { useEffect, useState, useCallback } from "react";

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
    setIsElectron(!!window.electronAPI);

    if (window.electronAPI) {
      const cleanup = window.electronAPI.onMaximized((maximized) => {
        setIsMaximized(maximized);
      });
      return cleanup;
    }
  }, []);

  const handleMinimize = useCallback(() => window.electronAPI?.minimize(), []);
  const handleMaximize = useCallback(() => window.electronAPI?.maximize(), []);
  const handleClose = useCallback(() => window.electronAPI?.close(), []);

  if (!isElectron) return null;

  return (
    <header className="titlebar">
      <div className="titlebar-drag">
        <div className="titlebar-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        </div>
        <span className="titlebar-title">Clarity</span>
        <nav className="titlebar-nav">
          <button className="titlebar-nav-btn">File</button>
          <button className="titlebar-nav-btn">Edit</button>
          <button className="titlebar-nav-btn">View</button>
          <button className="titlebar-nav-btn">Help</button>
        </nav>
      </div>

      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn-minimize"
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>

        <button
          className="titlebar-btn titlebar-btn-maximize"
          onClick={handleMaximize}
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M2 0v2H0v8h8V8h2V0H2zm6 8H1V3h7v5zM9 7V1H3v1h5v5h1z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                width="9"
                height="9"
                x="0.5"
                y="0.5"
                stroke="currentColor"
                fill="none"
                strokeWidth="1"
              />
            </svg>
          )}
        </button>

        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M1 1l8 8M9 1l-8 8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
