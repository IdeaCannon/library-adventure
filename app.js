/**
 * 도서관 미션 대모험 (Library Mission Adventure) - app.js
 * Core application logic, game state manager, and custom confetti.
 */

// --- Default Mission Data ---
const MISSIONS = [
    {
        id: 1,
        floor: "1F",
        title: "첫 번째 미션: 종합자료실 탐험",
        desc: "2층 종합자료실 <strong>데스크</strong>로 가보세요. 그곳에 계신 사서 선생님의 이름을 찾아 입력하세요.",
        hint: "성이 김씨에요",
        answer: "김은지"
    },
    {
        id: 2,
        floor: "2F",
        title: "두 번째 미션: 디지털 세상",
        desc: "2층 디지털 자료실 <strong>안내 데스크 옆 프린터</strong>로 이동하세요. 프린터 위에 부착된 미션 영문 단어를 입력하세요.",
        hint: "프린터 모니터 아래쪽에 영어 대문자로 적혀있습니다.",
        answer: "PRINT"
    },
    {
        id: 3,
        floor: "3F",
        title: "마지막 미션: 사서의 추천",
        desc: "3층 종합 자료실의 <strong>사서 추천 도서대</strong>를 찾으세요. 이번 달 추천 도서 안내판 우측 하단에 적힌 정답 숫자를 입력하세요.",
        hint: "이달의 추천 북 트레이 오른쪽 모퉁이의 노란색 작은 글씨를 읽어보세요.",
        answer: "0000"
    }
];

// --- Application State ---
let state = {
    nickname: "",
    currentMissionIndex: 0,
    timerInterval: null,
    secondsElapsed: 0,
    startTime: null,
    certId: ""
};

// --- Custom Confetti Particle System ---
const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    isActive: false,
    colors: ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7', '#3a86c8', '#34d399', '#f59e0b', '#a855f7'],

    init() {
        this.canvas = document.getElementById("particles-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.resize();
        window.addEventListener("resize", () => this.resize());
    },

    resize() {
        if (this.canvas) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
        }
    },

    createParticle() {
        const x = Math.random() * this.canvas.width;
        const y = -20;
        const size = Math.random() * 8 + 4;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const speedY = Math.random() * 3 + 2;
        const speedX = Math.random() * 2 - 1;
        const rotation = Math.random() * 360;
        const rotationSpeed = Math.random() * 4 - 2;

        return { x, y, size, color, speedY, speedX, rotation, rotationSpeed };
    },

    start() {
        this.particles = [];
        this.isActive = true;
        this.resize();
        for (let i = 0; i < 80; i++) {
            this.particles.push(this.createParticle());
        }
        this.animate();
    },

    stop() {
        this.isActive = false;
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    animate() {
        if (!this.isActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeParticles = 0;
        
        this.particles.forEach((p) => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();

            if (p.y < this.canvas.height) {
                activeParticles++;
            } else {
                // Recycle particle back to top
                Object.assign(p, this.createParticle());
                activeParticles++;
            }
        });

        if (activeParticles > 0) {
            requestAnimationFrame(() => this.animate());
        }
    }
};

// --- Initialization and Core Functions ---
function initApp() {
    // 1. Initialize graphics
    Confetti.init();

    // 2. Check progress
    const savedProgress = localStorage.getItem("library_adventure_progress");
    const savedNickname = localStorage.getItem("library_adventure_nickname");
    const savedStartTime = localStorage.getItem("library_adventure_starttime");
    const savedSecs = localStorage.getItem("library_adventure_secs");

    if (savedNickname && savedProgress !== null) {
        state.nickname = savedNickname;
        state.currentMissionIndex = parseInt(savedProgress, 10);
        state.startTime = savedStartTime ? parseInt(savedStartTime, 10) : Date.now();
        state.secondsElapsed = savedSecs ? parseInt(savedSecs, 10) : 0;
        
        if (state.currentMissionIndex < MISSIONS.length) {
            startTimer();
            showScreen("game-screen");
            renderGame();
        } else {
            // Already completed
            generateCertificate();
            showScreen("complete-screen");
        }
    } else {
        // Welcome screen
        showScreen("welcome-screen");
    }
}

