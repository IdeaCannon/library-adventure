/**
 * 도서관 방탈출 스마트폰 게임 (Library Escape Room Game) - app.js
 * Core application logic, QR code scanning, Audio Synthesizer, and Confetti.
 */

// --- Default Mission Data (Escape Room Theme) ---
const MISSIONS = [
    {
        id: 1,
        floor: "1F",
        title: "1단계: 역사와 시작의 서가 🧭",
        desc: "1층 자료실의 <strong>'한국사 서가'</strong> 코너로 가보세요. 그곳에 숨겨진 <strong>역사 QR 코드</strong>를 찾아 스마트폰 카메라로 스캔하세요.",
        qrCode: "ROOM_HIST_101",
        question: "<strong>[역사 수수께끼]</strong><br>1443년 백성을 사랑하는 마음으로 훈민정음(한글)을 창제하여 도서관의 책들이 한글로 적힐 수 있게 해 주신 조선의 위대한 임금님은 누구일까요?",
        hint: "초성 힌트: ㅅㅈㄷㅇ (세 글자는 왕)",
        answer: "세종대왕"
    },
    {
        id: 2,
        floor: "2F",
        title: "2단계: 디지털 매트릭스 💻",
        desc: "2층 <strong>'디지털 정보 검색 코너'</strong> 또는 프린터 zone 근처를 탐색해 보세요. 그곳에 숨겨진 <strong>IT QR 코드</strong>를 찾아 스캔하세요.",
        qrCode: "ROOM_TECH_202",
        question: "<strong>[디지털 암호 해독]</strong><br>도서관의 책을 컴퓨터로 찾을 때 사용하는 단어입니다. 알파벳을 숫자 순서(A=1, B=2, C=3...)로 변환하여 다음 암호를 해독하세요.<br><br><span style='letter-spacing: 2px; font-size: 1.25rem; font-weight: 800; color: var(--secondary)'>12 - 9 - 2 - 18 - 1 - 18 - 25</span>",
        hint: "도서관을 뜻하는 영어 대문자 7글자입니다.",
        answer: "LIBRARY"
    },
    {
        id: 3,
        floor: "3F",
        title: "3단계: 시인이 노래하는 바람 ✍️",
        desc: "3층 문학 서가의 <strong>'한국 시 서집'</strong> 구역을 찾으세요. 윤동주 시인의 시집 근처에 숨겨진 <strong>시인 QR 코드</strong>를 스캔하세요.",
        qrCode: "ROOM_LIT_303",
        question: "<strong>[시 구절 채우기]</strong><br>윤동주 시인의 대표작 '서시(序詩)'의 한 구절입니다. 빈칸에 들어갈 단어는 무엇일까요?<br><br><em>\"죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를,<br>잎새에 이는 [ <strong>?</strong> ]에도 나는 괴로워했다.\"</em>",
        hint: "자연의 공기 흐름입니다. 초성: ㅂㄹ",
        answer: "바람"
    },
    {
        id: 4,
        floor: "Exit",
        title: "마지막 단계: 지혜의 탈출구 🚪",
        desc: "마지막 관문입니다! 도서관 <strong>'정문 출구(안내 데스크)'</strong> 근처로 이동하세요. 탈출문 근처에 부착된 <strong>탈출구 QR 코드</strong>를 스캔해 봉인을 푸세요.",
        qrCode: "ROOM_EXIT_999",
        question: "<strong>[마지막 수수께끼]</strong><br>'나는 입이 없어도 세상의 모든 지식을 말하고, 발이 없어도 역사와 미래를 여행하게 해주며, 마음의 양식을 쌓아준다. 내 표지를 펼치면 모험이 시작된다.' 이것은 무엇일까요?",
        hint: "도서관에 소장되어 있는 종이 묶음입니다. 초성: ㅊ",
        answer: "책"
    }
];

// --- Application State ---
let state = {
    nickname: "",
    currentMissionIndex: 0,
    isUnlocked: false, // Is current stage's puzzle unlocked by QR scan?
    timerInterval: null,
    secondsElapsed: 0,
    startTime: null,
    certId: "",
    scannerStream: null,
    pendingScanCode: null
};

// --- Custom Confetti Particle System ---
const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    isActive: false,
    colors: ['#34d399', '#f59e0b', '#fb7185', '#60a5fa', '#a78bfa', '#fbbf24', '#d4af37'],

    init() {
        this.canvas = document.getElementById("particles-canvas");
        if (this.canvas) {
            this.ctx = this.canvas.getContext("2d");
            this.resize();
            window.addEventListener("resize", () => this.resize());
        }
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
        if (!this.canvas) return;
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
        if (this.ctx && this.canvas) {
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
                Object.assign(p, this.createParticle());
                activeParticles++;
            }
        });

        if (activeParticles > 0) {
            requestAnimationFrame(() => this.animate());
        }
    }
};

