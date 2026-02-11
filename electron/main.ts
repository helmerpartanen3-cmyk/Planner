// Elektronin pääprosessi. Hallinnoi sovelluksen ikkunan ja tietojen säilöntää.

import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import fs from "fs";

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

let mainWindow: BrowserWindow | null = null;

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
    backgroundMaterial: "mica",
    backgroundColor: "#00000000",

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

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const outPath = path.join(app.getAppPath(), "out/index.html");
    const fileUrl = `file://${outPath}`.replace(/\\/g, "/");
    mainWindow.loadURL(fileUrl);
  }

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