// Screen navigation helper
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(scr => {
        scr.classList.remove("active");
    });
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.classList.add("active");
    }
    
    // Stop confetti if leaving complete-screen
    if (screenId !== "complete-screen") {
        Confetti.stop();
    }
}

// Start Adventure
function startAdventure() {
    const nickInput = document.getElementById("nickname-input");
    const name = nickInput.value.trim();
    
    if (!name) {
        showFeedback("시작하려면 닉네임을 입력해 주세요!", "error", "welcome-msg");
        // Shake input
        nickInput.parentElement.classList.add("shake");
        setTimeout(() => nickInput.parentElement.classList.remove("shake"), 400);
        return;
    }

    state.nickname = name;
    state.currentMissionIndex = 0;
    state.secondsElapsed = 0;
    state.startTime = Date.now();

    localStorage.setItem("library_adventure_nickname", name);
    localStorage.setItem("library_adventure_progress", 0);
    localStorage.setItem("library_adventure_starttime", state.startTime.toString());
    localStorage.setItem("library_adventure_secs", "0");

    startTimer();
    showScreen("game-screen");
    renderGame();
}

// Timer Functions
function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.secondsElapsed = Math.floor((Date.now() - state.startTime) / 1000);
        localStorage.setItem("library_adventure_secs", state.secondsElapsed.toString());
        updateTimerUI();
    }, 1000);
}

// Stop Timer
function stopTimer() {
    clearInterval(state.timerInterval);
}

function updateTimerUI() {
    const timerSpan = document.getElementById("timer-display");
    if (timerSpan) {
        timerSpan.textContent = formatTime(state.secondsElapsed);
    }
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatKoreanTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
        return `${mins}분 ${secs}초`;
    }
    return `${secs}초`;
}

// Render active game
function renderGame() {
    if (state.currentMissionIndex >= MISSIONS.length) {
        finishGame();
        return;
    }

    const mission = MISSIONS[state.currentMissionIndex];
    
    // Update stats HUD
    document.getElementById("progress-text").textContent = `${state.currentMissionIndex + 1} / ${MISSIONS.length}`;
    const progressPercent = (state.currentMissionIndex / MISSIONS.length) * 100;
    document.getElementById("progress-fill").style.width = `${progressPercent}%`;

    // Render floor indicator nodes
    renderFloorIndicator(mission.floor);

    // Update mission card content
    document.getElementById("mission-title").innerHTML = `<i class="fa-solid fa-compass"></i> ${mission.title}`;
    document.getElementById("mission-desc").innerHTML = mission.desc;
    
    // Update hints
    const hintTrigger = document.getElementById("hint-trigger-btn");
    const hintBox = document.getElementById("hint-box");
    const hintText = document.getElementById("hint-text");
    
    hintBox.classList.remove("open");
    if (mission.hint && mission.hint.trim() !== "") {
        hintTrigger.style.display = "flex";
        hintText.textContent = mission.hint;
    } else {
        hintTrigger.style.display = "none";
    }

    // Reset feedback and input
    const feedbackDiv = document.getElementById("game-feedback");
    feedbackDiv.className = "feedback-msg";
    feedbackDiv.textContent = "";
    document.getElementById("answer-input").value = "";
    document.getElementById("answer-input").focus();
}

// Toggle hint display
function toggleHint() {
    const hintBox = document.getElementById("hint-box");
    hintBox.classList.toggle("open");
}

// Render dynamic floor indicator
function renderFloorIndicator(currentFloor) {
    const container = document.getElementById("floor-indicator");
    container.innerHTML = "";

    // Gather unique floors in chronological order of missions
    const floorList = [];
    MISSIONS.forEach(m => {
        const fl = m.floor || "1F";
        if (!floorList.includes(fl)) {
            floorList.push(fl);
        }
    });

    if (floorList.length === 0) floorList.push("1F");

    floorList.forEach(fl => {
        const node = document.createElement("div");
        node.className = "floor-node";
        node.textContent = fl;

        // Is it the current mission floor?
        if (fl === currentFloor) {
            node.classList.add("active");
        } else {
            // Check if this floor was visited (all missions on this floor have indices less than current index)
            const floorMissions = MISSIONS.filter(m => m.floor === fl);
            const isCompleted = floorMissions.every(m => {
                const idx = MISSIONS.indexOf(m);
                return idx < state.currentMissionIndex;
            });
            if (isCompleted && floorMissions.length > 0) {
                node.classList.add("visited");
            }
        }
        container.appendChild(node);
    });
}

