const electron = require('electron');
const ipc = require('electron').ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let appWindow;
let loginWindow;

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

function createWindow() {
    loginWindow = new BrowserWindow({width: 400, height: 400, resizable: false});
    // loginWindow.webContents.openDevTools();
    // loginWindow.setMenu(null);
    loginWindow.loadFile('./login/login.html');
}

ipc.on('login', (event, arg) => {
    if(arg = 'check') {
        appWindow = new BrowserWindow({width: 640, height: 480});
        appWindow.loadFile('./app/index.html');
        loginWindow.close();
    }
});