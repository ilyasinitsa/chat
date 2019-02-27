const net = require('net');
const dgram = require('dgram');

var userName = document.getElementById('userName');
var messageArea = document.getElementById('messageArea');
var sendButtonTCP = document.getElementById('sendButtonTCP');
var sendButtonUDP = document.getElementById('sendButtonUDP');
var messages = document.getElementById('messages');

var udpClient = dgram.createSocket('udp4');

udpClient.on('message', (msg) => {
    messages.innerText += msg;
    messages.innerHTML += '<br>';
});

var tcpClient = net.createConnection(9966, '127.0.0.1', () => {
    tcpClient.setEncoding('utf8');

    tcpClient.on('data', (data) => {
        messages.innerText += data;
        messages.innerHTML += '<br>';
    });
});

sendButtonTCP.addEventListener('click', () => {
    tcpClient.write(messageArea.value);
    messageArea.value = '';
});

sendButtonUDP.addEventListener('click', () => {
    udpClient.send(messageArea.value, 9967, '127.0.0.1');
    messageArea.value = '';
})