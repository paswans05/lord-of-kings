import { contextBridge, ipcRenderer } from "electron";
// Expose safe Electron APIs to renderer window
contextBridge.exposeInMainWorld("electronAPI", {
    platform: process.platform,
    isDesktop: true,
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel, callback) => {
        ipcRenderer.on(channel, callback);
    },
});
