/* app.js — UI logic for AI Essay & Quiz Grader */

// ───────────────────────── Rubrics ─────────────────────────
const RUBRICS = {
  general: {
    name: "เรียงความทั่วไป (General Essay)",
    desc: "เนื้อหา · โครงสร้าง · ภาษา · การคิดวิเคราะห์",
    criteria: [
      { id: "content",   name: "ความถูกต้องและเนื้อสาระ", max: 10 },
      { id: "structure", name: "โครงสร้างและการลำดับความคิด", max: 10 },
      { id: "grammar",   name: "ไวยากรณ์และการใช้ภาษา", max: 10 },
      { id: "critical",  name: "การคิดวิเคราะห์และให้เหตุผล", max: 10 },
    ],
  },
  argumentative: {
    name: "เรียงความเชิงโต้แย้ง (Argumentative)",
    desc: "จุดยืน · หลักฐาน · การโต้แย้งกลับ · ภาษา",
    criteria: [
      { id: "content",   name: "ความชัดเจนของจุดยืน (Thesis)", max: 10 },
      { id: "critical",  name: "คุณภาพหลักฐานและการอ้างเหตุผล", max: 10 },
      { id: "structure", name: "การคาดการณ์และโต้แย้งมุมมองตรงข้าม", max: 10 },
      { id: "grammar",   name: "ภาษาและความน่าเชื่อถือ", max: 10 },
    ],
  },
  pitch: {
    name: "Pitch Deck / ข้อเสนอโครงการ",
    desc: "ปัญหา · ตลาด · การเงิน · ความชัดเจน",
    criteria: [
      { id: "content",   name: "ความครบถ้วนของหัวข้อสำคัญ (Problem/Solution/Market/Monetization)", max: 10 },
      { id: "market",    name: "การวิเคราะห์ตลาดและกลุ่มเป้าหมาย", max: 10 },
      { id: "financial", name: "ความสมเหตุสมผลของตัวเลข/โมเดลรายได้", max: 10 },
      { id: "clarity",   name: "ความชัดเจนและการเล่าเรื่อง", max: 10 },
    ],
  },
};

// ───────────────────────── State ─────────────────────────
const S = {
  settings: JSON.parse(localStorage.getItem("aeg_settings") || '{"mode":"auto","temperature":0.2,"model":"qwen3.8-max"}'),
  liveProxy: false,
  currentRubric: "general",
  lastEssayResult: null,
  lastEssayText: "",
};
const $ = id => document.getElementById(id);

// ───────────────────────── Boot ─────────────────────────
(async function boot() {
  renderRubrics();
  bindTabs();
  bindModals();
  bindSettings();
  bindEssay();
  bindQuiz();
  bindAudit();

  S.liveProxy = await API.probe();
  updateModeBadge();
})();

function effectiveDemo() {
  return S.settings.mode === "demo" || !S.liveProxy;
}

function updateModeBadge() {
  const b = $("mode-badge");
  if (effectiveDemo()) {
    b.textContent = "DEMO MODE (จำลอง)";
    b.className = "badge badge-demo";
    b.title = "ไม่มีการเรียก AI จริง — แสดงผลลัพธ์จำลองที่ติดป้ายชัดเจน";
  } else {
    b.textContent = "LIVE · AI ทำงานจริง";
    b.className = "badge badge-live";
    b.title = "เรียก AI ผ่าน local proxy — key อยู่ฝั่งเซิร์ฟเวอร์ ไม่ผ่านเบราว์เซอร์";
  }
}

function toast(msg, ms = 3200) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.add("hidden"), ms);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ───────────────────────── Tabs ─────────────────────────
function bindTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      $("tab-" + tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "audit") renderAudit();
    });
  });
}

// ───────────────────────── Modals ─────────────────────────
function bindModals() {
  $("btn-privacy").onclick = () => $("modal-privacy").classList.remove("hidden");
  $("btn-settings").onclick = () => {
    $("set-mode").value = S.settings.mode;
    $("set-temp").value = S.settings.temperature;
    $("set-temp-out").value = S.settings.temperature;
    $("set-model").value = S.settings.model;
    $("modal-settings").classList.remove("hidden");
  };
  document.querySelectorAll(".modal-close").forEach(b =>
    b.addEventListener("click", () => b.closest(".modal-backdrop").classList.add("hidden")));
  document.querySelectorAll(".modal-backdrop").forEach(m =>
    m.addEventListener("click", e => { if (e.target === m) m.classList.add("hidden"); }));
}

