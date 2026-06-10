# 🤖 BotBot Auto QA v8.6 (Chatbot QA Automation)

ระบบทดสอบ Chatbot อัตโนมัติที่พัฒนาด้วย **Puppeteer**, **Node.js** และ **Google APIs (Sheets & Docs)**
ถูกออกแบบมาให้สามารถอ่าน Test Cases จาก Google Sheets, นำไปทดสอบถาม-ตอบกับ Chatbot จริงในเบราว์เซอร์, บันทึกภาพหน้าจอ (Screenshots), ตรวจสอบความถูกต้องของคำตอบ (Validation/Similarity), และอัปเดตผลลัพธ์กลับลงไปใน Google Sheets และ Google Docs ได้แบบครบวงจร

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- **Interactive CLI Menu (`run_config.js`)**: เมนูหลักที่ช่วยให้ใช้งานได้ง่ายสุดๆ ไม่ต้องนั่งจำคำสั่ง
- **Profiles System**: บันทึกการตั้งค่าแยกตามโปรเจกต์หรือรอบการเทสต์ได้ (จัดการผ่านเมนู)
- **Target Separation**: รองรับการแยกไฟล์อ่านข้อมูล (Source) และไฟล์เขียนผลลัพธ์ (Target) ออกจากกัน ป้องกันข้อมูลต้นฉบับเสียหาย
- **Smart Image Syncing**: จับภาพหน้าจอ จัดหมวดหมู่ตามสถานะ (Pass/Partial/Fail) และชื่อเรื่องอัตโนมัติ พร้อมระบบอัปโหลดขึ้น Google Drive / ImgBB และแปะลิงก์กลับไปที่ Sheets/Docs
- **Auto-Resume (Checkpoints)**: บันทึกความคืบหน้าทุกๆ ข้อ ถ้าระบบค้างหรือเน็ตหลุด สามารถรันต่อจากข้อล่าสุดได้ทันที
- **Data Consolidation**: ระบบตรวจสอบ (Validate) และรวมผลลัพธ์ (Consolidate) จากหลายแหล่ง (JSON, Sheets, Docs) เข้าด้วยกันอย่างอัจฉริยะ

---

## 📁 โครงสร้างโปรเจค (Project Structure)

```text
BotBot_AutoQAV_8_6_69/
├── run_config.js             ← 🏠 เมนูหลักของโปรแกรม (Entry Point)
├── validate.js               ← สคริปต์ตรวจสอบความตรงกันของข้อมูล (JSON vs Sheets vs Docs)
├── consolidate.js            ← สคริปต์รวมผลลัพธ์จาก 3 แหล่งสร้างเป็น master_results.json
├── write_to_sheets.js        ← สคริปต์สำหรับนำผลลัพธ์เขียนกลับลง Google Sheets
├── write_to_docs.js          ← สคริปต์สำหรับนำผลลัพธ์เขียนกลับลง Google Docs
├── src/
│   ├── index.js              ← 🤖 Core Runner (ตัวสั่งเบราว์เซอร์รัน Auto QA)
│   ├── config/index.js       ← ตัวจัดการค่า Configuration จาก .env
│   └── modules/              ← คลาสและเครื่องมือย่อย (Browser, Sheets/Docs Client, Image Sync)
├── credentials/
│   └── google-service-account.json  ← คีย์สำหรับต่อ Google API (ต้องสร้างเอง)
├── profiles/                 ← เก็บไฟล์ .json ของแต่ละ Profile
├── logs/                     ← เก็บไฟล์ Log และ Checkpoint (progress_*.json) เพื่อ Resume
├── output/                   ← เก็บไฟล์ผลลัพธ์ (master_results, pass_results, ฯลฯ)
├── screenshots/
│   ├── pass/[Topic]/         ← ภาพหน้าจอข้อที่ผ่าน
│   ├── partial/[Topic]/      ← ภาพหน้าจอข้อที่ผ่านบางส่วน
│   └── fail/[Topic]/         ← ภาพหน้าจอข้อที่ไม่ผ่าน
├── .env                      ← ไฟล์ตั้งค่าหลักของระบบ
└── .env.run                  ← (System generated) เก็บ Active Profile ปัจจุบัน
```

---

## 🚀 การติดตั้งและเตรียมความพร้อม

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. เตรียม Google Service Account
1. สร้างโปรเจคใน Google Cloud Console
2. เปิดใช้งาน **Google Sheets API** และ **Google Docs API** (และ Drive API ถ้าใช้)
3. สร้าง Service Account และดาวน์โหลดไฟล์ JSON Key
4. นำไฟล์ JSON มาวางในโฟลเดอร์ `credentials/` 
5. **อย่าลืม:** นำ Email ของ Service Account ไปแชร์ (Editor) ในไฟล์ Sheets และ Docs ที่ต้องการใช้งาน

