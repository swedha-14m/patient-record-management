# Patient Record Management System (PRMS)
**College Web Technology Project**
A complete, functional, professional full-stack web application integrating **React**, **TypeScript**, **Node.js Express backend**, **Google Cloud Firestore**, **Firebase Authentication**, and **W3C XML / XSD / XSLT** technologies.

---

## 🏥 Architecture Overview
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite 8
- **Backend:** Node.js server runtime, Express 4, tsx
- **Database:** Google Cloud Firestore (real-time collections for patients, doctors, appointments, staff)
- **Security:** Firebase Authentication with Google Sign-in & Duty Staff access; Attribute-Based Access Control (ABAC) in `firestore.rules`
- **XML Interoperability:**
  - `public/patients.xml`: Schema-valid XML patient dataset
  - `public/patients.xsd`: Formal W3C XML Schema Definition with regex constraints, min/max restrictions, and enumerations
  - `public/patients.xsl`: XSLT 1.0 transformation stylesheet rendering styled HTML clinical reports

---

## 🚀 Running the Application
```bash
# 1. Install all dependencies
npm install

# 2. Start the full-stack server (runs Express + Vite middleware on port 3000)
npm run dev

# 3. Build production bundle
npm run build
```

---

## 📂 Core Modules
1. **Authentication & Session:** Hospital staff login, Google OAuth, and session persistence.
2. **Clinical Dashboard:** Key metrics, consultation queue, blood inventory roster, and quick-action triggers.
3. **Patient Registration:** Multi-field clinical admission form with real-time field validation, saving directly to Cloud Firestore.
4. **Patient Record Management:** Searchable and filterable data grid with full profile modal, edit capabilities, deletion guards, and single-record XML exports.
5. **Doctor Management:** Physician roster with specialties, qualifications, room numbers, and availability schedules.
6. **Appointment Scheduler:** Outpatient consultation booking, status tracking (Scheduled, In-Progress, Completed, Cancelled), and cancellation logging.
7. **XML / XSD / XSLT Lab:**
   - Real-time XML generation from live Firestore patients
   - Schema validation against `patients.xsd` with error breakdowns
   - Live transformation using `patients.xsl` via browser `XSLTProcessor` and server `/api/transform-xslt` fallback
8. **Cloud Database Guide:** Instructions for inspecting documents in Firebase Console, testing live connectivity, and seeding sample clinical records.

---

## 🔒 Security Configuration
The database uses `firestore.rules` deployed to the project:
- Default-deny catch-all rule `match /{document=**} { allow read, write: if false; }`
- Verified authentication requirement on all patient, doctor, and appointment operations
- Strict schema validation on incoming resource keys