function bindSettings() {
  $("set-temp").oninput = e => $("set-temp-out").value = e.target.value;
  $("set-mode").onchange = saveSettings;
  $("set-temp").onchange = saveSettings;
  $("set-model").onchange = saveSettings;
  function saveSettings() {
    S.settings = {
      mode: $("set-mode").value,
      temperature: parseFloat($("set-temp").value),
      model: $("set-model").value.trim() || "qwen3.8-max",
    };
    localStorage.setItem("aeg_settings", JSON.stringify(S.settings));
    updateModeBadge();
  }
}

// ───────────────────────── Rubric picker ─────────────────────────
function renderRubrics() {
  const wrap = $("rubric-picker");
  wrap.innerHTML = Object.entries(RUBRICS).map(([key, r]) => `
    <label class="rubric-opt ${key === S.currentRubric ? "selected" : ""}" data-key="${key}">
      <input type="radio" name="rubric" value="${key}" ${key === S.currentRubric ? "checked" : ""}>
      <span>
        <span class="r-name">${esc(r.name)}</span><br>
        <span class="r-desc">${esc(r.desc)} — รวม ${r.criteria.reduce((a, c) => a + c.max, 0)} คะแนน</span>
      </span>
    </label>`).join("");
  wrap.querySelectorAll("input[name=rubric]").forEach(inp =>
    inp.addEventListener("change", () => {
      S.currentRubric = inp.value;
      wrap.querySelectorAll(".rubric-opt").forEach(o => o.classList.toggle("selected", o.dataset.key === inp.value));
    }));
}

// ───────────────────────── Prompt building (transparent by design) ─────────────────────────
function buildEssayPrompt(essayText, rubric) {
  const critLines = rubric.criteria.map(c => `- ${c.id} ("${c.name}") : ให้คะแนน 0–${c.max}`).join("\n");
  return `คุณคือผู้ช่วยตรวจเรียงความของครู โปรดให้คะแนนงานของนักเรียนตามเกณฑ์ที่กำหนดอย่างยุติธรรมและเป็นกลาง

เกณฑ์การให้คะแนน (แต่ละเกณฑ์ให้คะแนนแยกกัน):
${critLines}

กฎสำคัญ:
1. ทุกคะแนนต้องมี "evidence" เป็นข้อความที่ยกมาตรง ๆ (quote) จากงานของนักเรียน ห้ามแต่งข้อความที่ไม่มีอยู่จริง
2. ห้ามลำเอียงจากสำนวน ภาษาแม่ หรือสไตล์การเขียน — ประเมินจากคุณภาพของเนื้อหาและเหตุผลเท่านั้น
3. ถ้าส่วนใดของงานขาดหายไป ให้ระบุตรง ๆ ใน comment ว่า "ไม่พบส่วนนี้" แทนการเดา
4. ตอบเป็น JSON เท่านั้น ตามโครงสร้างนี้:
{
  "criteria": [
    { "criterion": "<id>", "score": <number>, "comment": "<ภาษาไทย กระชับ>", "evidence": "<ข้อความยกตรงจากงาน หรือ 'ไม่พบ'>" }
  ],
  "feedback": "<ภาพรวม 2-4 ประโยค ภาษาไทย>",
  "suggestions": ["<ข้อเสนอแนะปรับปรุง 3-5 ข้อ>"]
}

─── งานของนักเรียน (เริ่ม) ───
${essayText}
─── งานของนักเรียน (จบ) ───`;
}

