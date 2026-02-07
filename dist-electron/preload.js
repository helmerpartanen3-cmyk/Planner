"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    minimize: () => electron_1.ipcRenderer.send("window-minimize"),
    maximize: () => electron_1.ipcRenderer.send("window-maximize"),
    close: () => electron_1.ipcRenderer.send("window-close"),
    onMaximized: (callback) => {
        const handler = (_event, maximized) => callback(maximized);
        electron_1.ipcRenderer.on("window-maximized", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("window-maximized", handler);
        };
    },
    // Persistent file store
    storeGet: (key) => electron_1.ipcRenderer.invoke("store-get", key),
    storeSet: (key, value) => electron_1.ipcRenderer.invoke("store-set", key, value),
});
//# sourceMappingURL=preload.js.map