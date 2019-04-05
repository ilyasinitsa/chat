const ipc = require('electron').ipcRenderer;
const customTitlebar = require('@inceldes/cet');

new customTitlebar.Titlebar({
    menu: false,
    backgroundColor: customTitlebar.Color.fromHex('#444')
});

var messageArea = document.getElementById('message-input');
var sendButton = document.getElementById('sendButton');
var messages = document.getElementById('messages');

ipc.on('TCP-message-print', (event, arg) => {
    messages.innerHTML += '<div class="message">' + JSON.parse(arg).sender + ': ' + JSON.parse(arg).content + '</div>';
});

const messageSend = (event) => {
    if (event.keyCode == 13) {
        if (messageArea.value != '') {
            ipc.send('TCP-message', messageArea.value);
            messageArea.value='';
        }
    }
}