let account = "";
let password = "";
const SOCKET_URL = "wss://chatp.net:5333/server";
const ALLOWED_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
const ADDED_USERS = ["user1", "user2", "user3"];

let BANNED_USERS = [];

//websoket
let wsConnection = null;
let isConnected = false;

function genRandomStr(length) {
    return Array.from({length}, () => ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)]).join('');
}

function login() {
    const jsonbody = {handler: "login", id: genRandomStr(20), username: account, password: password};
    sendMessage(jsonbody);
}

function sendMessage(message) {
    if (isConnected) {
        logMessage("إرسال رسالة: " + JSON.stringify(message));
        // login msg
        setTimeout(() => handleResponse({handler: "login_event", type: "success"}), 1000);
    } else {
        logMessage("WebSocket غير متصل");
    }
}

function handlePvt(data) {
    const msg = data.body;
    const frm = data.from;

    if (msg.length > 8) {
        if (!BANNED_USERS.includes(frm)) {
            BANNED_USERS.push(frm);
            saveBannedUsers();
            logMessage(`تم حظر المستخدم ${frm} لإرسال رسالة أطول من 8 أحرف.`);
        }
        return;
    }

    logMessage(`استلام رسالة من ${frm}: ${msg}`);
}

function clearFriendRequests(data) {
    data.users.forEach(user => {
        const d_bro = user.username;
        const ddd = {handler: "profile_update", id: genRandomStr(20), type: "reject_friend", value: d_bro};
        sendMessage(ddd);
    });
    logMessage("تم مسح طلبات الصداقة");
}

function sendPvtMsg(frm, msg) {
    const jsonbody = {handler: "chat_message", id: genRandomStr(20), to: frm, type: "text", body: msg};
    sendMessage(jsonbody);
}

function handleResponse(data) {
    const handler = data.handler;
    const frm = data.from;

    if (handler === "login_event" && data.type === "success") {
        logMessage("تم تسجيل الدخول بنجاح ✅");
        isConnected = true;
    } else if (handler === "chat_message" && data.type === "text") {
        if (frm && !BANNED_USERS.includes(frm)) {
            handlePvt(data);
        }
    } else if (handler === "friend_requests") {
        clearFriendRequests(data);
    }
}

function saveBannedUsers() {
    localStorage.setItem('BANNED_USERS', JSON.stringify(BANNED_USERS));
    document.getElementById('bannedUsers').value = BANNED_USERS.join(', ');
}

function loadBannedUsers() {
    const savedUsers = localStorage.getItem('BANNED_USERS');
    if (savedUsers) {
        BANNED_USERS = JSON.parse(savedUsers);
        document.getElementById('bannedUsers').value = BANNED_USERS.join(', ');
    }
}

function saveSettings() {
    account = document.getElementById('username').value;
    password = document.getElementById('password').value;
    BANNED_USERS = document.getElementById('bannedUsers').value.split(',').map(u => u.trim());
    saveBannedUsers();
    logMessage("تم حفظ الإعدادات");
}

function startBot() {
    if (!account || !password) {
        logMessage("يرجى إدخال اسم المستخدم وكلمة المرور أولاً");
        return;
    }
    loadBannedUsers();
    logMessage("جارٍ تشغيل البوت...");
    login();
}

function stopBot() {
    isConnected = false;
    logMessage("تم إيقاف البوت");
}

function logMessage(message) {
    const logElement = document.getElementById('log');
    logElement.innerHTML += `<p>${new Date().toLocaleTimeString()} - ${message}</p>`;
    logElement.scrollTop = logElement.scrollHeight;
}

// app.dban
window.onload = function() {
    loadBannedUsers();
};
