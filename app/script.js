const {dialog} = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const customTitlebar = require('custom-electron-titlebar');

let micRecordButton = document.getElementById('mic-record');
let messageSendButton = document.getElementById('message-send');
let messageArea = document.getElementById('message-area');
let messagesPanel = document.getElementById('messages-panel');
let groupList = document.getElementById('groups-panel');

let recording = false;
var currentMessagingType = 'none';
var currentGroup;

new customTitlebar.Titlebar({
    menu: false,
    backgroundColor: customTitlebar.Color.fromHex('#444')
});

navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(stream => {
    let recordedAudio;
    const recorder = new MediaRecorder(stream);

    micRecordButton.addEventListener('click', () => {
        if (!recording) {
            recording = true;
            messageArea.disabled = true;
            micRecordButton.style.backgroundColor = '#d62828';
            micRecordButton.style.color = '#fff';
            // recorder.start();
        } else {
            recording = false;
            messageArea.disabled = false;
            micRecordButton.style = '';
            // recorder.stop();
        }
    });
    
    var chunks = Array(); 
    
    recorder.addEventListener('dataavailable', (event) => {
        chunks.push(event.data);
                
        recordedAudio = new Blob(chunks.splice(0, chunks.length));

        const audio = new Audio(URL.createObjectURL(recordedAudio));
        audio.style.height = '32px';
        audio.controls = true;

        document.body.appendChild(document.createElement('br'));
        document.body.appendChild(audio);
        document.body.appendChild(document.createElement('br'));
    });
});

messageArea.oninput = () => {
    buttonChange();
}

messageArea.onkeydown = (event) => {
    if (event.code === 'Enter' && messageArea.value != '') {
        messageSendButton.click();
    }
}

messageSendButton.addEventListener('click', () => {
    ipc.send('message-send', {
        messageType: currentMessagingType,
        messageText: messageArea.value,
        groupName: currentGroup.dataset.group_name
    });
    messageArea.value = '';
    buttonChange(); 
});

const messageDisplay = (sender, content) => {
    let message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = '<div class="sender-icon"><i class="far fa-user"></i></div><div><div class="message-sender-login">' + sender + '</div><div class="message-content-wrapper"><div class="message-content">' + content.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div></div>';
    messagesPanel.appendChild(message);
    messagesPanel.scrollTop = messagesPanel.scrollHeight;
}

const buttonChange = () => {
    if (messageArea.value != '' && !recording) {
        messageSendButton.style.display = 'initial';
        micRecordButton.style.display = 'none';
    } else {
        messageSendButton.style.display = 'none';
        micRecordButton.style.display = 'initial';
    }
}

const groupChange = (group) => {
    currentMessagingType = 'group';
    currentGroup = group;
    document.querySelector('.placeholder').style.display = 'none';
    document.querySelector('.chat-header').style.display = 'block';
    document.querySelector('.messages-panel').style.display = 'block';
    document.querySelector('.input-panel').style.display = 'grid';

    ipc.send('group-messages-get', currentGroup.dataset.group_name);
}

ipc.on('groups-display', (event, arg) => {
    currentGroup = '';
    for (i in arg) {
        let group = document.createElement('div');
        group.dataset.group_name = arg[i].name;
        group.className = 'group';
        group.innerHTML = '<div class="group-icon"></div><span class ="group-name">' + arg[i].name + '</span>';

        group.addEventListener('click', event => {
            groupChange(group); 
        });

        groupList.appendChild(group);
    }
});

ipc.on('message-display', (event, arg) => {
    if (arg.messageType === 'group' && currentGroup.dataset.group_name === arg.groupName) {
        messageDisplay(arg.sender, arg.content);
    }
});

ipc.on('group-online-display', (event, arg) => {
    document.querySelector('.chat-header').innerHTML = arg;
});

ipc.on('group-messages-display', (event, arg) => {
    document.querySelector('.chat-header').innerHTML = arg.groupOnline;
    messagesPanel.innerHTML = '';
    for (i in arg.groupMessages) {
        messageDisplay(arg.groupMessages[i].login, arg.groupMessages[i].message);
    }
});

window.onload = () => {
    ipc.send('get-groups');
}