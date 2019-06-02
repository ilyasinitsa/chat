const {dialog} = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const customTitlebar = require('custom-electron-titlebar');
const moment = require('moment');

let micRecordButton = document.getElementById('mic-record');
let messageSendButton = document.getElementById('message-send');
let messageArea = document.getElementById('message-area');
let messagesPanel = document.getElementById('messages-panel');
let groupList = document.getElementById('groups-panel');
let settingsButton = document.querySelector('.configuration');

let recording = false;
let currentMessagingType = 'none';
let currentGroup;
let lastMessageTime = ''; 

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

settingsButton.onclick = () => {
    ipc.send('user-data-get', '');
    let fadeBackground = document.createElement('div');
    fadeBackground.className = 'fade-background';
    fadeBackground.innerHTML = '<div class="settings-wrapper"><div class="settings-side-panel"><span class="settings-label">Настройки</span><div class="user-data-panel"><div class="user-data-icon"><i class="far fa-user"></i></div><span>Имя</span><input id="userNameInput" type="text"><span>Фамилия</span><input id="userLastNameInput" type="text"><span>Логин</span><input id="userLoginInput" type="text"><button id="userDataSaveChanges">Сохранить</button></div></div><div class="group-create-wrapper"><div class="group-create-icon"><i class="fas fa-user-friends"></i><i class="fas fa-plus"></i></div><button id="groupCreateStart">Создать свою группу</button></div></div>'
    fadeBackground.onclick = () => {
        document.querySelector('.container-after-titlebar').removeChild(fadeBackground);
    }
    document.querySelector('.container-after-titlebar').appendChild(fadeBackground);
    document.querySelector('.settings-wrapper').addEventListener('click', event => event.stopPropagation());
    document.querySelector('#userDataSaveChanges').addEventListener('click', () => {
        ipc.send('user-data-changes-save', {
            name: document.querySelector('#userNameInput').value,
            lastName: document.querySelector('#userLastNameInput').value,
            login: document.querySelector('#userLoginInput').value
        });
        document.querySelector('.container-after-titlebar').removeChild(fadeBackground);
    });
    document.querySelector('#groupCreateStart').addEventListener('click', () => {
        fadeBackground.removeChild(document.querySelector('.settings-wrapper'));
        fadeBackground.innerHTML = '<div class="group-create-window"><div class="group-create-window-info"><div class="group-create-window-label">Создание группы</div><div class="group-create-window-message">Введите название для создаваемой группы и нажмите "Создать"<br><br> После успешного создания группы вам будет выдан уникальный код, с помощью которого вы сможете пригласить своих друзей</div></div><div class="group-create-name"><span>Название группы</span><input id="groupNameInput" type="text"><button id="groupCreate">Создать</button></div></div>';
        document.querySelector('.group-create-window').addEventListener('click', event => event.stopPropagation());
        document.querySelector('#groupCreate').addEventListener('click', () => {
            if (document.querySelector('#groupNameInput').value != '') {
                ipc.send('group-create', document.querySelector('#groupNameInput').value);
            }
        })
    });
}

const messageDisplay = (sender, content, sendTime) => {
    let message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = '<div class="sender-icon"><i class="far fa-user"></i></div><div><div class="message-sender-login">' + sender + '</div><div class="message-content-wrapper"><div class="message-content">' + content.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div><div class="send-time">' + moment(sendTime).format('HH:mm') + '</div></div>';

    if (lastMessageTime === '' || lastMessageTime != moment(sendTime).format('dddd, DD MMMM YYYY')) {
        messagesDateSplitter = document.createElement('div');
        messagesDateSplitter.className = 'messages-date-splitter';
        messagesDateSplitter.innerHTML = moment(sendTime).format('dddd, DD MMMM YYYY');
        messagesPanel.appendChild(messagesDateSplitter);
        lastMessageTime = moment(sendTime).format('dddd, DD MMMM YYYY');
    }

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
    document.querySelector('.chat-header').style.display = 'grid';
    document.querySelector('.messages-panel').style.display = 'block';
    document.querySelector('.input-panel').style.display = 'grid';

    ipc.send('group-data-get', currentGroup.dataset.group_name);
}

ipc.on('groups-display', (event, arg) => {
    currentGroup = '';
    for (i in arg) {
        let group = document.createElement('div');
        group.dataset.group_name = arg[i].name;
        group.className = 'group';
        group.innerHTML = '<div class="group-icon"><i class="fas fa-user-friends"></i></div><span class ="group-name">' + arg[i].name + '</span>';

        group.addEventListener('click', event => {
            groupChange(group); 
        });

        groupList.appendChild(group);
    }
});

ipc.on('message-display', (event, arg) => {
    if (arg.messageType === 'group' && currentGroup.dataset.group_name === arg.groupName) {
        messageDisplay(arg.sender, arg.content, arg.sendTime);
    }
});

ipc.on('group-online-display', (event, arg) => {
    document.querySelector('.chat-header').innerHTML = arg;
});

ipc.on('group-data-display', (event, arg) => {
    document.querySelector('.chat-header').innerHTML = '<div class="group-header-logo"><i class="fas fa-user-friends"></i></div><div class="group-header-name">' + currentGroup.dataset.group_name + '</div><div class="group-header-online">Пользователей онлайн: ' + arg.groupOnline + '</div><div class="group-header-more"><i class="fas fa-ellipsis-v"></i></div>';
    messagesPanel.innerHTML = '';

    for (i in arg.groupMessages) {
        messageDisplay(arg.groupMessages[i].login, arg.groupMessages[i].message, arg.groupMessages[i].send_time);
    }
});

ipc.on('user-data-display', (event, arg) => {
    document.querySelector('#userNameInput').value = arg.userName;
    document.querySelector('#userLastNameInput').value = arg.userLastName;
    document.querySelector('#userLoginInput').value = arg.userLogin;
});

window.onload = () => {
    moment.locale('ru');
    ipc.send('get-groups');
}