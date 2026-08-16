import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "King's Fall: Dravida 3D Chess",
    backgroundColor: "#0c0914",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Enable WebGL hardware acceleration
  app.commandLine.appendSwitch("ignore-gpu-blocklist");
  app.commandLine.appendSwitch("enable-gpu-rasterization");
  app.commandLine.appendSwitch("enable-zero-copy");

  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:8080";
  const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

  const possiblePaths = [
    path.join(__dirname, "../renderer/index.html"),
    path.join(app.getAppPath(), "dist/renderer/index.html"),
    path.join(app.getAppPath(), "renderer/index.html"),
  ];

  const foundPath = possiblePaths.find((p) => fs.existsSync(p));

  const tryLoad = async () => {
    if (isDev) {
      try {
        const res = await fetch(devUrl).catch(() => null);
        if (res) {
          console.log("[Desktop] Connected to dev server:", devUrl);
          await mainWindow?.loadURL(devUrl);
          return;
        }
      } catch {}
    }

    if (foundPath) {
      console.log("[Desktop] Loading local renderer build:", foundPath);
      await mainWindow?.loadFile(foundPath);
    } else {
      console.log("[Desktop] Connecting to:", devUrl);
      mainWindow?.loadURL(devUrl).catch(() => {
        console.log("[Desktop] Retrying loading dev server...");
        setTimeout(() => mainWindow?.loadURL(devUrl), 2000);
      });
    }
  };

  void tryLoad();

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // DevTools toggle with F12
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" && input.type === "keyDown") {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Log renderer console errors to terminal
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error(`[Renderer Error ${level}] ${message} (${sourceId}:${line})`);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
