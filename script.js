<canvas id="canvas"></canvas>
<audio id="bgm" src="bgm.mp3" loop></audio>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
bgm.volume = 0.3;

let W, H;

/* ================= 유틸 ================= */

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function resize() {
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    W = window.innerWidth;
    H = window.innerHeight;

    initScene();
}

window.addEventListener('resize', resize);

/* ================= 데이터 ================= */

let stars = [];
let shootingStars = [];
let trees = [];
let hill = [];

let skyOffsetX = 0;
let moonPhase = 0;

function initScene() {
    stars = [];
    shootingStars = [];
    trees = [];
    hill = [];

    /* ---- 별 (parallax) ---- */
    for (let i = 0; i < 260; i++) {
        stars.push({
            x: rand(0, W),
            y: rand(0, H * 0.75),
            r: rand(0.5, 1.8),
            tw: rand(0, Math.PI * 2),
            twSpeed: rand(0.002, 0.008),
            depth: rand(0.15, 1) // ⭐ 깊이감
        });
    }

    /* ---- 유성 ---- */
    for (let i = 0; i < 12; i++) {
        shootingStars.push({
            x: rand(W * 0.2, W * 0.9),
            y: rand(0, H * 0.3),
            speed: rand(7, 14),
            delay: rand(0, 400),
            trail: []
        });
    }

    /* ---- 언덕 ---- */
    const hillHeight = H * 0.28;
    const hillCount = 6;

    for (let i = 0; i <= hillCount; i++) {
        hill.push({
            x: (i / hillCount) * W,
            y: H - hillHeight - rand(10, 80)
        });
    }

    /* ---- 나무 ---- */
    function getHillY(x) {
        for (let i = 1; i < hill.length; i++) {
            const p0 = hill[i - 1];
            const p1 = hill[i];
            if (x >= p0.x && x <= p1.x) {
                const t = (x - p0.x) / (p1.x - p0.x);
                return p0.y + (p1.y - p0.y) * t;
            }
        }
        return H - hillHeight;
    }

    for (let i = 0; i < 7; i++) {
        const x = rand(0, W);
        trees.push({
            x,
            y: getHillY(x) - rand(5, 30),
            h: rand(35, 80),
            w: rand(10, 18)
        });
    }
}

/* ================= 그리기 ================= */

function drawMilkyWay(strength) {
    const grad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.7);
    grad.addColorStop(0, 'rgba(255,210,255,0)');
    grad.addColorStop(0.5, `rgba(255,210,255,${0.25 * strength})`);
    grad.addColorStop(1, 'rgba(255,210,255,0)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(W * 0.15, H * 0.2);
    ctx.rotate(-0.25);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W * 0.8, H * 0.6);
    ctx.restore();
}

function drawMoon() {
    const x = W * 0.78;
    const y = H * 0.25;
    const r = Math.min(W, H) * 0.07;

    /* 글로우 */
    const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2);
    glow.addColorStop(0, 'rgba(255,255,255,0.5)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();

    /* 본체 */
    ctx.fillStyle = '#fff9f5';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    /* 🌙 크레이터 */
    ctx.fillStyle = 'rgba(220,220,220,0.35)';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(
            x + rand(-r * 0.4, r * 0.4),
            y + rand(-r * 0.4, r * 0.4),
            rand(r * 0.05, r * 0.15),
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    /* 위상 */
    const phase = Math.sin(moonPhase * Math.PI);
    const offset = r * (0.6 - phase * 1.2);
    ctx.fillStyle = 'rgba(10,10,30,0.35)';
    ctx.beginPath();
    ctx.arc(x + offset, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/* ================= 애니메이션 ================= */

function animate() {
    ctx.clearRect(0, 0, W, H);

    skyOffsetX = (skyOffsetX + 0.012) % W;
    moonPhase += 0.00006;

    /* ---- 하늘 ---- */
    ctx.save();
    ctx.translate(-skyOffsetX, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, 'rgb(255,178,240)');
    sky.addColorStop(0.35, 'rgb(154,75,255)');
    sky.addColorStop(0.7, 'rgb(43,10,74)');
    sky.addColorStop(1, 'rgb(5,1,10)');
    ctx.fillStyle = sky;
    ctx.fillRect(skyOffsetX, 0, W, H);

    drawMilkyWay(0.9);

    ctx.globalCompositeOperation = 'screen';
    stars.forEach(s => {
        s.tw += s.twSpeed;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(s.tw) * 0.6})`;
        ctx.beginPath();
        ctx.arc(
            s.x + skyOffsetX * s.depth,
            s.y,
            s.r,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    ctx.restore();

    /* ---- 달 ---- */
    drawMoon();

    /* ---- 유성 ---- */
    shootingStars.forEach(sh => {
        if (sh.delay-- > 0) return;

        sh.x -= sh.speed;
        sh.y += sh.speed * 0.6;
        sh.trail.push({ x: sh.x, y: sh.y });
        if (sh.trail.length > 20) sh.trail.shift();

        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(sh.trail[0].x, sh.trail[0].y);
        sh.trail.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        if (sh.x < -200 || sh.y > H + 200) {
            sh.x = rand(W * 0.2, W * 0.9);
            sh.y = rand(0, H * 0.3);
            sh.delay = rand(120, 500);
            sh.trail = [];
        }
    });

    /* ---- 지형 ---- */
    ctx.fillStyle = 'rgb(10,6,25)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    hill.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(W, H);
    ctx.fill();

    ctx.fillStyle = 'rgb(6,3,20)';
    trees.forEach(tr => {
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y);
        ctx.lineTo(tr.x - tr.w / 2, tr.y + tr.h);
        ctx.lineTo(tr.x + tr.w / 2, tr.y + tr.h);
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

/* ================= 시작 ================= */

resize();
animate();

window.addEventListener('click', () => {
    if (bgm.paused) bgm.play();
});
</script>