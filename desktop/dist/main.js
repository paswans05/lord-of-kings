import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
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
    const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    if (isDev) {
        mainWindow.loadURL(devUrl).catch(() => {
            console.log("[Desktop] Retrying loading dev server...");
            setTimeout(() => mainWindow?.loadURL(devUrl), 2000);
        });
    }
    else {
        // In production, load compiled web build from ../web/dist/index.html
        const webDistPath = path.join(__dirname, "../../web/dist/index.html");
        mainWindow.loadFile(webDistPath).catch((err) => {
            console.error("[Desktop] Failed to load production bundle:", err);
            // Fallback to dev server
            mainWindow?.loadURL(devUrl);
        });
    }
    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http:") || url.startsWith("https:")) {
            void shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
