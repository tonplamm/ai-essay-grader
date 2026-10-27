/* demokit.js — one-click preset demo content (Thai + English essays, bias pair, quizzes).
 * Loaded by index.html AFTER demo.js and BEFORE app.js.
 */
const DEMO_KIT = [
  {
    id: "th-good",
    label: "เรียงความไทย (คุณภาพดี)",
    rubric: "general",
    text: `ปัญญาประดิษฐ์กับการศึกษาไทย: โอกาสและความท้าทาย

การมาของปัญญาประดิษฐ์ (AI) ได้เปลี่ยนแปลงวงการการศึกษาทั่วโลกอย่างหลีกเลี่ยงไม่ได้ ในประเทศไทยเอง เครื่องมืออย่างแชตบอทและระบบตรวจคะแนนอัตโนมัติเริ่มถูกนำมาใช้ในห้องเรียนมากขึ้น คำถามสำคัญจึงไม่ใช่แค่ว่า AI ช่วยอะไรได้ แต่คือเราจะใช้อย่างไรให้เป็นธรรมและปลอดภัย

ในด้านโอกาส AI ช่วยลดภาระงานเอกสารของครู ทำให้ครูมีเวลาให้กับการสอนรายบุคคลมากขึ้น นักเรียนในพื้นที่ห่างไกลสามารถเข้าถึงคำอธิบายคุณภาพสูงได้ตลอดเวลา นอกจากนี้ระบบวิเคราะห์ข้อมูลการเรียนรู้ยังช่วยให้โรงเรียนเห็นจุดอ่อนของนักเรียนเป็นรายคน ซึ่งการประเมินแบบเดิมทำได้ยาก

อย่างไรก็ตาม ความท้าทายก็มีอยู่ไม่น้อย ประการแรกคือความลำเอียงของอัลกอริทึม หากข้อมูลฝึกส่วนใหญ่มาจากนักเรียนกลุ่มใดกลุ่มหนึ่ง ระบบอาจให้คะแนนงานของนักเรียนที่มีสไตล์การเขียนแตกต่างออกไปต่ำกว่าความเป็นจริง ประการที่สองคือความเป็นส่วนตัว ข้อมูลการเรียนรู้ของเยาวชนเป็นข้อมูลอ่อนไหวที่ต้องได้รับการปกป้องตาม PDPA ประการที่สามคือการพึ่งพา AI มากเกินไป ทั้งครูและนักเรียนอาจลดทอนการใช้วิจารณญาณของตนเองลง

โดยสรุป AI เป็นเครื่องมือที่ทรงพลังแต่ไม่ใช่คำตอบสุดท้าย การศึกษาไทยควรนำ AI มาใช้ภายใต้กรอบที่โปร่งใส มีมนุษย์กำกับดูแลเสมอ และเปิดโอกาสให้ผู้ถูกประเมินสามารถอุทธรณ์ผลลัพธ์ได้ เทคโนโลยีที่ดีไม่ใช่เทคโนโลยีที่ฉลาดที่สุด แต่คือเทคโนโลยีที่ยุติธรรมที่สุด`,
  },
  {
    id: "th-weak",
    label: "เรียงความไทย (ควรปรับปรุง)",
    rubric: "general",
    text: `AI กับการเรียน

AI คือสิ่งที่ฉลาดมาก ตอนนี้ใครๆ ก็ใช้ AI กันทั้งนั้น AI ทำให้การบ้านเสร็จเร็วขึ้นมาก ผมก็ใช้ AI ทำการบ้านบ่อยๆ เพราะมันสะดวกดี

บางคนบอกว่า AI ไม่ดี เพราะทำให้คนขี้เกียจ แต่ผมคิดว่าก็ดีเพราะไม่ต้องคิดเยอะ ครูบางคนห้ามใช้ AI แต่ผมว่าห้ามไปก็ไม่มีประโยชน์ เพราะยังไงนักเรียนก็แอบใช้อยู่ดี

AI ยังมีปัญหาเรื่องความลำเอียงด้วย บางทีมันก็ตอบผิด ถ้าเราเชื่อมันทุกอย่างก็อาจจะได้คะแนนไม่ดี เพราะฉะนั้นเราควรตรวจงานที่ AI ทำเองด้วย

สรุปคือ AI มีทั้งข้อดีและข้อเสีย เราควรใช้มันให้เป็น และไม่ควรพึ่งมันมากเกินไป`,
  },
  {
    id: "en-good",
    label: "English essay (strong)",
    rubric: "argumentative",
    text: `Artificial Intelligence in the Classroom: A Tool, Not a Teacher

The rapid adoption of artificial intelligence in education has outpaced our ability to govern it. While AI-powered grading and tutoring systems promise efficiency, they must be deployed under strict human oversight, because the cost of an automated error in education is measured not in dollars but in students' futures.

The strongest argument for AI in education is scale. A single teacher may handle thirty students, but an AI system can provide individualized feedback to each of them simultaneously. Research on formative assessment consistently shows that timely, specific feedback improves learning outcomes. AI makes such feedback economically feasible for the first time.

However, these systems inherit the biases of their training data. Studies of automated essay scoring have documented systematically lower scores for non-native writers, whose unconventional phrasing is penalized even when their reasoning is sound. A grading system that rewards fluency over substance does not measure learning; it measures privilege. Furthermore, large language models can hallucinate — producing confident but false critiques — and a student has no meaningful way to appeal a judgment whose reasoning is opaque.

The solution is not to abandon AI grading but to constrain it. Scores should always cite evidence from the student's own text, teachers must retain final authority with a documented override mechanism, and students must be able to see and challenge the criteria applied to them.

In conclusion, AI should amplify teachers' judgment, never replace it. An education system that outsources evaluation to machines it cannot audit teaches students the wrong lesson: that fairness is whatever the algorithm says it is.`,
  },
  {
    id: "en-nonnative",
    label: "English essay (non-native — bias test)",
    rubric: "argumentative",
    text: `AI in education is very important topic now. Many school use AI for check homework and give score to student. I think AI can help teacher because teacher have many student and no time for check all paper one by one. AI is fast and never tired.

But AI also have problem. First, AI not understand feeling of student. When student write essay about their family or their dream, AI only look at grammar and structure, not look at heart of writing. Second, AI can make mistake. If AI give wrong score, who is responsible? The teacher? The company who make AI? This question have no clear answer until now.

Third problem is bias. AI learn from data of people who speak English as first language. So student like me, who English is second language, maybe get lower score even though our idea is good. This is not fair. The system punish us for grammar, but grammar is not the same as intelligence.

In my opinion, school should use AI only as helper, not as judge. Teacher must check the score from AI before give to student. And student should have right to ask why they get this score. If we cannot explain the score, we should not use the system.

To conclude, AI is powerful tool but education is about human being. Machine can count the words, but only human can see the effort behind them.`,
    note: "ทดสอบอคติ: เนื้อหา/เหตุผลดีพอ ๆ กับชุด strong แต่ภาษาง่ายกว่า — เทียบคะแนนดูว่า AI ลำเอียงหรือไม่",
  },
  {
    id: "th-pitch",
    label: "Pitch Deck (Rubric ธุรกิจ)",
    rubric: "pitch",
    text: `EduFair — ระบบตรวจงานอัตโนมัติที่โปร่งใสสำหรับโรงเรียนไทย

Problem: ครูไทย 1 คนต่อนักเรียน 40+ คน ตรวจงานไม่ไหว Feedback ล่าช้า 2-3 สัปดาห์ นักเรียนไม่รู้ว่าถูกหักคะแนนเพราะอะไร

Solution: แพลตฟอร์มช่วยตรวจเรียงความด้วย AI ที่ทุกคะแนนต้องแนบหลักฐานจากตัวงาน ครูยืนยันผลก่อนประกาศ นักเรียนดูเหตุผลรายเกณฑ์และอุทธรณ์ได้ในระบบ

Market: โรงเรียนมัธยมในไทย 30,000+ แห่ง นักเรียน 4.7 ล้านคน งบ EdTech การศึกษาไทยโต 12% ต่อปี เริ่มจากโรงเรียนเอกชนและนานาชาติ 1,500 แห่งที่ยินดีจ่าย

Monetization: SaaS รายปี 49,000 บาท/โรงเรียน (ไม่จำกัดครู) ปีที่ 3 เป้าหมาย 300 โรงเรียน = ARR 14.7 ล้านบาท ขยายไปเวียดนาม/อินโดนีเซียที่มีโครงสร้างปัญหาเดียวกัน

Traction & Team: นำร่องแล้ว 2 โรงเรียน ครู 35 คน ตรวจงาน 1,200+ ชิ้น ทีมมีวิศวกร AI 2 คน (อดีตทีม NLP ระดับภูมิภาค) และผู้เชี่ยวชาญหลักสูตร 1 คน

Competition: เครื่องมือตรวจภาษาต่างประเทศ (เช่น Grammarly) ไม่รองรับภาษาไทยเชิงลึกและไม่ผูกกับ rubric ของโรงเรียน เราต่างที่ "ความโปร่งใสที่ตรวจสอบได้" และรองรับภาษาไทย/PDPA ในตัว`,
  },
];