// --- Web Audio sound effects synthesizer ---
function playAudio(type) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === "success") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === "unlock") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(261.63, now); // C4
            osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
            osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
            osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === "error") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === "fanfare") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) {
        console.error("Web Audio API is blocked or not supported:", e);
    }
}

// --- Haptic Feedback ---
function triggerVibrate(type) {
    if (navigator.vibrate) {
        if (type === "success") {
            navigator.vibrate([100, 50, 100]);
        } else if (type === "error") {
            navigator.vibrate(250);
        } else if (type === "unlock") {
            navigator.vibrate([80, 40, 80, 40, 120]);
        }
    }
}

// --- URL query parameter analysis ---
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
        // Clean URL to prevent repeated activations upon refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        return code;
    }
    return null;
}

// --- Initialization and Core Functions ---
function initApp() {
    Confetti.init();
    
    // Check if the page was opened via a QR code link (has query params)
    const scannedCode = checkUrlParams();

    const savedProgress = localStorage.getItem("library_adventure_progress");
    const savedNickname = localStorage.getItem("library_adventure_nickname");
    const savedStartTime = localStorage.getItem("library_adventure_starttime");
    const savedSecs = localStorage.getItem("library_adventure_secs");
    const savedUnlocked = localStorage.getItem("library_escape_unlocked");

    state.isUnlocked = savedUnlocked === "true";
    
    // Initialize Debug/Test panel QR codes
    generateTestQRs();

    if (savedNickname && savedProgress !== null) {
        state.nickname = savedNickname;
        state.currentMissionIndex = parseInt(savedProgress, 10);
        state.startTime = savedStartTime ? parseInt(savedStartTime, 10) : Date.now();
        state.secondsElapsed = savedSecs ? parseInt(savedSecs, 10) : 0;
        
        if (state.currentMissionIndex < MISSIONS.length) {
            startTimer();
            showScreen("game-screen");
            
            if (scannedCode) {
                applyScannedCode(scannedCode);
            } else {
                renderGame();
            }
        } else {
            generateCertificate();
            showScreen("complete-screen");
        }
    } else {
        if (scannedCode) {
            state.pendingScanCode = scannedCode;
            showFeedback("QR 코드가 감지되었습니다! 닉네임을 입력하시면 즉시 첫 번째 비밀 지령이 해제됩니다.", "success", "welcome-msg");
        }
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
        nickInput.parentElement.classList.add("shake");
        setTimeout(() => nickInput.parentElement.classList.remove("shake"), 400);
        playAudio("error");
        triggerVibrate("error");
        return;
    }

    state.nickname = name;
    state.currentMissionIndex = 0;
    state.secondsElapsed = 0;
    state.startTime = Date.now();
    state.isUnlocked = false;

    // Apply scanned code if it was pending from splash screen
    if (state.pendingScanCode) {
        const currentMission = MISSIONS[0];
        if (state.pendingScanCode.toUpperCase() === currentMission.qrCode.toUpperCase()) {
            state.isUnlocked = true;
        }
        state.pendingScanCode = null;
    }

    localStorage.setItem("library_adventure_nickname", name);
    localStorage.setItem("library_adventure_progress", 0);
    localStorage.setItem("library_adventure_starttime", state.startTime.toString());
    localStorage.setItem("library_adventure_secs", "0");
    localStorage.setItem("library_escape_unlocked", state.isUnlocked ? "true" : "false");

    playAudio("unlock");
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

// Apply code parsed from QR scan or manual entry
function applyScannedCode(code) {
    if (state.currentMissionIndex >= MISSIONS.length) return;
    
    const currentMission = MISSIONS[state.currentMissionIndex];
    if (code.toUpperCase() === currentMission.qrCode.toUpperCase()) {
        state.isUnlocked = true;
        localStorage.setItem("library_escape_unlocked", "true");
        playAudio("unlock");
        triggerVibrate("unlock");
        showFeedback("성공! 비밀 수수께끼가 잠금 해제되었습니다.", "success", "scan-feedback");
        renderGame();
    } else {
        // Handle code for another stage
        const targetMission = MISSIONS.find(m => m.qrCode.toUpperCase() === code.toUpperCase());
        if (targetMission) {
            const targetIdx = MISSIONS.indexOf(targetMission);
            if (targetIdx < state.currentMissionIndex) {
                showFeedback("이미 완료한 단계의 QR 코드입니다.", "error", "scan-feedback");
            } else {
                showFeedback(`아직 이 단계를 진행할 수 없습니다. 현재는 [${currentMission.floor}] 구역을 찾아주세요!`, "error", "scan-feedback");
            }
        } else {
            showFeedback("올바른 도서관 미션 QR 코드가 아닙니다.", "error", "scan-feedback");
        }
        playAudio("error");
        triggerVibrate("error");
        renderGame();
    }
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
    document.getElementById("mission-title").innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${mission.title}`;
    document.getElementById("mission-desc").innerHTML = mission.desc;
    
    // Toggle game zones based on unlocked status
    const scanZone = document.getElementById("qr-scan-zone");
    const puzzleZone = document.getElementById("puzzle-zone");
    
    if (state.isUnlocked) {
        scanZone.style.display = "none";
        puzzleZone.style.display = "flex";
        
        // Setup puzzle question
        document.getElementById("puzzle-question").innerHTML = mission.question;
        
        // Setup hint
        const hintTrigger = document.getElementById("hint-trigger-btn");
        const hintBox = document.getElementById("hint-box");
        const hintText = document.getElementById("hint-text");
        
        hintBox.classList.remove("open");
        if (mission.hint && mission.hint.trim() !== "") {
            hintTrigger.style.display = "flex";
            hintText.innerHTML = mission.hint;
        } else {
            hintTrigger.style.display = "none";
        }
        
        // Clear input and focus
        document.getElementById("answer-input").value = "";
        document.getElementById("answer-input").focus();
    } else {
        scanZone.style.display = "flex";
        puzzleZone.style.display = "none";
        
        // Reset manual input panel
        document.getElementById("manual-input-box").classList.remove("open");
        document.getElementById("manual-qr-input").value = "";
    }

    // Reset feedback
    const feedbackDiv = document.getElementById("game-feedback");
    feedbackDiv.className = "feedback-msg";
    feedbackDiv.textContent = "";
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

        if (fl === currentFloor) {
            node.classList.add("active");
        } else {
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
        playAudio("error");
        triggerVibrate("error");
        return;
    }

    const currentMission = MISSIONS[state.currentMissionIndex];
    // Remove space and compare uppercase for flexible matching
    const cleanUser = userInput.replace(/\s+/g, "").toUpperCase();
    const cleanAnswer = currentMission.answer.replace(/\s+/g, "").toUpperCase();
    const isCorrect = cleanUser === cleanAnswer;

    if (isCorrect) {
        showFeedback("정답입니다! 다음 방으로 나아갑니다 👏", "success", "game-feedback");
        playAudio("success");
        triggerVibrate("success");
        
        // Wait 1.2s then proceed
        setTimeout(() => {
            state.currentMissionIndex++;
            state.isUnlocked = false; // Lock next stage
            localStorage.setItem("library_adventure_progress", state.currentMissionIndex);
            localStorage.setItem("library_escape_unlocked", "false");
            
            // Clear any general scan feedback
            const scanFeedback = document.getElementById("scan-feedback");
            if (scanFeedback) {
                scanFeedback.className = "feedback-msg";
                scanFeedback.textContent = "";
            }

            renderGame();
        }, 1200);
    } else {
        showFeedback("틀렸습니다. 단서를 다시 해석해 보세요! 🔍", "error", "game-feedback");
        shakeElement(inputField.parentElement);
        playAudio("error");
        triggerVibrate("error");
    }
}

// Finish Game and Generate Certificate
function finishGame() {
    stopTimer();
    document.getElementById("progress-fill").style.width = "100%";
    generateCertificate();
    showScreen("complete-screen");
    Confetti.start();
    playAudio("fanfare");
    triggerVibrate("unlock");
}

function generateCertificate() {
    const dateObj = new Date();
    const dateStr = dateObj.toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' });
    
    const simpleHash = Math.abs(state.nickname.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36).slice(0, 4).toUpperCase();
    const timeHash = (state.startTime % 10000).toString(36).toUpperCase();
    state.certId = `LMA-${simpleHash}-${timeHash}`;

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
    localStorage.removeItem("library_escape_unlocked");
    
    state.nickname = "";
    state.currentMissionIndex = 0;
    state.secondsElapsed = 0;
    state.startTime = null;
    state.isUnlocked = false;
    state.pendingScanCode = null;
    
    const scanFeedback = document.getElementById("scan-feedback");
    if (scanFeedback) {
        scanFeedback.className = "feedback-msg";
        scanFeedback.textContent = "";
    }
    
    showScreen("welcome-screen");
    document.getElementById("nickname-input").value = "";
}

// --- Live camera QR code scanner ---
function openScanner() {
    const modal = document.getElementById("scanner-modal");
    const video = document.getElementById("scanner-video");
    const msg = document.getElementById("scanner-msg");

    modal.classList.add("active");
    msg.textContent = "카메라를 연결하는 중...";
    msg.className = "scanner-msg";

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            state.scannerStream = stream;
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            requestAnimationFrame(tickScanner);
        })
        .catch(function(err) {
            console.error("Camera access error:", err);
            msg.textContent = "카메라에 접근할 수 없습니다. 권한을 확인하거나 수동 코드를 사용하세요.";
            msg.className = "scanner-msg error";
        });
}

// Close Scanner and stop tracks
function closeScanner() {
    const modal = document.getElementById("scanner-modal");
    if (modal) {
        modal.classList.remove("active");
    }

    if (state.scannerStream) {
        state.scannerStream.getTracks().forEach(track => track.stop());
        state.scannerStream = null;
    }
    const video = document.getElementById("scanner-video");
    if (video) {
        video.srcObject = null;
    }
}

function tickScanner() {
    const video = document.getElementById("scanner-video");
    const msg = document.getElementById("scanner-msg");

    if (!state.scannerStream) return;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        msg.textContent = "QR 코드를 스캔하는 중...";
        
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            let scannedVal = code.data.trim();
            console.log("Scanned QR Value:", scannedVal);
            
            try {
                if (scannedVal.startsWith("http://") || scannedVal.startsWith("https://")) {
                    const url = new URL(scannedVal);
                    const paramCode = url.searchParams.get("code");
                    if (paramCode) {
                        scannedVal = paramCode;
                    }
                }
            } catch (e) {
                console.error("Failed to parse scanned URL:", e);
            }

            const currentMission = MISSIONS[state.currentMissionIndex];
            if (scannedVal.toUpperCase() === currentMission.qrCode.toUpperCase()) {
                closeScanner();
                applyScannedCode(scannedVal);
                return;
            } else {
                msg.textContent = "현재 단계의 QR 코드가 아닙니다! 다시 시도해 보세요.";
                msg.className = "scanner-msg error";
            }
        }
    }
    
    if (state.scannerStream) {
        requestAnimationFrame(tickScanner);
    }
}

// --- Manual Code Input functions ---
function toggleManualCode() {
    const box = document.getElementById("manual-input-box");
    box.classList.toggle("open");
    if (box.classList.contains("open")) {
        document.getElementById("manual-qr-input").focus();
    }
}

// Submit manual code
function submitManualCode() {
    const input = document.getElementById("manual-qr-input");
    const code = input.value.trim();
    
    if (!code) {
        showFeedback("코드를 입력해 주세요!", "error", "scan-feedback");
        shakeElement(input.parentElement);
        playAudio("error");
        triggerVibrate("error");
        return;
    }

    applyScannedCode(code);
}

// --- Debugging / Testing Panel ---
function toggleTestPanel() {
    const panel = document.getElementById("test-panel");
    panel.classList.toggle("open");
}

function generateTestQRs() {
    MISSIONS.forEach((m, idx) => {
        const canvas = document.getElementById(`qr-canvas-${idx + 1}`);
        if (canvas) {
            const baseUrl = window.location.origin + window.location.pathname;
            const targetUrl = `${baseUrl}?code=${m.qrCode}`;
            
            new QRious({
                element: canvas,
                value: targetUrl,
                size: 150,
                background: '#ffffff',
                foreground: '#0f172a',
                level: 'H'
            });
        }
    });
}

// --- Auxiliary UX Helpers ---
function showFeedback(message, type, targetId) {
    const element = document.getElementById(targetId);
    if (element) {
        element.innerHTML = message;
        element.className = `feedback-msg show ${type}`;
    }
}

function shakeElement(element) {
    if (element) {
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 400);
    }
}

window.onload = initApp;

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const activeScreen = document.querySelector(".screen.active");
        if (activeScreen && activeScreen.id === "game-screen") {
            const answerInput = document.getElementById("answer-input");
            const manualInput = document.getElementById("manual-qr-input");
            
            if (document.activeElement === answerInput) {
                checkAnswer();
            } else if (document.activeElement === manualInput) {
                submitManualCode();
            }
        } else if (activeScreen && activeScreen.id === "welcome-screen") {
            const input = document.getElementById("nickname-input");
            if (document.activeElement === input) {
                startAdventure();
            }
        }
    }
});
