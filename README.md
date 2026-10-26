# AI Essay & Quiz Grader

Term project — 05506015 Computer Ethics and Professional Issues (1/2569)
กลุ่ม **Dario Amodei**

เว็บแอปช่วยครูตรวจเรียงความและข้อสอบปรนัยด้วย AI พร้อมกลไกด้านจริยธรรม AI ในตัว:

- **Transparency** — แสดง rubric และ prompt จริงที่ส่งให้ AI ทุกครั้ง
- **Anti-Hallucination** — ทุกคะแนนต้องมีข้อความยกตรง (quote) จากตัวงานนักเรียน
- **Consistency Check** — ตรวจงานเดิม 3 รอบ แสดงส่วนต่างคะแนน
- **Human Oversight / Accountability** — Teacher Override พร้อมเหตุผล บันทึกลง Audit Log
- **Privacy** — API key อยู่ฝั่ง local proxy เท่านั้น ไม่ผ่านเบราว์เซอร์ ไม่เก็บข้อมูลงานนักเรียน

## วิธีรัน

```bash
cd ai-essay-grader
export BIFROST_KEY="<your-key>"   # หรือเขียนลงไฟล์ key.txt (gitignore แล้ว)
python3 serve.py
# เปิด http://localhost:8000
```

ไม่มี key → แอปทำงานเป็น **Demo Mode** (ผลลัพธ์จำลอง ติดป้ายชัดเจน)

รองรับ upstream แบบ OpenAI-compatible ใด ๆ ผ่าน env:
`UPSTREAM_URL` (default: bifrost.pm2.fun/openai/v1/chat/completions), `UPSTREAM_MODEL` (default: qwen3.8-max)

## โครงสร้าง

```
index.html      — UI (static, no build step)
css/styles.css
js/api.js       — เรียก local proxy + ตัวแยก JSON ออกจากคำตอบโมเดล
js/demo.js      — Demo Mode (ผลลัพธ์จำลอง)
js/app.js       — logic หลัก: prompts, grading, consistency, override, audit
serve.py        — static server + AI proxy (stdlib only) — key อยู่ที่นี่
```
