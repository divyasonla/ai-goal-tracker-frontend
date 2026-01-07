// Change this to your production backend URL after deployment
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000/api"
  : "/api"; // Uses same domain in production (Vercel setup)

let sessionId = null;
let questionQueue = [];
let currentQuestion = null;

const sessionBadge = document.getElementById("sessionBadge");
const extractedCard = document.getElementById("extractedCard");
const charCount = document.getElementById("charCount");
const questionGrid = document.getElementById("questionGrid");
const conversation = document.getElementById("conversation");
const scoreCard = document.getElementById("scoreCard");

const setSession = async (reset = false) => {
    if (!reset) {
        const cached = localStorage.getItem("examinerSessionId");
        if (cached) {
            sessionId = cached;
            sessionBadge.textContent = `Session: ${sessionId.slice(0, 8)}`;
            return;
        }
    }

    const res = await fetch(`${API_BASE}/session`, { method: "POST" });
    const data = await res.json();
    sessionId = data.sessionId;
    localStorage.setItem("examinerSessionId", sessionId);
    sessionBadge.textContent = `Session: ${sessionId.slice(0, 8)}`;
    conversation.innerHTML = "";
    addMessage("system", "New session started. Upload or paste a project to begin.");
};

const addMessage = (role, text) => {
    const bubble = document.createElement("div");
    bubble.className = `rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap ${
        role === "user"
            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-50"
            : role === "coach"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
            : "border-slate-700 bg-slate-800/70 text-slate-100"
    }`;
    bubble.textContent = text;
    conversation.appendChild(bubble);
    conversation.scrollTop = conversation.scrollHeight;
};

const renderExtracted = (data) => {
  if (!data) {
    extractedCard.innerHTML = '<p class="text-slate-400">No project analyzed yet.</p>';
    charCount.textContent = "--";
    return;
  }

  const { title, problemStatement, techStack, features, architectureFlow, risks, summary } = data;
  extractedCard.innerHTML = `
    <div class="text-xs uppercase tracking-widest text-indigo-300">Profile</div>
    <h3 class="text-lg font-semibold text-white">${title || "Untitled project"}</h3>
    <p class="text-slate-300">${summary || ""}</p>
    <div class="mt-2 space-y-1 text-slate-200">
      <p><span class="pill">Problem</span> ${problemStatement || ""}</p>
      <p><span class="pill">Tech</span> ${(techStack || []).join(", ") || "-"}</p>
      <p><span class="pill">Features</span> ${(features || []).join(" · ") || "-"}</p>
      <p><span class="pill">Architecture</span> ${architectureFlow || "-"}</p>
      <p><span class="pill">Risks</span> ${(risks || []).join(" · ") || "-"}</p>
    </div>
  `;
};

const renderCodeAnalysis = (data) => {
  if (!data) return;
  const { language, algorithms, complexities, patterns, issues, summary } = data;
  const codeCard = document.createElement("div");
  codeCard.className = "mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30";
  codeCard.innerHTML = `
    <h4 class="text-emerald-300 font-semibold text-sm">📝 Code Analysis</h4>
    <p class="text-xs text-slate-300 mt-1">${summary}</p>
    <div class="mt-2 text-xs text-slate-200">
      <p><span class="pill">Language</span> ${language}</p>
      <p><span class="pill">Algorithms</span> ${(algorithms || []).join(", ") || "n/a"}</p>
      <p><span class="pill">Complexities</span> ${(complexities || []).join(", ") || "n/a"}</p>
      <p><span class="pill">Patterns</span> ${(patterns || []).join(", ") || "n/a"}</p>
      <p><span class="pill">Issues</span> ${(issues || []).join(", ") || "none"}</p>
    </div>
  `;
  extractedCard.appendChild(codeCard);
};

const analyzeCode = async (codeText) => {
  const res = await fetch(`${API_BASE}/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, code: codeText })
  });
  if (!res.ok) throw new Error((await res.json()).error || "Code analysis failed");
  const data = await res.json();
  renderCodeAnalysis(data.codeAnalysis);
  addMessage("coach", "Code analyzed! Questions will now include code-specific topics.");
};

const uploadCode = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sessionId", sessionId);

  const res = await fetch(`${API_BASE}/code-upload`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) throw new Error((await res.json()).error || "Code upload failed");
  const data = await res.json();
  renderCodeAnalysis(data.codeAnalysis);
  addMessage("coach", "Code uploaded and analyzed! Questions will now include code topics.");
};const groupByCategory = (questions) => {
    return questions.reduce((acc, q) => {
        if (!acc[q.category]) acc[q.category] = [];
        acc[q.category].push(q);
        return acc;
    }, {});
};

const renderQuestions = (questions) => {
    questionGrid.innerHTML = "";
    if (!questions?.length) {
        questionGrid.innerHTML = '<p class="text-slate-400">Generate questions to see them here.</p>';
        return;
    }

    const grouped = groupByCategory(questions);
    Object.keys(grouped).forEach((cat) => {
        const card = document.createElement("div");
        card.className = "question-card";
        const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
        card.innerHTML = `<div class="flex items-center justify-between mb-2">
                <span class="pill">${catLabel}</span>
                <span class="text-xs text-slate-400">${grouped[cat].length} Qs</span>
            </div>`;

        grouped[cat].forEach((q) => {
            const block = document.createElement("div");
            block.className = "mb-3 p-2 rounded-md bg-slate-800/60 border border-slate-700/50";
            block.innerHTML = `
                <p class="text-slate-100 font-semibold">${q.prompt}</p>
                <p class="text-xs text-slate-400 mt-1">Hint: ${q.hint}</p>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-[11px] text-slate-400">Difficulty: ${q.difficulty}</span>
                    <button class="btn-secondary text-xs" data-question="${encodeURIComponent(q.prompt)}">Use this</button>
                </div>`;
            card.appendChild(block);
        });
        questionGrid.appendChild(card);
    });

    questionQueue = [...questions];
    if (!currentQuestion && questionQueue.length) {
        askNextQuestion();
    }
};

const askNextQuestion = () => {
    if (!questionQueue.length) {
        addMessage("coach", "No queued questions. Generate more or pick one manually.");
        currentQuestion = null;
        return;
    }
    currentQuestion = questionQueue.shift();
    addMessage("coach", currentQuestion.prompt);
};

const analyzeText = async (text) => {
    const mode = document.getElementById("modeSelect").value;
    const res = await fetch(`${API_BASE}/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text, mode })
    });
    if (!res.ok) throw new Error((await res.json()).error || "Analysis failed");
    const data = await res.json();
    renderExtracted(data.extracted);
    charCount.textContent = `${text.length} chars`;
    addMessage("coach", "Project profile extracted. Generate questions next.");
};

