const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

function createWindow() {
    appWindow = new BrowserWindow({
        frame: false,
        width: 300,
        height: 300
    });

    appWindow.loadFile('./app/index.html');
    // appWindow.webContents.openDevTools();
}