function buildQuizPrompt(quizText) {
  return `คุณคือผู้ช่วยออกเฉลยข้อสอบปรนัยของครู

โจทย์:
${quizText}

กฎสำคัญ:
1. วิเคราะห์ทีละข้อ เลือกคำตอบที่ถูกต้องที่สุดตามความรู้ทั่วไป ถ้าโจทย์กำกวมให้ระบุใน explanation
2. explanation สั้น กระชับ เป็นภาษาไทย อธิบายว่าทำไมข้อที่ถูกถึงถูก
3. ตอบเป็น JSON เท่านั้น:
{
  "items": [ { "n": <เลขข้อ>, "key": "<a|b|c|d>", "explanation": "<ภาษาไทย>" } ]
}

ห้ามใส่ข้อความอื่นนอกเหนือจาก JSON`;
}

// ───────────────────────── Essay grading ─────────────────────────
function bindEssay() {
  $("btn-sample-essay").onclick = () => {
    $("essay-input").value = SAMPLE_ESSAY;
    toast("ใส่ตัวอย่างเรียงความแล้ว");
  };
  $("btn-grade").onclick = () => gradeEssay(false);
  $("btn-consistency").onclick = () => gradeEssay(true);
}

async function gradeEssay(consistencyMode) {
  const text = $("essay-input").value.trim();
  const status = $("grade-status");
  if (text.length < 20) { toast("กรุณาวางเรียงความก่อน (อย่างน้อย 20 ตัวอักษร)"); return; }

  const rubric = RUBRICS[S.currentRubric];
  const prompt = buildEssayPrompt(text, rubric);
  $("prompt-preview").textContent = prompt;

  const runs = consistencyMode ? 3 : 1;
  const btn = consistencyMode ? $("btn-consistency") : $("btn-grade");
  btn.disabled = true; $("btn-grade").disabled = true; $("btn-consistency").disabled = true;

  const results = [];
  try {
    for (let i = 0; i < runs; i++) {
      status.innerHTML = `<span class="spinner"></span> กำลังตรวจ${consistencyMode ? ` (รอบ ${i + 1}/${runs})` : ""}…`;
      let res;
      if (effectiveDemo()) {
        res = await Demo.gradeEssay(text, rubric);
      } else {
        const { text: raw } = await API.chat(
          [{ role: "user", content: prompt }],
          { temperature: S.settings.temperature, model: S.settings.model }
        );
        res = normalizeEssayResult(extractJSON(raw), rubric);
        res.demo = false;
      }
      results.push(res);
    }
    S.lastEssayResult = results[results.length - 1];
    S.lastEssayText = text;

    if (consistencyMode) renderConsistency(results, rubric);
    else renderEssayResult(results[0], rubric);

    status.textContent = "";
    if (results[0].demo) toast("แสดงผลลัพธ์จำลอง (Demo Mode) — ไม่ได้ตรวจโดย AI จริง");
  } catch (err) {
    status.innerHTML = `<span class="status error">❌ ${esc(err.detail || err.message || JSON.stringify(err))}</span>`;
  } finally {
    btn.disabled = false; $("btn-grade").disabled = false; $("btn-consistency").disabled = false;
  }
}

function normalizeEssayResult(j, rubric) {
  const byId = {};
  for (const c of (j.criteria || [])) byId[c.criterion || c.id] = c;
  const criteria = rubric.criteria.map(c => {
    const g = byId[c.id] || {};
    const s = typeof g.score === "number" ? Math.max(0, Math.min(c.max, g.score)) : 0;
    return { criterion: c.id, name: c.name, max: c.max, score: s, comment: g.comment || "(โมเดลไม่ระบุ)", evidence: g.evidence || "ไม่พบ" };
  });
  const total = Math.round(criteria.reduce((a, r) => a + r.score, 0) * 10) / 10;
  return { demo: false, total, max: criteria.reduce((a, r) => a + r.max, 0), criteria, feedback: j.feedback || "", suggestions: j.suggestions || [] };
}

