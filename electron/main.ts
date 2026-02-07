import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import fs from "fs";

/* ── File-based JSON store in %APPDATA%/clarity ──────── */

const storeDir = path.join(app.getPath("userData"), "data");
if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });

function storeFile(key: string) {
  return path.join(storeDir, `${key}.json`);
}

function storeGet(key: string): unknown | null {
  try {
    const raw = fs.readFileSync(storeFile(key), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeSet(key: string, value: unknown): void {
  fs.writeFileSync(storeFile(key), JSON.stringify(value), "utf-8");
}

/* ── Window ─────────────────────────────────────────── */

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== "production";

// IPC: persistent store (register once, before any window)
ipcMain.handle("store-get", (_event, key: string) => storeGet(key));
ipcMain.handle("store-set", (_event, key: string, value: unknown) => storeSet(key, value));

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    minWidth: 680,
    minHeight: 500,

    frame: false,
    titleBarStyle: "hidden",
    backgroundMaterial: "mica", // Mica-like blur+transparency
    backgroundColor: "#00000000", // required for Mica to render

    show: false,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadURL(
      `file://${path.join(__dirname, "../out/index.html")}`
    );
  }

  // IPC window controls
  ipcMain.on("window-minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window-maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on("window-close", () => {
    mainWindow?.close();
  });

  // Maximize state sync
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximized", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-maximized", false);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
