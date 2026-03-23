/* ============================================================
   CAREER INTELLIGENCE — Virtual Self Engine
   app.js — Full frontend logic & API integration
   ============================================================ */

// Auto-detect environment: use local Flask in dev, /api in production (Vercel)
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://127.0.0.1:5000"
  : "/api";

// ── State ──────────────────────────────────────────────────
let currentStep      = 1;
let selectedRole     = null;
let personalityAnswers = new Array(10).fill(null);
let resumeMode       = "pdf";    // "pdf" | "text"
let uploadedPdfFile  = null;

// ── Role definitions (icons + colors) ─────────────────────
const ROLE_META = {
  "AI Engineer":            { icon: "🤖", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  "Game Developer":         { icon: "🎮", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  "Mobile App Developer":   { icon: "📱", color: "#06b6d4", bg: "rgba(6,182,212,0.1)"  },
  "Full Stack Developer":   { icon: "💻", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  "DevOps Engineer":        { icon: "⚙️",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  "Cybersecurity Engineer": { icon: "🔐", color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  "Product Manager":        { icon: "📊", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  "Solutions Architect":    { icon: "🏗️",  color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
};

const PERSONALITY_DIMENSIONS = [
  { label: "Openness",          color: "#8b5cf6" },
  { label: "Conscientiousness", color: "#06b6d4" },
  { label: "Extraversion",      color: "#ec4899" },
  { label: "Stability",         color: "#10b981" },
  { label: "Technical Depth",   color: "#f59e0b" },
];

// Chart.js instances (to destroy on re-render)
let scoreRingChart    = null;
let growthChart       = null;
let monteCarloChart   = null;
let burnoutArcChart   = null;

/* ============================================================
   PARTICLES
   ============================================================ */
(function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  const ctx    = canvas.getContext("2d");
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((window.innerWidth * window.innerHeight) / 12000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.5 + 0.3,
        vx:    (Math.random() - 0.5) * 0.2,
        vy:    (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? "139,92,246" : "6,182,212",
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener("resize", () => { resize(); createParticles(); });
})();

/* ============================================================
   STEP NAVIGATION
   ============================================================ */
function scrollToStep(step) {
  const el = document.getElementById("stepper");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goToStep(step) {
  // Validate before moving forward
  if (step === 2 && !selectedRole) return;
  if (step === 3 && personalityAnswers.some(a => a === null)) return;

  // Hide current, show target
  document.querySelectorAll(".step-section").forEach(s => s.classList.remove("active"));
  document.getElementById(`step-${step}`).classList.add("active");
  currentStep = step;
  updateStepIndicators(step);
  scrollToStep(step);
}

function updateStepIndicators(activeStep) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    el.classList.remove("active", "done");
    if (i < activeStep) el.classList.add("done");
    else if (i === activeStep) el.classList.add("active");
  }
}

function restartAnalysis() {
  selectedRole      = null;
  personalityAnswers = new Array(10).fill(null);
  uploadedPdfFile   = null;
  resumeMode        = "pdf";

  // Reset role cards
  document.querySelectorAll(".role-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("to-step-2").disabled = true;

  // Reset quiz
  document.querySelectorAll(".rating-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("to-step-3").disabled = true;
  document.getElementById("personality-preview").style.display = "none";

  // Reset resume
  document.getElementById("pdf-filename").textContent = "";
  document.getElementById("resume-text-input").value = "";
  document.getElementById("analyze-btn").disabled = true;

  switchResumeTab("pdf");
  goToStep(1);
}

/* ============================================================
   STEP 1 — ROLE CARDS
   ============================================================ */
async function loadRoles() {
  try {
    const res = await fetch(`${API_BASE}/questions`); // just to check server is up
    renderRoles();
  } catch (e) {
    renderRoles(); // render anyway with static data
  }
}

function renderRoles() {
  const ROLES_DATA = {
    "AI Engineer":            { required_skills: ["python","machine learning","statistics","data structures","system design","api design","backend development","problem solving"], role_type: "Technical Research" },
    "Game Developer":         { required_skills: ["c++","unity","unreal engine","game design","3d modeling","shader programming","problem solving","team collaboration"], role_type: "Creative Technical" },
    "Mobile App Developer":   { required_skills: ["flutter","react native","ios development","android development","swift","kotlin","api design","ui/ux design"], role_type: "Product Development" },
    "Full Stack Developer":   { required_skills: ["javascript","typescript","nodejs","expressjs","mongodb","postgresql","frontend development","backend development","api design"], role_type: "Engineering Execution" },
    "DevOps Engineer":        { required_skills: ["docker","kubernetes","aws","azure","gcp","devops","cloud architecture","microservices"], role_type: "Infrastructure Critical" },
    "Cybersecurity Engineer": { required_skills: ["cybersecurity","penetration testing","network security","problem solving","critical thinking"], role_type: "Security Critical" },
    "Product Manager":        { required_skills: ["project management","agile","scrum","communication","team collaboration","critical thinking"], role_type: "Leadership Strategic" },
    "Solutions Architect":    { required_skills: ["system design","cloud architecture","microservices","database design","technical writing"], role_type: "Strategic Technical" },
  };

  const grid = document.getElementById("roles-grid");
  grid.innerHTML = "";

  Object.entries(ROLES_DATA).forEach(([name, data]) => {
    const meta     = ROLE_META[name] || { icon: "⚡", color: "#8b5cf6" };
    const previews = data.required_skills.slice(0, 4).map(s =>
      `<span class="role-skill-tag">${s}</span>`
    ).join("");

    const card = document.createElement("div");
    card.className = "role-card";
    card.style.setProperty("--role-color", meta.color);
    card.id = `role-card-${name.replace(/\s+/g, "-")}`;
    card.innerHTML = `
      <div class="role-check">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="role-icon" style="background:${meta.bg}; border-color:${meta.color}22; font-size:1.5rem;">${meta.icon}</div>
      <div class="role-name">${name}</div>
      <div class="role-type">${data.role_type}</div>
      <div class="role-skills-preview">${previews}</div>
    `;
    card.addEventListener("click", () => selectRole(name, card));
    grid.appendChild(card);
  });
}

function selectRole(name, cardEl) {
  document.querySelectorAll(".role-card").forEach(c => c.classList.remove("selected"));
  cardEl.classList.add("selected");
  selectedRole = name;
  document.getElementById("to-step-2").disabled = false;
}

/* ============================================================
   STEP 2 — PERSONALITY QUIZ
   ============================================================ */
async function loadQuestions() {
  const FALLBACK = [
    "I enjoy solving difficult problems on my own.",
    "I feel energized working in teams.",
    "I like trying new ideas even if they fail.",
    "I prefer structured planning over spontaneity.",
    "I stay calm under pressure.",
    "I enjoy building products people use.",
    "I am comfortable leading others.",
    "I enjoy deep technical challenges.",
    "I prefer stability over risk.",
    "I like turning ideas into reality."
  ];

  let questions = FALLBACK;
  try {
    const res  = await fetch(`${API_BASE}/questions`);
    const data = await res.json();
    if (data.questions) questions = data.questions.map(q => q.question);
  } catch (e) { /* use fallback */ }

  renderQuiz(questions);
}

function renderQuiz(questions) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  questions.forEach((q, i) => {
    const qEl = document.createElement("div");
    qEl.className = "quiz-question";
    qEl.innerHTML = `
      <div class="q-header">
        <div class="q-number">${String(i + 1).padStart(2, "0")}</div>
        <div class="q-text">${q}</div>
      </div>
      <div class="rating-row">
        <span class="rating-label">Disagree</span>
        <div class="rating-buttons" id="q-buttons-${i}">
          ${[1,2,3,4,5].map(v => `
            <button class="rating-btn" data-q="${i}" data-v="${v}" onclick="selectAnswer(${i}, ${v}, this)">
              ${v}
            </button>
          `).join("")}
        </div>
        <span class="rating-label">Agree</span>
      </div>
    `;
    container.appendChild(qEl);
  });
}

function selectAnswer(qIndex, value, btn) {
  // Deselect siblings
  const row = document.getElementById(`q-buttons-${qIndex}`);
  row.querySelectorAll(".rating-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  personalityAnswers[qIndex] = value;

  // Check if all answered
  if (personalityAnswers.every(a => a !== null)) {
    document.getElementById("to-step-3").disabled = false;
    updatePersonalityPreview();
  }
}

function updatePersonalityPreview() {
  const answers = personalityAnswers.map(Number);
  const vec = computePersonalityVectorFE(answers);

  const preview = document.getElementById("personality-preview");
  const bars    = document.getElementById("preview-bars");
  preview.style.display = "block";
  bars.innerHTML = "";

  vec.forEach((val, i) => {
    const dim   = PERSONALITY_DIMENSIONS[i];
    const pct   = val; // 0-100
    const item  = document.createElement("div");
    item.className = "preview-bar-item";
    item.innerHTML = `
      <span class="preview-bar-label">${dim.label}</span>
      <div class="preview-bar-track">
        <div class="preview-bar-fill" style="width:${pct}%; background:${dim.color};"></div>
      </div>
      <span class="preview-bar-value">${Math.round(pct)}</span>
    `;
    bars.appendChild(item);
  });
}

// Mirror of backend personality engine (for preview only)
function computePersonalityVectorFE(answers) {
  const a = answers;
  const openness         = ((a[2] + a[9]) / 2) * 20;
  const conscientiousness = ((a[0] + a[3]) / 2) * 20;
  const extraversion     = ((a[1] + a[6]) / 2) * 20;
  const stability        = a[4] * 20;
  const technical_depth  = ((a[7] + a[0]) / 2) * 20;
  return [openness, conscientiousness, extraversion, stability, technical_depth];
}

/* ============================================================
   STEP 3 — RESUME
   ============================================================ */
function switchResumeTab(mode) {
  resumeMode = mode;
  document.getElementById("tab-pdf").classList.toggle("active", mode === "pdf");
  document.getElementById("tab-text").classList.toggle("active", mode === "text");
  document.getElementById("resume-pdf-panel").style.display  = mode === "pdf" ? "block" : "none";
  document.getElementById("resume-text-panel").style.display = mode === "text" ? "block" : "none";
  checkResumeStep();
}

function handlePdfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  uploadedPdfFile = file;
  document.getElementById("pdf-filename").textContent = `✓ ${file.name}`;
  document.getElementById("dropzone").style.borderColor = "var(--green)";
  document.getElementById("analyze-btn").disabled = false;
}

function checkResumeStep() {
  const text = document.getElementById("resume-text-input").value.trim();
  document.getElementById("analyze-btn").disabled = !(text.length > 20 && resumeMode === "text");
}

// Drag & drop support
window.addEventListener("DOMContentLoaded", () => {
  const dz = document.getElementById("dropzone");
  if (!dz) return;
  dz.addEventListener("dragover",  e => { e.preventDefault(); dz.classList.add("drag-over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("drag-over"));
  dz.addEventListener("drop", e => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      uploadedPdfFile = file;
      document.getElementById("pdf-filename").textContent = `✓ ${file.name}`;
      dz.style.borderColor = "var(--green)";
      document.getElementById("analyze-btn").disabled = false;
    }
  });
});

/* ============================================================
   ANALYSIS — Main Flow
   ============================================================ */
async function runAnalysis() {
  const btn     = document.getElementById("analyze-btn");
  const btnText = document.getElementById("analyze-btn-text");
  const spinner = document.getElementById("btn-spinner");
  const arrow   = document.getElementById("analyze-btn-arrow");

  btn.disabled = true;
  btnText.textContent = "Analyzing...";
  spinner.style.display = "block";
  arrow.style.display   = "none";

  try {
    let response;

    if (resumeMode === "pdf" && uploadedPdfFile) {
      const formData = new FormData();
      formData.append("resume", uploadedPdfFile);
      formData.append("personality_answers", JSON.stringify(personalityAnswers.map(Number)));
      formData.append("role", selectedRole);

      response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });
    } else {
      const resumeText = document.getElementById("resume-text-input").value.trim();
      response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text:          resumeText,
          personality_answers:  personalityAnswers.map(Number),
          role:                 selectedRole,
        }),
      });
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Server error");
    }

    const data = await response.json();
    renderResults(data);
    goToStep(4);

  } catch (e) {
    showToast(e.message || "Failed to connect to backend. Make sure Flask is running.");
  } finally {
    btn.disabled = false;
    btnText.textContent = "Analyze My Parallel Self";
    spinner.style.display = "none";
    arrow.style.display   = "block";
  }
}

/* ============================================================
   RESULTS RENDERING
   ============================================================ */
function renderResults(data) {
  document.getElementById("result-role-name").textContent = selectedRole;

  renderScoreRing(data.compatibility_score);
  renderVirtualSelf(data.virtual_self_profile);
  renderBurnoutArc(data.burnout_risk);
  renderSkills(data.detected_skills, data.missing_skills);
  renderGrowthChart(data.projection);
  renderMonteCarloChart(data.monte_carlo_projection);
  renderExplanation(data.explanation);
  renderDecision(data.decision_simulation);
}

/* ── Score Ring ── */
function renderScoreRing(score) {
  if (scoreRingChart) scoreRingChart.destroy();

  document.getElementById("score-display").textContent = Math.round(score);

  let label, color;
  if (score > 75)      { label = "Strong Match 🔥";    color = "#10b981"; }
  else if (score > 50) { label = "Moderate Alignment";  color = "#f59e0b"; }
  else                 { label = "Low Compatibility";    color = "#ef4444"; }

  document.getElementById("score-label-text").textContent = label;
  document.getElementById("score-label-text").style.color  = color;

  const ctx = document.getElementById("score-ring").getContext("2d");
  scoreRingChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [
          score > 75 ? "rgba(16,185,129,0.8)" : score > 50 ? "rgba(245,158,11,0.8)" : "rgba(239,68,68,0.8)",
          "rgba(255,255,255,0.04)"
        ],
        borderWidth: 0,
        hoverOffset: 4,
      }]
    },
    options: {
      cutout: "78%",
      responsive: false,
      animation: { animateRotate: true, duration: 1200, easing: "easeInOutQuart" },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    }
  });
}

