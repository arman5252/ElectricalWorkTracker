# ElectricalWorkTracker

**Bergen Engines 11kV, 50Hz, 27 MW (03 OFF B35:40V20AG2 Power Plant) Electrical Cable Schedule & Work Tracker Dashboard**

An industrial, web-based electrical work tracking dashboard connecting directly to Excel and Google Sheets with two-way real-time read and write sync.

---

## ⚡ Features

- **Exact Workflow Status Tracking**:
  - **Cable Laying**: `Complete By VEL` (green), `Progress` (light green), `Pending` (dark red), plus direct remarks.
  - **Pre-Commissioning**: `Complete By Bargen` (dark green), `Progress` (light green), `Pending` (dark red), plus direct remarks.
  - **Commissioning**: `Complete By Bargen` (dark green), `Progress` (light green), `Pending` (dark red), plus direct remarks.
  - **3-Tier Approval Sign-Off**: 1-click interactive authorization by **Nayem Siddik (Sr. Engr)**, **Mossadek Hossain (Sr. Engr)**, and **Md Fahad (Manager PP)**.
- **Real-Time Two-Way Sync**:
  - **Local Excel (`.xlsx`) Auto-Save**: Automatically debounces and writes all inputs, statuses, and remarks into `Bergen_Engines_Cable_Schedule_Live.xlsx`.
  - **Google Sheets Two-Way Read/Write**: Integrates with Google Apps Script Web App for cloud syncing.
- **Visual Analytics & KPI Dashboard**:
  - 3-stage progress comparison chart.
  - Approval hierarchy tracking funnel.
  - Conductor size distribution and equipment panel breakdown.
- **Bill of Quantities (BOQ) & Specs**:
  - Aggregated runs by cable type & size.
  - Technical specs and Rev. 3 history.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 📁 Google Integration Setup

1. Open your Google Spreadsheet: [Google Sheet](https://docs.google.com/spreadsheets/d/1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk)
2. Go to **Extensions** → **Apps Script**.
3. Paste the contents of `google-apps-script/Code.gs`.
4. Deploy as **Web App** (Execute as: *Me*, Access: *Anyone*).
5. Paste the deployment URL into the dashboard's **Cloud Settings** dialog.

---

## 📄 License
Internal Project - Bergen Engines Electrical Cable Schedule
