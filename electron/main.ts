import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== "production";

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    minWidth: 680,
    minHeight: 500,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0a",
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
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, "../out/index.html")}`);
  }

  // Window control IPC handlers
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

  // Send maximize state changes to renderer
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
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