/* ── Virtual Self ── */
function renderVirtualSelf(profile) {
  const grid = document.getElementById("virtual-self-grid");
  grid.innerHTML = "";

  const labelMap = {
    risk_appetite:      "Risk Appetite",
    work_style:         "Work Style",
    social_orientation: "Social Style",
    pressure_handling:  "Under Pressure",
    technical_identity: "Tech Identity",
  };

  Object.entries(profile).forEach(([key, val]) => {
    const div = document.createElement("div");
    div.className = "vs-trait";
    div.innerHTML = `
      <div class="vs-trait-key">${labelMap[key] || key}</div>
      <div class="vs-trait-value">${val}</div>
    `;
    grid.appendChild(div);
  });
}

/* ── Burnout Arc ── */
function renderBurnoutArc(burnout) {
  if (burnoutArcChart) burnoutArcChart.destroy();

  const score = burnout.burnout_risk_score;
  const level = burnout.burnout_risk_level;

  document.getElementById("burnout-score").textContent = Math.round(score);
  document.getElementById("burnout-level").textContent = level;

  const levelColors = { Low: "#10b981", Moderate: "#f59e0b", High: "#ef4444" };
  const col = levelColors[level] || "#8b5cf6";
  document.getElementById("burnout-score").style.color = col;
  document.getElementById("burnout-level").style.color  = col;
  document.getElementById("burnout-desc").textContent =
    level === "Low"      ? "You handle this role's stress well." :
    level === "Moderate" ? "Some stress exposure — manageable with care." :
                           "High stress gap — burnout risk is significant.";

  const ctx = document.getElementById("burnout-arc").getContext("2d");
  burnoutArcChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [`${col}cc`, "rgba(255,255,255,0.04)"],
        borderWidth: 0,
      }]
    },
    options: {
      cutout: "68%",
      circumference: 180,
      rotation: -90,
      responsive: false,
      animation: { duration: 1200, easing: "easeInOutQuart" },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    }
  });
}

