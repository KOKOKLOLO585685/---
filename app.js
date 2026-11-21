document.addEventListener('DOMContentLoaded', function () {
    // روابط التنزيل الخارجية بعد تسجيل الدخول
    const SIGNUP_REDIRECT_URL = 'https://example.com/welcome';
    const XMOD_DOWNLOAD_URL = 'https://example.com/download/xmod';
    const DEV_SERVER_DOWNLOAD_URL = 'https://example.com/download/dev-server';
    const REDIRECT_DELAY_MS = 900;

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

    // عناصر نافذة الاختيار بعد تسجيل الدخول
    const choiceModal = document.getElementById('choiceModal');
    const xmodBtn = document.getElementById('xmodBtn');
    const devServerBtn = document.getElementById('devServerBtn');
    const choiceStatus = document.getElementById('choiceStatus');

    function openChoiceModal(username) {
        if (choiceStatus) {
            choiceStatus.textContent = username ? 'مرحبًا ' + username + '، اختر وجهتك.' : '';
        }
        if (choiceModal) {
            choiceModal.classList.add('show');
        }
    }

    if (xmodBtn) {
        xmodBtn.addEventListener('click', function () {
            if (choiceStatus) {
                choiceStatus.textContent = 'جاري الانتقال إلى رابط تنزيل إكس مود...';
            }
            setTimeout(function () {
                window.location.href = XMOD_DOWNLOAD_URL;
            }, REDIRECT_DELAY_MS);
        });
    }

    if (devServerBtn) {
        devServerBtn.addEventListener('click', function () {
            if (choiceStatus) {
                choiceStatus.textContent = 'جاري الانتقال إلى رابط تنزيل سيرفر المطورين...';
            }
            setTimeout(function () {
                window.location.href = DEV_SERVER_DOWNLOAD_URL;
            }, REDIRECT_DELAY_MS);
        });
    }

    // إنشاء حساب عبر السيرفر
    const signupForm = document.getElementById('signupForm');
    const signupMessage = document.getElementById('signupMessage');

    if (signupForm) {
        signupForm.addEventListener('submit', async function () {
            const username = document.getElementById('signupUsername').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;

            try {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();

                if (!res.ok) {
                    showMessage(signupMessage, data.message || 'حدث خطأ', true);
                    return;
                }

                signupForm.reset();
                showMessage(signupMessage, data.message || 'تم إنشاء حساب', false);
                setTimeout(function () {
                    window.location.href = SIGNUP_REDIRECT_URL;
                }, REDIRECT_DELAY_MS);
            } catch {
                showMessage(signupMessage, 'تعذر الاتصال بالسيرفر', true);
            }
        });
    }

    // تسجيل الدخول عبر اسم المستخدم ثم فتح نافذة اختيار إكس مود أو سيرفر المطورين
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async function () {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();

                if (!res.ok) {
                    showMessage(loginMessage, data.message || 'بيانات غير صحيحة', true);
                    return;
                }

                loginForm.reset();
                showMessage(loginMessage, data.message || 'تم تسجيل دخول', false);
                setTimeout(function () {
                    openChoiceModal(data.user && data.user.username ? data.user.username : username);
                }, 400);
            } catch {
                showMessage(loginMessage, 'تعذر الاتصال بالسيرفر', true);
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
        forgotForm.addEventListener('submit', async function () {
            const username = resetUsername ? resetUsername.value.trim() : '';
            if (!username || !resetStatus) return;

            try {
                const res = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                const data = await res.json();
                resetStatus.textContent = data.message || 'تم إرسال الطلب';
            } catch {
                resetStatus.textContent = 'تعذر الاتصال بالسيرفر';
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
