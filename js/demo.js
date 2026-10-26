/* demo.js — clearly-labeled simulated results when no live AI key is present.
 * Deterministic-ish: derives crude stats from the text so demos feel responsive,
 * with small variance to illustrate (honestly) that even a "grader" can be noisy.
 */
const Demo = (() => {
  function textStats(text) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = (text.match(/[.!?।ฯ]+/g) || []).length || 1;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length || 1;
    const unique = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 2)).size;
    return { words, sentences, paragraphs, lexical: unique / Math.max(words, 1) };
  }

  function scoreFor(base, spread) {
    // small jitter so consistency-check demos show realistic variance
    const j = (Math.random() - 0.5) * spread;
    return Math.max(0, Math.min(base + j, 10));
  }

  async function gradeEssay(text, rubric) {
    await sleep(900 + Math.random() * 700);
    const st = textStats(text);
    if (st.words < 10) throw { code: "too_short", detail: "ข้อความสั้นเกินไป (จำลอง)" };
    const results = rubric.criteria.map(c => {
      let base = 5.5;
      if (c.id === "content") base = Math.min(9, 4 + st.words / 60 + st.lexical * 6);
      if (c.id === "structure") base = Math.min(9, 3.5 + st.paragraphs * 1.1);
      if (c.id === "grammar" || c.id === "language") base = Math.min(8.5, 4.5 + st.lexical * 8);
      if (c.id === "critical") base = Math.min(8.5, 3 + st.sentences * 0.35);
      if (c.id === "creativity") base = Math.min(8.5, 4 + st.lexical * 7);
      if (c.id === "clarity") base = Math.min(9, 5 + st.lexical * 5);
      if (c.id === "market" || c.id === "financial") base = 6;
      const s = Math.round(scoreFor(base, 1.4) * 2) / 2;
      return {
        criterion: c.id, name: c.name, max: c.max,
        score: Math.min(s, c.max),
        comment: `[DEMO] ประเมินจำลองจากสถิติข้อความ: ${st.words} คำ, ${st.paragraphs} ย่อหน้า — เกณฑ์นี้ดู${c.name}`,
        evidence: pickEvidence(text),
      };
    });
    const total = results.reduce((a, r) => a + r.score, 0);
    return {
      demo: true,
      total: Math.round(total * 10) / 10,
      max: results.reduce((a, r) => a + r.max, 0),
      criteria: results,
      feedback: `[ผลลัพธ์จำลอง — ไม่ได้ตรวจโดย AI จริง] งานนี้มี ${st.words} คำ ${st.paragraphs} ย่อหน้า จุดแข็งที่จำลอง: การลำดับเนื้อหา จุดที่ควรพัฒนา: เพิ่มหลักฐานเชิงประจักษ์และอ้างอิงแหล่งข้อมูล`,
      suggestions: ["[DEMO] เพิ่มตัวอย่างจริงสนับสนุนข้อโต้แย้ง", "[DEMO] ตรวจไวยากรณ์ย่อหน้าสุดท้าย", "[DEMO] สรุปประเด็นให้ชัดในย่อหน้าปิด"],
    };
  }

  async function gradeQuiz(quizText, answersText) {
    await sleep(700 + Math.random() * 500);
    const questions = parseQuiz(quizText);
    if (!questions.length) throw { code: "no_questions", detail: "ไม่พบโจทย์ (จำลอง)" };
    const student = parseAnswers(answersText);
    const solved = questions.map((q, i) => {
      // demo key: rotate a/b/c/d deterministically by index
      const key = ["a", "b", "c", "d"][i % 4];
      return { n: q.n, key, explanation: `[DEMO] เฉลยจำลอง — ในการใช้งานจริง AI จะวิเคราะห์ตัวเลือกแต่ละข้อ`, student: student[i] || null };
    });
    const correct = solved.filter(s => s.student === s.key).length;
    return {
      demo: true,
      total: correct, max: solved.length,
      items: solved,
      note: "[ผลลัพธ์จำลอง] เฉลยที่แสดงเป็นการสุ่มแบบกำหนดรูปแบบ ไม่ใช่คำตอบจริงของโจทย์",
    };
  }

  function pickEvidence(text) {
    const sentences = text.split(/(?<=[.!?।ฯ])\s+|\n+/).filter(s => s.trim().length > 15);
    if (!sentences.length) return text.slice(0, 80);
    return sentences[Math.floor(Math.random() * Math.min(3, sentences.length))].trim().slice(0, 140);
  }

  function parseQuiz(text) {
    const blocks = text.split(/\n\s*\n+/).filter(b => b.trim());
    return blocks.map((b, i) => {
      const first = b.trim().split("\n")[0];
      const m = first.match(/^\s*(\d+)\s*[.)]/);
      return { n: m ? parseInt(m[1]) : i + 1, raw: b };
    });
  }

  function parseAnswers(text) {
    const t = (text || "").toLowerCase().replace(/\s+/g, " ");
    const pairs = [...t.matchAll(/(\d+)\s*[:.\-]?\s*([a-d])/g)];
    return pairs.map(p => p[2]);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  return { gradeEssay, gradeQuiz, textStats };
})();