// Validate answer
function checkAnswer() {
    const inputField = document.getElementById("answer-input");
    const userInput = inputField.value.trim();
    
    if (!userInput) {
        showFeedback("정답을 입력해 주세요!", "error", "game-feedback");
        shakeElement(inputField.parentElement);
        return;
    }

    const currentMission = MISSIONS[state.currentMissionIndex];
    const isCorrect = userInput.toUpperCase() === currentMission.answer.toUpperCase();

    if (isCorrect) {
        showFeedback("정답입니다! 참 잘했어요 👏", "success", "game-feedback");
        
        // Wait 1.2s then proceed
        setTimeout(() => {
            state.currentMissionIndex++;
            localStorage.setItem("library_adventure_progress", state.currentMissionIndex);
            renderGame();
        }, 1200);
    } else {
        showFeedback("틀렸습니다. 다시 확인해 보세요! 🔍", "error", "game-feedback");
        shakeElement(inputField.parentElement);
    }
}

// Finish Game and Generate Certificate
function finishGame() {
    stopTimer();
    
    // Set 100% progress
    document.getElementById("progress-fill").style.width = "100%";
    
    generateCertificate();
    showScreen("complete-screen");
    Confetti.start();
}

function generateCertificate() {
    const dateObj = new Date();
    const dateStr = dateObj.toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Unique ID: LMA - uppercase hash of nickname & timestamp
    const simpleHash = Math.abs(state.nickname.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36).slice(0, 4).toUpperCase();
    const timeHash = (state.startTime % 10000).toString(36).toUpperCase();
    state.certId = `LMA-${simpleHash}-${timeHash}`;

    // Fill certificate elements
    document.getElementById("cert-user-name").textContent = state.nickname;
    document.getElementById("cert-date").textContent = dateStr;
    document.getElementById("cert-duration").textContent = formatKoreanTime(state.secondsElapsed);
    document.getElementById("cert-id-number").textContent = `인증 번호: ${state.certId}`;
}

// Reset Game
function confirmReset() {
    if (confirm("정말로 모든 진행 상황을 초기화하고 처음부터 다시 시작하시겠습니까?")) {
        resetGameData();
    }
}

function resetGameData() {
    stopTimer();
    localStorage.removeItem("library_adventure_progress");
    localStorage.removeItem("library_adventure_nickname");
    localStorage.removeItem("library_adventure_starttime");
    localStorage.removeItem("library_adventure_secs");
    
    state.nickname = "";
    state.currentMissionIndex = 0;
    state.secondsElapsed = 0;
    state.startTime = null;
    
    showScreen("welcome-screen");
    
    // Clear forms
    document.getElementById("nickname-input").value = "";
}

// --- Auxiliary UX Helpers ---
function showFeedback(message, type, targetId) {
    const element = document.getElementById(targetId);
    if (element) {
        element.textContent = message;
        element.className = `feedback-msg show ${type}`;
    }
}

function shakeElement(element) {
    if (element) {
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 400);
    }
}

// Bind Global Window Observers & Listeners
window.onload = initApp;

// Keypress: Enter triggers check answer
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const activeScreen = document.querySelector(".screen.active");
        if (activeScreen && activeScreen.id === "game-screen") {
            const input = document.getElementById("answer-input");
            if (document.activeElement === input) {
                checkAnswer();
            }
        } else if (activeScreen && activeScreen.id === "welcome-screen") {
            const input = document.getElementById("nickname-input");
            if (document.activeElement === input) {
                startAdventure();
            }
        }
    }
});
