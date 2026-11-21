document.addEventListener('DOMContentLoaded', function () {
    // غيّر هذه الروابط إلى الروابط الخارجية المطلوبة
    const LOGIN_REDIRECT_URL = 'https://amine-stodio.netlify.app/';
    const REDIRECT_DELAY_MS = 1200; // مدة الانتظار قبل النقل (بالميلي ثانية)

    const STORAGE_KEY = 'auth_colors_users';

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    function showMessage(el, text, isError) {
        if (!el) return;
        el.textContent = text;
        el.classList.toggle('error', Boolean(isError));
    }

    // منع إعادة تحميل الصفحة عند إرسال النماذج
    document.querySelectorAll('form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
        });
    });

    // إنشاء حساب
    const signupForm = document.getElementById('signupForm');
    const signupMessage = document.getElementById('signupMessage');

    if (signupForm) {
        signupForm.addEventListener('submit', function () {
            const username = document.getElementById('signupUsername').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;

            const users = getUsers();
            const exists = users.some(function (u) {
                return u.username.toLowerCase() === username.toLowerCase();
            });

            if (exists) {
                showMessage(signupMessage, 'اسم المستخدم مستخدم بالفعل', true);
                return;
            }

            users.push({ username: username, email: email, password: password });
            saveUsers(users);
            signupForm.reset();

            showMessage(signupMessage, 'تم إنشاء حساب', false);
            setTimeout(function () {
                window.location.href = SIGNUP_REDIRECT_URL;
            }, REDIRECT_DELAY_MS);
        });
    }

    // تسجيل الدخول عبر اسم المستخدم
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function () {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            const users = getUsers();
            const user = users.find(function (u) {
                return u.username.toLowerCase() === username.toLowerCase() && u.password === password;
            });

            if (user) {
                loginForm.reset();
                showMessage(loginMessage, 'تم تسجيل دخول', false);
                setTimeout(function () {
                    window.location.href = LOGIN_REDIRECT_URL;
                }, REDIRECT_DELAY_MS);
            } else {
                showMessage(loginMessage, 'اسم المستخدم أو كلمة المرور غير صحيحة', true);
            }
        });
    }

    // تشغيل زر نسيت كلمة المرور
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const forgotModal = document.getElementById('forgotModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const forgotForm = document.getElementById('forgotForm');
    const resetUsername = document.getElementById('resetUsername');
    const resetStatus = document.getElementById('resetStatus');

    if (forgotPasswordBtn && forgotModal) {
        forgotPasswordBtn.addEventListener('click', function () {
            if (resetStatus) resetStatus.textContent = '';
            if (forgotForm) forgotForm.reset();
            forgotModal.classList.add('show');
            if (resetUsername) resetUsername.focus();
        });
    }

    if (closeModalBtn && forgotModal) {
        closeModalBtn.addEventListener('click', function () {
            forgotModal.classList.remove('show');
        });
    }

    if (forgotModal) {
        forgotModal.addEventListener('click', function (e) {
            if (e.target === forgotModal) {
                forgotModal.classList.remove('show');
            }
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', function () {
            const username = resetUsername ? resetUsername.value.trim() : '';
            if (username && resetStatus) {
                resetStatus.textContent = 'تم إرسال طلب استعادة كلمة المرور للمستخدم: ' + username;
            }
        });
    }

    // خلفية الهكر (hacker-new.jpeg) وحروف الماتريكس المتحركة
    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const matrixLayer = document.createElement('canvas');
    const mCtx = matrixLayer.getContext('2d');

    const chars = '0123456789ABCDEF@#$%&*<>';
    const charArray = chars.split('');
    const fontSize = 15;
    let columns = 0;
    let drops = [];

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        matrixLayer.width = canvas.width;
        matrixLayer.height = canvas.height;
        columns = Math.floor(canvas.width / fontSize);
        drops = Array(columns).fill(1).map(function () {
            return Math.floor(Math.random() * -25);
        });
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const hackerImg = new Image();
    hackerImg.src = 'hacker-new.jpeg';

    function drawScene() {
        if (!ctx) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (hackerImg.complete && hackerImg.naturalWidth > 0) {
            const scale = Math.min(canvas.width / hackerImg.width, canvas.height / hackerImg.height);
            const drawW = hackerImg.width * scale;
            const drawH = hackerImg.height * scale;
            const x = (canvas.width - drawW) / 2;
            const y = (canvas.height - drawH) / 2;

            ctx.drawImage(hackerImg, x, y, drawW, drawH);
        }

        mCtx.globalCompositeOperation = 'destination-out';
        mCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        mCtx.fillRect(0, 0, matrixLayer.width, matrixLayer.height);
        mCtx.globalCompositeOperation = 'source-over';

        mCtx.fillStyle = '#00ff41';
        mCtx.font = 'bold ' + fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            if (drops[i] >= 0) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                mCtx.fillText(text, i * fontSize, drops[i] * fontSize);
            }

            if (drops[i] * fontSize > matrixLayer.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }

        ctx.drawImage(matrixLayer, 0, 0);
    }

    setInterval(drawScene, 40);
});