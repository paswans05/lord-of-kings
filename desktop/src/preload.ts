import { contextBridge, ipcRenderer } from "electron";

// Expose safe Electron APIs to renderer window
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isDesktop: true,
  sendMessage: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data);
  },
  onMessage: (channel: string, callback: (event: unknown, ...args: unknown[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
});
