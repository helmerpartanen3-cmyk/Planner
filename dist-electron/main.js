"use strict";
// Elektronin pääprosessi. Hallinnoi sovelluksen ikkunan ja tietojen säilöntää.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storeDir = path_1.default.join(electron_1.app.getPath("userData"), "data");
if (!fs_1.default.existsSync(storeDir))
    fs_1.default.mkdirSync(storeDir, { recursive: true });
function storeFile(key) {
    return path_1.default.join(storeDir, `${key}.json`);
}
function storeGet(key) {
    try {
        const raw = fs_1.default.readFileSync(storeFile(key), "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function storeSet(key, value) {
    fs_1.default.writeFileSync(storeFile(key), JSON.stringify(value), "utf-8");
}
let mainWindow = null;
electron_1.ipcMain.handle("store-get", (_event, key) => storeGet(key));
electron_1.ipcMain.handle("store-set", (_event, key, value) => storeSet(key, value));
function createWindow() {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new electron_1.BrowserWindow({
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
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    const isDev = !electron_1.app.isPackaged;
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        const outPath = path_1.default.join(electron_1.app.getAppPath(), "out/index.html");
        const fileUrl = `file://${outPath}`.replace(/\\/g, "/");
        mainWindow.loadURL(fileUrl);
    }
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
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
//# sourceMappingURL=main.js.map