### 3. ตั้งค่าไฟล์ `.env`
ก็อปปี้ไฟล์ `.env.example` เป็น `.env` และตั้งค่าต่างๆ ที่สำคัญ (ดูรายละเอียดด้านล่าง)

---

## ⚙️ การตั้งค่า `.env` (Configuration)

คุณสามารถตั้งค่าการดึงและเขียนข้อมูลได้ละเอียดมาก โดยเฉพาะการแยก Source และ Target:

```dotenv
# ── การเชื่อมต่อกับ Chatbot ──
CHATBOT_URL=https://your-chatbot.com
CHATBOT_INPUT_SELECTOR=textarea
CHATBOT_SEND_SELECTOR=button.send

# ── 1. ไฟล์ต้นฉบับสำหรับอ่านคำถาม (SOURCE) ──
GOOGLE_SPREADSHEET_ID=ไอดีของไฟล์_Sheets_ต้นฉบับ
GOOGLE_SHEET_NAME="ชื่อแท็บ"
GOOGLE_DOCUMENT_ID=ไอดีของไฟล์_Docs_ต้นฉบับ

# ── 2. ไฟล์ปลายทางสำหรับอัพผลลัพธ์ (TARGET) ──
# (ถ้าไม่ใส่ ระบบจะเขียนทับกลับไปที่ Source ด้านบน)
TARGET_GOOGLE_SPREADSHEET_ID=ไอดีของไฟล์_Sheets_ปลายทาง
TARGET_GOOGLE_SHEET_NAME="Result_Tab"

# ── ตัวเลือกการอัพโหลดรูปภาพ ──
GOOGLE_DRIVE_SCREENSHOT_FOLDER_ID=ไอดีโฟลเดอร์ใน_Drive
# หรือ
IMGBB_API_KEY=คีย์_ImgBB
```

---

## 🎮 วิธีการใช้งาน (Main Menu)

ทุกอย่างเริ่มต้นที่คำสั่งนี้คำสั่งเดียว:
```bash
node run_config.js
```
ระบบจะแสดงเมนูหลัก 3 ส่วน ดังนี้:

### [1] 📁 จัดการ Profiles และสั่งรันบอท (Auto QA)
ใช้สำหรับสร้างและเลือก **Profile** (เพื่อให้จำค่าต่างๆ เช่น รันข้อไหนถึงข้อไหน, ใช้ Dataset โฟลเดอร์ไหน) โดยไม่ต้องแก้ `.env` ไปมา
- เมื่อเลือก Profile เสร็จแล้ว ระบบจะให้เลือกโหมดรัน:
  - **Run Browser (Only)**: ให้เปิดเบราว์เซอร์เทสต์อย่างเดียว เซฟ Checkpoint ไว้ แต่ยังไม่เขียนลง Sheets/Docs ทันที
  - **Run Browser + Write**: เทสต์เสร็จแล้วเขียนผลลง Sheets/Docs อัตโนมัติทันที
  - **Dry Run**: รันจำลอง ไม่เปิดเบราว์เซอร์จริง

### [2] 🖼️ อัปโหลดและแทรกรูปย้อนหลัง (Sync Images)
ใช้สำหรับนำรูป Screenshots ที่ระบบถ่ายเก็บไว้ในโฟลเดอร์ `screenshots/` นำไปอัปโหลดขึ้นคลาวด์และแปะลิงก์ลง Sheets/Docs
1. ระบบจะให้เลือก **Topic (เรื่อง/ชื่อชีต)** ที่มีภาพอยู่
2. เลือกช่องทางอัปโหลด: **Google Drive** หรือ **ImgBB**
3. ระบบจะจัดการอัปโหลดและอัปเดตตารางให้เอง

### [3] 🛠️ เครื่องมือจัดการข้อมูล (Validate / Write)
หมวดหมู่นี้รวมสคริปต์จัดการข้อมูลผลลัพธ์ เหมาะสำหรับใช้ **หลังจาก** ให้บอทรันเทสต์ (แบบ Browser Only) เสร็จแล้ว

