const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'users.json');

// تخزين الجلسات النشطة في الذاكرة (مفتاح الجلسة -> بيانات المستخدم)
const activeSessions = new Map();

app.use(express.json());
app.use(express.static(__dirname));

function readUsers() {
    if (!fs.existsSync(DB_FILE)) {
        return [];
    }
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw) || [];
    } catch (err) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) {
        return false;
    }
    const [salt, key] = stored.split(':');
    const keyBuf = Buffer.from(key, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) {
        return false;
    }
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function createSessionToken(user) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
        id: user.id,
        username: user.username,
        createdAt: Date.now()
    });
    return token;
}

function getUserFromRequest(req) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return null;
    return activeSessions.get(token) || null;
}

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// التحقق من وجود جلسة محفوظة وصحيحة
app.get('/api/me', (req, res) => {
    const sessionUser = getUserFromRequest(req);
    if (!sessionUser) {
        return res.status(401).json({ loggedIn: false });
    }
    return res.json({
        loggedIn: true,
        user: {
            id: sessionUser.id,
            username: sessionUser.username
        }
    });
});

// تسجيل خروج وإلغاء الجلسة المحفوظة
app.post('/api/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) {
        activeSessions.delete(token);
    }
    return res.json({ message: 'تم تسجيل الخروج' });
});

// إنشاء حساب جديد
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim();

    if (!cleanUsername || !cleanEmail || String(password).length < 4) {
        return res.status(400).json({ message: 'يرجى إدخال بيانات صحيحة' });
    }

    const users = readUsers();
    const exists = users.some(
        (u) => String(u.username).toLowerCase() === cleanUsername.toLowerCase()
    );

    if (exists) {
        return res.status(409).json({ message: 'اسم المستخدم مستخدم بالفعل' });
    }

    const newUser = {
        id: crypto.randomUUID(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash: hashPassword(String(password)),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    const token = createSessionToken(newUser);

    return res.status(201).json({
        message: 'تم إنشاء حساب',
        token,
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email
        }
    });
});

// تسجيل الدخول عبر اسم المستخدم وإرجاع رمز الجلسة
app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const cleanUsername = String(username).trim();
    const users = readUsers();
    const user = users.find(
        (u) => String(u.username).toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!user || !verifyPassword(String(password), user.passwordHash)) {
        return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = createSessionToken(user);

    return res.json({
        message: 'تم تسجيل دخول',
        token,
        user: {
            id: user.id,
            username: user.username
        }
    });
});

// استعادة كلمة المرور عبر اسم المستخدم
app.post('/api/forgot-password', (req, res) => {
    const { username } = req.body || {};

    if (!username || !String(username).trim()) {
        return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم' });
    }

    const cleanUsername = String(username).trim();
    const users = readUsers();
    const user = users.find(
        (u) => String(u.username).toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!user) {
        return res.status(404).json({ message: 'اسم المستخدم غير موجود' });
    }

    return res.json({
        message: `تم إرسال طلب استعادة كلمة المرور للمستخدم: ${user.username}`
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