function renderEssayResult(res, rubric) {
  const card = $("essay-result");
  card.innerHTML = `
    ${res.demo ? '<span class="demo-stamp">DEMO — ผลลัพธ์จำลอง</span>' : ""}
    <div class="score-hero"><span class="big">${res.total}</span><span class="of">/ ${res.max} คะแนน</span></div>
    ${res.criteria.map((c, i) => `
      <div class="criterion">
        <div class="c-head"><span class="c-name">${esc(c.name)}</span><span class="c-score">${c.score} / ${c.max}</span></div>
        <div class="c-comment">${esc(c.comment)}</div>
        <div class="c-evidence"><span class="c-evidence-label">หลักฐานจากตัวงาน (Anti-Hallucination):</span>“${esc(c.evidence)}”</div>
      </div>`).join("")}
    <div class="feedback-box">
      <h3>💬 Feedback รวม</h3>${esc(res.feedback)}
      ${res.suggestions && res.suggestions.length ? `<h3 style="margin-top:10px">🛠 ข้อเสนอแนะ</h3><ul style="padding-left:20px;font-size:13px">${res.suggestions.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="override-row">
      <b style="font-size:13px">สิทธิ์ครู (Human Oversight):</b>
      <input type="number" id="override-score" min="0" max="${res.max}" step="0.5" value="${res.total}">
      <input type="text" id="override-reason" placeholder="เหตุผลของการแก้ไขคะแนน…" style="flex:1;min-width:180px">
      <button class="btn btn-outline btn-sm" id="btn-override">✍️ บันทึกคะแนนที่แก้ไข</button>
    </div>`;
  $("btn-override").onclick = () => saveOverride(res);
}

function renderConsistency(results, rubric) {
  const totals = results.map(r => r.total);
  const min = Math.min(...totals), max = Math.max(...totals);
  const spread = Math.round((max - min) * 10) / 10;
  const good = spread <= 1;
  const card = $("essay-result");
  card.innerHTML = `
    ${results[0].demo ? '<span class="demo-stamp">DEMO — ผลลัพธ์จำลอง</span>' : ""}
    <h2>🔁 Consistency Check — งานเดิม ตรวจ ${results.length} รอบ</h2>
    <table class="consistency-table">
      <tr><th>รอบ</th>${rubric.criteria.map(c => `<th>${esc(c.name)}</th>`).join("")}<th>รวม</th></tr>
      ${results.map((r, i) => `<tr><td>${i + 1}</td>${r.criteria.map(c => `<td>${c.score}</td>`).join("")}<td><b>${r.total}</b></td></tr>`).join("")}
    </table>
    <p style="margin-top:12px;font-size:14px">คะแนนรวมต่ำสุด ${min} · สูงสุด ${max} → ส่วนต่าง <span class="${good ? "variance-good" : "variance-bad"}">${spread} คะแนน</span> ${good ? "✅ สม่ำเสมอ" : "⚠️ แกว่งมาก — นี่คือปัญหา Consistency & Reliability ที่ต้องระวังในระบบตรวจคะแนนจริง"}</p>
    <p class="hint" style="margin-top:8px">แนวทางลด: ใช้ temperature ต่ำ, ตรวจหลายรอบแล้วหามัธยฐาน, และมีมนุษย์ทบทวนคะแนนที่ระบบแกว่ง</p>`;
}

// ───────────────────────── Override + audit ─────────────────────────
function saveOverride(aiResult) {
  const score = parseFloat($("override-score").value);
  const reason = $("override-reason").value.trim();
  if (isNaN(score)) { toast("กรุณาใส่คะแนน"); return; }
  if (!reason) { toast("การแก้คะแนนต้องระบุเหตุผลเสมอ (Accountability)"); return; }
  const log = JSON.parse(localStorage.getItem("aeg_audit") || "[]");
  log.unshift({
    ts: new Date().toISOString(),
    aiScore: aiResult.total,
    humanScore: score,
    reason,
    rubric: S.currentRubric,
    demo: aiResult.demo,
    excerpt: S.lastEssayText.slice(0, 80),
  });
  localStorage.setItem("aeg_audit", JSON.stringify(log));
  toast("บันทึกการแก้ไขแล้ว — ดูได้ที่แท็บ Audit Log");
}

function bindAudit() {
  $("btn-clear-audit").onclick = () => {
    localStorage.removeItem("aeg_audit");
    renderAudit();
    toast("ล้างบันทึกแล้ว");
  };
}

function renderAudit() {
  const log = JSON.parse(localStorage.getItem("aeg_audit") || "[]");
  const el = $("audit-list");
  if (!log.length) { el.innerHTML = '<p class="result-empty">ยังไม่มีการแก้ไขคะแนนโดยมนุษย์</p>'; return; }
  el.innerHTML = log.map(e => `
    <div class="audit-entry">
      <div class="a-time">${new Date(e.ts).toLocaleString("th-TH")}${e.demo ? " · DEMO" : ""}</div>
      <div class="a-detail">คะแนน AI <b>${e.aiScore}</b> → มนุษย์แก้ไขเป็น <b>${e.humanScore}</b> · เหตุผล: ${esc(e.reason)}</div>
      <div class="a-time" style="margin-top:3px">งาน: “${esc(e.excerpt)}…”</div>
    </div>`).join("");
}

// ───────────────────────── Quiz grading ─────────────────────────
function bindQuiz() {
  $("btn-sample-quiz").onclick = () => {
    $("quiz-input").value = SAMPLE_QUIZ;
    $("answers-input").value = "1a 2b 3c";
    toast("ใส่ตัวอย่างข้อสอบแล้ว");
  };
  $("btn-quiz-grade").onclick = gradeQuiz;
}

async function gradeQuiz() {
  const quizText = $("quiz-input").value.trim();
  const answersText = $("answers-input").value.trim();
  const status = $("quiz-status");
  if (!quizText) { toast("กรุณาวางโจทย์ข้อสอบก่อน"); return; }

  const prompt = buildQuizPrompt(quizText);
  $("quiz-prompt-preview").textContent = prompt;

  $("btn-quiz-grade").disabled = true;
  status.innerHTML = '<span class="spinner"></span> AI กำลังสร้างเฉลย…';
  try {
    let res;
    if (effectiveDemo()) {
      res = await Demo.gradeQuiz(quizText, answersText);
    } else {
      const { text: raw } = await API.chat(
        [{ role: "user", content: prompt }],
        { temperature: 0, model: S.settings.model }
      );
      const j = extractJSON(raw);
      const student = [...answersText.toLowerCase().matchAll(/(\d+)\s*[:.\-]?\s*([a-d])/g)].reduce((acc, m) => (acc[m[1]] = m[2], acc), {});
      res = {
        demo: false,
        items: (j.items || []).map(it => ({
          n: it.n, key: (it.key || "").toLowerCase(), explanation: it.explanation || "", student: student[it.n] || null,
        })),
      };
      res.max = res.items.length;
      res.total = res.items.filter(i => i.student === i.key).length;
    }
    renderQuizResult(res);
    status.textContent = "";
    if (res.demo) toast("แสดงผลลัพธ์จำลอง (Demo Mode)");
  } catch (err) {
    status.innerHTML = `<span class="status error">❌ ${esc(err.detail || err.message || JSON.stringify(err))}</span>`;
  } finally {
    $("btn-quiz-grade").disabled = false;
  }
}

function renderQuizResult(res) {
  const el = $("quiz-result");
  el.innerHTML = `
    ${res.demo ? '<span class="demo-stamp">DEMO — ผลลัพธ์จำลอง</span>' : ""}
    <div class="score-hero"><span class="big">${res.total}</span><span class="of">/ ${res.max} ข้อ</span></div>
    ${res.items.map(it => `
      <div class="quiz-item">
        <div class="q-head">
          <span>ข้อ ${it.n} — เฉลย: ${it.key.toUpperCase()}${it.student ? ` · นักเรียนตอบ: ${it.student.toUpperCase()}` : ""}</span>
          <span class="${it.student === it.key ? "q-correct" : "q-wrong"}">${it.student ? (it.student === it.key ? "✓ ถูก" : "✗ ผิด") : "— ไม่ได้ตอบ"}</span>
        </div>
        <div class="q-explain">${esc(it.explanation)}</div>
      </div>`).join("")}
    ${res.note ? `<p class="hint" style="margin-top:10px">${esc(res.note)}</p>` : ""}
    <p class="hint" style="margin-top:10px">⚠️ ครูควรทบทวนเฉลยก่อนนำไปใช้จริง — AI อาจเฉลยผิดได้ (Human Oversight)</p>`;
}

// ───────────────────────── Samples ─────────────────────────
const SAMPLE_ESSAY = `ปัญญาประดิษฐ์กับการศึกษาไทย: โอกาสและความท้าทาย

การมาของปัญญาประดิษฐ์ (AI) ได้เปลี่ยนแปลงวงการการศึกษาทั่วโลกอย่างหลีกเลี่ยงไม่ได้ ในประเทศไทยเอง เครื่องมืออย่างแชตบอทและระบบตรวจคะแนนอัตโนมัติเริ่มถูกนำมาใช้ในห้องเรียนมากขึ้น คำถามสำคัญจึงไม่ใช่แค่ว่า AI ช่วยอะไรได้ แต่คือเราจะใช้อย่างไรให้เป็นธรรมและปลอดภัย

ในด้านโอกาส AI ช่วยลดภาระงานเอกสารของครู ทำให้ครูมีเวลาให้กับการสอนรายบุคคลมากขึ้น นักเรียนในพื้นที่ห่างไกลสามารถเข้าถึงคำอธิบายคุณภาพสูงได้ตลอดเวลา นอกจากนี้ระบบวิเคราะห์ข้อมูลการเรียนรู้ยังช่วยให้โรงเรียนเห็นจุดอ่อนของนักเรียนเป็นรายคน ซึ่งการประเมินแบบเดิมทำได้ยาก

อย่างไรก็ตาม ความท้าทายก็มีอยู่ไม่น้อย ประการแรกคือความลำเอียงของอัลกอริทึม หากข้อมูลฝึกส่วนใหญ่มาจากนักเรียนกลุ่มใดกลุ่มหนึ่ง ระบบอาจให้คะแนนงานของนักเรียนที่มีสไตล์การเขียนแตกต่างออกไปต่ำกว่าความเป็นจริง ประการที่สองคือความเป็นส่วนตัว ข้อมูลการเรียนรู้ของเยาวชนเป็นข้อมูลอ่อนไหวที่ต้องได้รับการปกป้องตาม PDPA ประการที่สามคือการพึ่งพา AI มากเกินไป ทั้งครูและนักเรียนอาจลดทอนการใช้วิจารณญาณของตนเองลง

โดยสรุป AI เป็นเครื่องมือที่ทรงพลังแต่ไม่ใช่คำตอบสุดท้าย การศึกษาไทยควรนำ AI มาใช้ภายใต้กรอบที่โปร่งใส มีมนุษย์กำกับดูแลเสมอ และเปิดโอกาสให้ผู้ถูกประเมินสามารถอุทธรณ์ผลลัพธ์ได้ เทคโนโลยีที่ดีไม่ใช่เทคโนโลยีที่ฉลาดที่สุด แต่คือเทคโนโลยีที่ยุติธรรมที่สุด`;

const SAMPLE_QUIZ = `1. ข้อใดคือผลกระทบหลักของภาวะโลกร้อนที่นักวิทยาศาสตร์เห็นพ้องกัน
a) ระดับน้ำทะเลสูงขึ้นจากน้ำแข็งขั้วโลกละลาย
b) เกิดแผ่นดินไหวบ่อยขึ้น
c) ภูเขาไฟระเบิดถี่ขึ้น
d) สนามแม่เหล็กโลกกลับขั้ว

2. PDPA ของประเทศไทยเกี่ยวข้องกับเรื่องใดมากที่สุด
a) ภาษีเงินได้บุคคลธรรมดา
b) การคุ้มครองข้อมูลส่วนบุคคล
c) ลิขสิทธิ์ซอฟต์แวร์
d) มาตรฐานผลิตภัณฑ์อุตสาหกรรม

3. "Hallucination" ในบริบทของ AI หมายถึงอะไร
a) AI ประมวลผลภาพได้เร็วขึ้น
b) AI ถูกแฮ็กโดยผู้ไม่หวังดี
c) AI สร้างข้อมูลที่ดูน่าเชื่อแต่ไม่จริงหรือไม่มีหลักฐานรองรับ
d) AI หยุดทำงานกะทันหัน`;