/* ── Skills ── */
function renderSkills(detected, missing) {
  const detectedEl = document.getElementById("detected-skills");
  const missingEl  = document.getElementById("missing-skills");

  document.getElementById("detected-count").textContent = detected.length;
  document.getElementById("missing-count").textContent  = missing.length;

  detectedEl.innerHTML = detected.length
    ? detected.map((s, i) => `<span class="skill-chip detected" style="animation-delay:${i * 40}ms">${s}</span>`).join("")
    : "<span style='color:var(--text-muted);font-size:0.82rem;'>No matching skills detected</span>";

  missingEl.innerHTML = missing.length
    ? missing.map((s, i) => `<span class="skill-chip missing" style="animation-delay:${i * 40}ms">${s}</span>`).join("")
    : "<span style='color:var(--green);font-size:0.82rem;'>✓ No missing core skills!</span>";
}

/* ── Growth Chart ── */
function renderGrowthChart(projection) {
  if (growthChart) growthChart.destroy();

  const labels = projection.map(p => `Year ${p.year}`);
  const values = projection.map(p => p.compatibility);

  const ctx = document.getElementById("growth-chart").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, "rgba(139,92,246,0.4)");
  gradient.addColorStop(1, "rgba(139,92,246,0.01)");

  growthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Compatibility %",
        data: values,
        borderColor: "#8b5cf6",
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#000",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: "easeInOutQuart" },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono'" } } },
        y: {
          min: 0, max: 100,
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono'" }, callback: v => `${v}%` }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(7,7,15,0.9)",
          borderColor: "rgba(139,92,246,0.3)",
          borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)}%` }
        }
      }
    }
  });
}

/* ── Monte Carlo Chart ── */
function renderMonteCarloChart(mc) {
  if (monteCarloChart) monteCarloChart.destroy();

  const labels = mc.mean_projection.map((_, i) => `Year ${i + 1}`);

  const ctx = document.getElementById("monte-carlo-chart").getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, "rgba(6,182,212,0.25)");
  grad.addColorStop(1, "rgba(6,182,212,0.02)");

  monteCarloChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Best Case",
          data: mc.best_case,
          borderColor: "rgba(16,185,129,0.5)",
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
        {
          label: "90% Upper",
          data: mc.confidence_90_upper,
          borderColor: "rgba(6,182,212,0.3)",
          borderWidth: 1,
          pointRadius: 0,
          fill: "+2",
          backgroundColor: "rgba(6,182,212,0.07)",
          tension: 0.4,
        },
        {
          label: "Mean",
          data: mc.mean_projection,
          borderColor: "#06b6d4",
          backgroundColor: grad,
          borderWidth: 2.5,
          pointBackgroundColor: "#06b6d4",
          pointBorderColor: "#000",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "90% Lower",
          data: mc.confidence_90_lower,
          borderColor: "rgba(6,182,212,0.3)",
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Worst Case",
          data: mc.worst_case,
          borderColor: "rgba(239,68,68,0.4)",
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200 },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono'" } } },
        y: {
          min: 0, max: 100,
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono'" }, callback: v => `${v}%` }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#94a3b8", font: { size: 11, family: "'JetBrains Mono'" }, boxWidth: 12, boxHeight: 2, padding: 10 }
        },
        tooltip: {
          backgroundColor: "rgba(7,7,15,0.9)",
          borderColor: "rgba(6,182,212,0.3)",
          borderWidth: 1,
        }
      }
    }
  });
}

/* ── Explanation ── */
function renderExplanation(text) {
  const el = document.getElementById("explanation-text");
  el.innerHTML = "";
  // Typewriter effect
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 18);
}

/* ── Decision ── */
function renderDecision(text) {
  document.getElementById("decision-text").textContent = text;

  const isPositive = text.toLowerCase().includes("confidently") || text.toLowerCase().includes("well");
  const fillEl = document.createElement("div");
  fillEl.className = "decision-visual-fill";
  fillEl.style.width      = isPositive ? "80%" : "35%";
  fillEl.style.background = isPositive
    ? "linear-gradient(90deg, #10b981, #06b6d4)"
    : "linear-gradient(90deg, #ef4444, #f59e0b)";

  const visual = document.getElementById("decision-visual");
  visual.innerHTML = "";
  visual.appendChild(fillEl);
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg) {
  const toast  = document.getElementById("toast");
  const msgEl  = document.getElementById("toast-msg");
  msgEl.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  renderRoles();
  loadQuestions();
  updateStepIndicators(1);
});
