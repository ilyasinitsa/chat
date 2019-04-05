const electron = require('electron');
const ipc = require('electron').ipcMain;
const net = require('net');
const dgram = require('dgram');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let isLoged = false; 
let appWindow;
let loginWindow;
let login;
let tcpClient;

//Вход в программу
ipc.on('login', (event, arg) => {

    login = arg.login;

    tcpClient.write(JSON.stringify({
        type: 'login',
        login: arg.login,
        password: arg.password
    }));
});

//Отправка сообщения на сервер
ipc.on('TCP-message', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'message',
        sender: login,
        content: arg
    }));
});

//Запуск приложения
app.on('ready', () => {
    tcpSetup();
    createWindow();
});

//Выход из приложения
app.on('window-all-closed', () => {
    app.quit();
    
    if (isLoged) {
        tcpClient.end();
    }
});

// Создание окон
const createWindow = () => {
    loginWindow = new BrowserWindow({frame: false, minHeight: 480, minWidth: 640});
    // loginWindow.webContents.openDevTools();
    loginWindow.setMenu(null);
    loginWindow.loadFile('./login/login.html');
}

//Создание TCP подключения
const tcpSetup = () => {
    tcpClient = net.createConnection(9966, '127.0.0.1');

    tcpClient.setEncoding('utf8');

    tcpClient.on('data', (data) => {
        if (JSON.parse(data).type == 'login-confirm') {
            if (JSON.parse(data).confirm) {
                isLoged = true;
                appWindow = new BrowserWindow({minWidth: 640, minHeight: 480, frame: false});
                // appWindow.webContents.openDevTools();
                appWindow.loadFile('./app/index.html');
                loginWindow.close();
            }
            else {
                loginWindow.webContents.send('login-confirm', 'error');
            }
        }
        else {
            appWindow.webContents.send('TCP-message-print', data);                        
        }
    });
}