const analyzeUpload = async (file) => {
    const mode = document.getElementById("modeSelect").value;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("mode", mode);

    const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
    const data = await res.json();
    renderExtracted(data.extracted);
    charCount.textContent = `${data.charCount || 0} chars`;
    addMessage("coach", "Upload processed. Generate questions next.");
};

const generateQuestionPack = async () => {
    const mode = document.getElementById("modeSelect").value;
    const res = await fetch(`${API_BASE}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, mode })
    });
    if (!res.ok) throw new Error((await res.json()).error || "Question generation failed");
    const data = await res.json();
    renderQuestions(data.questions);
};

const submitAnswer = async () => {
    const answer = document.getElementById("answerBox").value.trim();
    if (!currentQuestion) {
        addMessage("system", "Pick or generate a question first.");
        return;
    }
    if (!answer) return;

    addMessage("user", answer);
    document.getElementById("answerBox").value = "";

    const mode = document.getElementById("modeSelect").value;
    const res = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question: currentQuestion.prompt, answer, mode })
    });

    if (!res.ok) {
        const err = await res.json();
        addMessage("system", err.error || "Follow-up failed");
        return;
    }

    const data = await res.json();
    const { followUp } = data;
    addMessage("coach", `${followUp.feedback}\n\nFollow-up: ${followUp.followUpQuestion}`);
    currentQuestion = { prompt: followUp.followUpQuestion, hint: followUp.hint };
};

const updateScore = async () => {
    const res = await fetch(`${API_BASE}/confidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
    });

    if (!res.ok) {
        scoreCard.innerHTML = `<p class="text-slate-400">${(await res.json()).error || "Unable to score"}</p>`;
        return;
    }

    const data = await res.json();
    const scoreData = data.score;
    scoreCard.innerHTML = `
        <div class="text-3xl font-bold text-indigo-200">${scoreData.score}</div>
        <p class="text-slate-200">${scoreData.rationale}</p>
        <p class="text-slate-300 text-sm">Weak areas: ${(scoreData.weakAreas || []).join(" · ") || "n/a"}</p>
        <p class="text-indigo-200 text-sm">Next step: ${scoreData.nextStep}</p>
    `;
};

document.addEventListener("click", (evt) => {
    if (evt.target?.matches("button[data-question]")) {
        const prompt = decodeURIComponent(evt.target.dataset.question);
        currentQuestion = { prompt };
        addMessage("coach", prompt);
    }
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("fileInput").files[0];
    if (!file) return alert("Select a file first");
    try {
        await analyzeUpload(file);
    } catch (err) {
        addMessage("system", err.message);
    }
});

document.getElementById("textForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("projectText").value.trim();
    if (!text) return alert("Paste some project text");
    try {
        await analyzeText(text);
    } catch (err) {
        addMessage("system", err.message);
    }
});

document.getElementById("generateQuestions").addEventListener("click", async () => {
    try {
        await generateQuestionPack();
    } catch (err) {
        addMessage("system", err.message);
    }
});

document.getElementById("submitAnswer").addEventListener("click", submitAnswer);
document.getElementById("nextQuestion").addEventListener("click", askNextQuestion);
document.getElementById("refreshScore").addEventListener("click", updateScore);

document.getElementById("resetSession").addEventListener("click", async () => {
  await setSession(true);
  renderExtracted(null);
  questionGrid.innerHTML = "";
  scoreCard.innerHTML = '<p class="text-slate-400">Score will appear after some Q&A.</p>';
  questionQueue = [];
  currentQuestion = null;
});

document.getElementById("codeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const codeFile = document.getElementById("codeFileInput").files[0];
  const codeText = document.getElementById("codeText").value.trim();

  try {
    if (codeFile) {
      await uploadCode(codeFile);
      document.getElementById("codeFileInput").value = "";
    } else if (codeText) {
      await analyzeCode(codeText);
      document.getElementById("codeText").value = "";
    } else {
      addMessage("system", "Upload or paste code first");
    }
  } catch (err) {
    addMessage("system", err.message);
  }
});

// boot
setSession();