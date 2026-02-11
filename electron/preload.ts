// Elektronin preload-skripti. Altistaa turvalliset IPC-metodit selaimen kontekstille.

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  onMaximized: (callback: (maximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, maximized: boolean) =>
      callback(maximized);
    ipcRenderer.on("window-maximized", handler);
    return () => {
      ipcRenderer.removeListener("window-maximized", handler);
    };
  },

  storeGet: (key: string) => ipcRenderer.invoke("store-get", key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke("store-set", key, value),
});
