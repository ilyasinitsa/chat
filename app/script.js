const ipc = require('electron').ipcRenderer;
const customTitlebar = require('custom-electron-titlebar');

let micRecordButton = document.getElementById('mic-record');
let messageSendButton = document.getElementById('message-send');
let messageArea = document.getElementById('message-area');
let messagesPanel = document.getElementById('messages-panel');
let groupList = document.getElementById('groups-panel');

let recording = false;
var currentGroup = '';

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
    ipc.send('message-send', messageArea.value);
    messageArea.value = '';
    buttonChange(); 
});

const messageDisplay = (messageData) => {
    let message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = '<div class="message-user-icon"></div><span class="message-user-login">' + messageData.sender + '</span><div class="message-user-content">' + messageData.content.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>';
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

const currentGroupUpdate = (group) => {
    currentGroup = group;
    console.log(currentGroup);
    ipc.send('group-online-get', currentGroup.dataset.group_name);
}

ipc.on('groups-display', (event, arg) => {
    currentGroup = '';
    for (i in arg) {
        let group = document.createElement('div');
        group.dataset.group_name = arg[i].name;
        group.className = 'group';
        group.innerHTML = '<div class="group-icon"></div><span class ="group-name">' + arg[i].name + '</span>';

        group.addEventListener('click', event => {
            currentGroupUpdate(group); 
        });

        groupList.appendChild(group);
    }
});

ipc.on('message-print', (event, arg) => {
    messageDisplay(JSON.parse(arg));
});

ipc.on('group-online-get-result', (event, arg) => {
    document.querySelector('.chat-header').innerHTML = arg;
})

window.onload = () => {
    ipc.send('get-groups', );
}