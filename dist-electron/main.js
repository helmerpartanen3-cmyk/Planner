"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
const isDev = process.env.NODE_ENV !== "production";
function createWindow() {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new electron_1.BrowserWindow({
        width: Math.min(1200, width),
        height: Math.min(800, height),
        minWidth: 680,
        minHeight: 500,
        frame: false,
        titleBarStyle: "hidden",
        backgroundColor: "#0a0a0a",
        show: false,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
    }
    else {
        mainWindow.loadURL(`file://${path_1.default.join(__dirname, "../out/index.html")}`);
    }
    // Window control IPC handlers
    electron_1.ipcMain.on("window-minimize", () => {
        mainWindow?.minimize();
    });
    electron_1.ipcMain.on("window-maximize", () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.on("window-close", () => {
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
electron_1.app.whenReady().then(createWindow);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
//# sourceMappingURL=main.js.map