const DEMO_QUIZZES = {
  set1: `1. ข้อใดคือผลกระทบหลักของภาวะโลกร้อนที่นักวิทยาศาสตร์เห็นพ้องกัน
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
d) AI หยุดทำงานกะทันหัน`,
  answers1: "1a 2b 3c",
  set2: `1. หลักการ "Human-in-the-loop" ในระบบ AI หมายถึงอะไร
a) มนุษย์ห้ามยุ่งกับระบบ AI
b) มนุษย์มีส่วนร่วมตรวจสอบและตัดสินใจร่วมกับ AI ในขั้นตอนสำคัญ
c) AI ตัดสินใจแทนมนุษย์ทั้งหมด
d) ใช้มนุษย์ทดสอบ AI ด้วยการเดา

2. อคติ (Bias) ในโมเดล AI ส่วนใหญ่เกิดจากสาเหตุใด
a) คอมพิวเตอร์ทำงานเร็วเกินไป
b) ข้อมูลที่ใช้ฝึกไม่ครอบคลุมหรือสะท้อนอคติเดิมของสังคม
c) ผู้ใช้พิมพ์คำสั่งผิด
d) อินเทอร์เน็ตไม่เสถียร

3. ข้อใดเป็นมาตรการคุ้มครองความเป็นส่วนตัวของข้อมูลนักเรียนที่ดีที่สุดในระบบตรวจคะแนน AI
a) เก็บข้อมูลนักเรียนทั้งหมดไว้บนเซิร์ฟเวอร์สาธารณะ
b) แชร์ข้อมูลกับพันธมิตรทางการค้าเพื่อพัฒนาบริการ
c) ไม่เก็บข้อมูลถาวร ปิดบังตัวตนก่อนส่ง และขอความยินยอมชัดเจน
d) ไม่ต้องทำอะไร เพราะข้อมูลนักเรียนไม่ใช่ข้อมูลส่วนบุคคล

4. ถ้า AI ให้คะแนนนักเรียนผิดและนักเรียนเสียสิทธิ์ ผู้ใดควรรับผิดชอบเป็นอันดับแรกตามหลักธรรมาภิบาล AI
a) ตัวอัลกอริทึมเอง
b) ผู้ที่ยืนยันและนำผลของ AI ไปใช้จริง (เช่น ครู/สถาบัน) ร่วมกับกระบวนการตรวจสอบย้อนหลัง
c) ไม่มีใครต้องรับผิดชอบ
d) นักเรียนที่สอบเอง`,
  answersWrong: "1b 2b 3c 4a",
};