#### ย่อย 1: 🔎 Validate Data (`node validate.js`)
- สแกนข้อมูลจาก 3 แหล่ง (ไฟล์ Checkpoint JSON ใน `logs/`, Google Sheets ต้นฉบับ, Google Docs) 
- สรุปว่าจำนวนข้อตรงกันไหม คำถามตรงกันกี่เปอร์เซ็นต์ แจ้งเตือนข้อผิดพลาดก่อนที่จะทำการรวมไฟล์

#### ย่อย 2: 📦 Consolidate Data (`node consolidate.js`)
- รวมผลลัพธ์จาก Checklist JSON, Sheets และ Docs เข้าด้วยกัน
- สร้างไฟล์ JSON สรุปผลลัพธ์ในโฟลเดอร์ `output/` (แยกเป็น `master_results.json`, `pass_results.json`, `fail_partial_results.json`)
- มีระบบ Interactive ถามว่าจะดึง Docs/Sheets ไหม หรือจะเปลี่ยน Prefix ชื่อไฟล์ไหม

#### ย่อย 3: 📊 Write to Sheets (`node write_to_sheets.js`)
- นำไฟล์ JSON จากโฟลเดอร์ `output/` มาเขียนลง Google Sheets ปลายทาง (`TARGET_GOOGLE_SPREADSHEET_ID`)
- **ฉลาด:** ถ้าชีตปลายทางว่างเปล่า มันจะสร้างตารางและดึงข้อมูลไปวางให้ใหม่ (Append) พร้อมระบายสีแถบ Status ให้อัตโนมัติ

#### ย่อย 4: 📄 Write to Docs (`node write_to_docs.js`)
- นำไฟล์ JSON ไปเขียนอัปเดตลง Google Docs 
- มีให้เลือกว่าจะอัปเดตตารางที่มีอยู่แล้ว หรือ รันโหมด `--fresh` เพื่อสร้างตารางสรุปใหม่ต่อท้ายเอกสารเลย

---

## 🔁 Workflow ที่แนะนำ (Best Practices)

1. **เตรียมการ:** ตั้งค่า `.env` ใส่ ID ของ Sheets ต้นฉบับและปลายทางให้เรียบร้อย
2. **รันเทสต์:** รัน `node run_config.js` ➔ เลือกเมนู `[1]` ➔ ตั้งค่า Profile ➔ เลือกรัน **โหมดที่ 1 (Browser Phase Only)**
3. **ตรวจสอบ:** เมื่อบอทรันเสร็จ กลับมาที่เมนู ➔ เลือก `[3]` ➔ เลือก `[1] Validate Data` เพื่อดูว่ามีข้อผิดพลาดอะไรไหม
4. **รวมไฟล์:** ถ้า Validate ผ่าน ให้รัน `[2] Consolidate Data` ต่อทันทีเพื่อสร้าง `master_results.json`
5. **อัปเดตปลายทาง:** รัน `[3] Write to Sheets` และ `[4] Write to Docs` เพื่อส่งข้อมูลผลลัพธ์ขึ้น Google
6. **อัปโหลดรูป:** (ทางเลือก) ถ้ารูปยังไม่ขึ้น ให้กลับไปเมนูหลักรัน `[2] Sync Images` 

---

## 📂 โครงสร้างโฟลเดอร์ Screenshots

ภาพหน้าจอจะถูกจัดเก็บและแบ่งหมวดหมู่โดยอัตโนมัติ เพื่อให้ง่ายต่อการตรวจสอบและอัปโหลด:
```text
screenshots/
├── fail/
│   └── Result_67/        ← แยกตาม TARGET_GOOGLE_SHEET_NAME
│       └── TC_001_2024...jpg
├── partial/
│   └── Result_67/
└── pass/
    └── Result_67/
```

---

## 🛠️ การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

- **มีปัญหาการเชื่อมต่อ / Bot ไม่เปิด:** ตรวจสอบว่าเสียบ VPN หรือยัง
- **ชีตพัง / โดนเขียนทับ:** แนะนำให้ใช้ตัวแปร `TARGET_GOOGLE_SPREADSHEET_ID` แยกไฟล์ต้นฉบับและผลลัพธ์เสมอ
- **พบปัญหาไม่เจอคอลัมน์:** เช็คชื่อคอลัมน์ใน `.env` เช่น `SHEET_COL_QUESTION=A`, `SHEET_COL_EXPECTED=B` ว่าตรงกับตารางของคุณหรือไม่
- **ค้างตอนดึง Checkpoint:** หากต้องการบังคับรันใหม่หมด ให้เข้าไปลบไฟล์ `progress_...json` ในโฟลเดอร์ `logs/` ทิ้ง
