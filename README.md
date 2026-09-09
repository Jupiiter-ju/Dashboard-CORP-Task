# Corp Task Tracker

แดชบอร์ดติดตามงานทีม (Jinnie / Patty / Yok) ดึงข้อมูลสดจาก Google Sheet ผ่าน Google Apps Script backend และ host บน GitHub Pages

## สถาปัตยกรรม

```
Google Sheet ──▶ Code.gs (Apps Script Web App)
                   - อ่านชีตตรงผ่าน SpreadsheetApp
                   - cache ผลลัพธ์ไว้ใน PropertiesService
                   - time-driven trigger รีเฟรช cache ทุก 1 ชม.
                   - doGet() serve JSON จาก cache (ไม่ดึงชีตสดทุกครั้งที่มีคนเข้าเว็บ)
                        │
                        ▼
              index.html (GitHub Pages)
                   - fetch() ไปที่ Apps Script Web App URL
                   - รีเฟรชข้อมูลในหน้าเว็บอัตโนมัติทุก 1 ชม. + ปุ่มรีเฟรชมือ
```

## ขั้นตอน Deploy Apps Script (ทำครั้งเดียว)

1. เปิด Google Sheet → เมนู **Extensions > Apps Script** (หรือสร้างโปรเจกต์ใหม่ที่ script.google.com แล้วเชื่อมกับสเปรดชีต)
2. ลบโค้ด default ทั้งหมด แล้ววางเนื้อหาจากไฟล์ [`Code.gs`](Code.gs) ในโปรเจกต์นี้ลงไปแทน
3. ตรวจสอบว่า `SHEET_ID` ใน `Code.gs` ตรงกับสเปรดชีตของคุณ (ค่า default คือ `1RB_CLpnvJeJXaS9LU3lKwEV-srS4Ha9MdiSBrOLTyr0`)
4. ที่แถบเครื่องมือด้านบน เลือกฟังก์ชัน `setupTrigger` แล้วกด **▶ Run**
   - Google จะขอสิทธิ์ (authorize) — กด **Allow/อนุญาต** ด้วยบัญชีของคุณเอง (ขั้นตอนนี้ต้องทำเองเท่านั้น)
   - ฟังก์ชันนี้จะติดตั้ง time-driven trigger ให้รีเฟรช cache ทุก 1 ชั่วโมง และดึงข้อมูลครั้งแรกทันที
5. กด **Deploy > New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด **Deploy** แล้วอนุญาตสิทธิ์เพิ่มเติมถ้ามีการขอ
6. คัดลอก URL ที่ได้ (ลงท้ายด้วย `/exec`)
7. เปิดไฟล์ [`index.html`](index.html) หาบรรทัด:
   ```js
   var APPS_SCRIPT_URL = "https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec";
   ```
   แล้ววาง URL ที่ได้จากขั้นตอนที่ 6 แทนที่ `REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec`
8. Commit + push การเปลี่ยนแปลงไฟล์ `index.html`

> ถ้าในอนาคตแก้โค้ด `Code.gs` ใหม่ ต้องกด **Deploy > Manage deployments > แก้ไข (ไอคอนดินสอ) > New version > Deploy** อีกครั้ง เพื่อให้ URL เดิมใช้โค้ดล่าสุด

## Host บน GitHub Pages

Repo: https://github.com/Jupiiter-ju/Dashboard-CORP-Task

ไปที่ **Settings > Pages** ของ repo แล้วตั้งค่า Source เป็น branch `main` / โฟลเดอร์ `/ (root)` — GitHub จะ build เว็บไซต์ให้อัตโนมัติที่ `https://jupiiter-ju.github.io/Dashboard-CORP-Task/`

## สิทธิ์การเข้าถึง

ปัจจุบัน Google Sheet ตั้งเป็น "Anyone with the link" (ดูได้) ซึ่งใช้ได้กับสถาปัตยกรรมนี้อยู่แล้ว เพราะ Apps Script อ่านชีตด้วยสิทธิ์ของเจ้าของสคริปต์ (ไม่ใช่สิทธิ์ของผู้เข้าเว็บ) — ต่อให้ภายหลังเปลี่ยนชีตให้ "จำกัดเฉพาะคนในทีม" ตัวแดชบอร์ดก็จะยังทำงานได้ปกติ ไม่ต้องแก้โค้ด
