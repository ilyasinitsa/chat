const net = require('net');
const tcpClient = net.Socket();

var messageBox = document.getElementById('messageBox');
var sendButton = document.getElementById('sendButton');
var messages = document.getElementById('messages');

tcpClient.connect(1234, '127.0.0.1', function() {
    tcpClient.setEncoding('utf8');

    tcpClient.on('data', function(data) {
        messages.innerHTML += '<b>' + data + '</b><br>' 
    });
});

sendButton.addEventListener('click', function() {
    tcpClient.write(messageBox.value);
    messageBox.value = null;
});