// المتغيرات الثابتة
const SOCKET_URL = "wss://chatp.net:5333/server";
const ALLOWED_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
const ADDED_USERS = ["user1", "user2", "user3"];

// المتغيرات القابلة للتغيير
let account = "";
let password = "";
let BANNED_USERS = [];
let ws = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// توليد سلسلة عشوائية
function genRandomStr(length) {
    return Array.from({length}, () => ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)]).join('');
}

// إنشاء اتصال WebSocket
function connectWebSocket() {
    logMessage("جارٍ محاولة الاتصال...");
    ws = new WebSocket(SOCKET_URL);

    ws.onopen = function() {
        logMessage("تم فتح اتصال WebSocket");
        isConnected = true;
        reconnectAttempts = 0;
        login();
    };

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleResponse(data);
    };

    ws.onerror = function(error) {
        logMessage("حدث خطأ في WebSocket: " + error.message);
    };

    ws.onclose = function(event) {
        isConnected = false;
        logMessage("تم إغلاق اتصال WebSocket. الكود: " + event.code + ", السبب: " + event.reason);
        reconnect();
    };
}

// إعادة الاتصال
function reconnect() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        logMessage(`محاولة إعادة الاتصال ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
        setTimeout(connectWebSocket, 5000);
    } else {
        logMessage("فشلت جميع محاولات إعادة الاتصال. يرجى التحقق من اتصال الإنترنت والإعدادات.");
    }
}

// تسجيل الدخول
function login() {
    if (isConnected) {
        const jsonbody = {handler: "login", id: genRandomStr(20), username: account, password: password};
        sendMessage(jsonbody);
    } else {
        logMessage("WebSocket غير متصل. جارٍ محاولة الاتصال...");
        connectWebSocket();
    }
}

// إرسال رسالة
function sendMessage(message) {
    if (isConnected) {
        logMessage("إرسال رسالة: " + JSON.stringify(message));
        ws.send(JSON.stringify(message));
    } else {
        logMessage("WebSocket غير متصل. جارٍ محاولة إعادة الاتصال...");
        connectWebSocket();
    }
}

// معالجة الرسائل الخاصة
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

// مسح طلبات الصداقة
function clearFriendRequests(data) {
    data.users.forEach(user => {
        const d_bro = user.username;
        const ddd = {handler: "profile_update", id: genRandomStr(20), type: "reject_friend", value: d_bro};
        sendMessage(ddd);
    });
    logMessage("تم مسح طلبات الصداقة");
}

// إرسال رسالة خاصة
function sendPvtMsg(frm, msg) {
    const jsonbody = {handler: "chat_message", id: genRandomStr(20), to: frm, type: "text", body: msg};
    sendMessage(jsonbody);
}

// معالجة الاستجابات
function handleResponse(data) {
    const handler = data.handler;
    const frm = data.from;

    if (handler === "login_event" && data.type === "success") {
        logMessage("تم تسجيل الدخول بنجاح ✅");
    } else if (handler === "chat_message" && data.type === "text") {
        if (frm && !BANNED_USERS.includes(frm)) {
            handlePvt(data);
        }
    } else if (handler === "friend_requests") {
        clearFriendRequests(data);
    }
}

// حفظ المستخدمين المحظورين
function saveBannedUsers() {
    localStorage.setItem('BANNED_USERS', JSON.stringify(BANNED_USERS));
    document.getElementById('bannedUsers').value = BANNED_USERS.join(', ');
}

// تحميل المستخدمين المحظورين
function loadBannedUsers() {
    const savedUsers = localStorage.getItem('BANNED_USERS');
    if (savedUsers) {
        BANNED_USERS = JSON.parse(savedUsers);
        document.getElementById('bannedUsers').value = BANNED_USERS.join(', ');
    }
}

// حفظ الإعدادات
function saveSettings() {
    account = document.getElementById('username').value;
    password = document.getElementById('password').value;
    BANNED_USERS = document.getElementById('bannedUsers').value.split(',').map(u => u.trim());
    saveBannedUsers();
    logMessage("تم حفظ الإعدادات");
}

// بدء تشغيل البوت
function startBot() {
    if (!account || !password) {
        logMessage("يرجى إدخال اسم المستخدم وكلمة المرور أولاً");
        return;
    }
    loadBannedUsers();
    logMessage("جارٍ تشغيل البوت...");
    connectWebSocket();
}

// إيقاف البوت
function stopBot() {
    if (ws) {
        ws.close();
    }
    isConnected = false;
    logMessage("تم إيقاف البوت");
}

// تسجيل الرسائل
function logMessage(message) {
    const logElement = document.getElementById('log');
    logElement.innerHTML += `<p>${new Date().toLocaleTimeString()} - ${message}</p>`;
    logElement.scrollTop = logElement.scrollHeight;
}

// تحميل الإعدادات عند بدء التطبيق
window.onload = function() {
    loadBannedUsers();
};
