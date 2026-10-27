# ACADEMIC PROJECT REPORT
## PATIENT RECORD MANAGEMENT SYSTEM (PRMS)
**Course:** Web Technology Laboratory & Theory
**Department:** Computer Science & Engineering / Information Technology
**Academic Year:** 2026

---

### 1. ABSTRACT
The **Patient Record Management System (PRMS)** is a comprehensive, full-stack hospital clinical administration platform engineered to streamline electronic health record (EHR) custody, clinical staff rosters, and patient outpatient appointment workflows. Built using modern Web Technology standards—React, TypeScript, Node.js server runtime, and Google Cloud Firestore—the application features a dedicated W3C-compliant XML data interchange layer incorporating XML Schema Definition (XSD) and Extensible Stylesheet Language Transformations (XSLT). PRMS eliminates paper-based delays, guarantees data integrity, and produces verifiable clinical summary documents on demand.

---

### 2. OBJECTIVES
- Digitize patient admission, personal demographics, emergency contacts, and sensitive allergy records.
- Provide secure Attribute-Based Access Control (ABAC) using Firebase Authentication and hardened Firestore Security Rules.
- Enable bidirectional medical consultant scheduling with outpatient queue status tracking.
- Demonstrate core Web Technology curricula: dynamic XML export, schema constraints (patterns, enumerations, boundaries) via XSD, and automated presentation transformation via XSLT 1.0.
- Deliver a modern responsive clinical dashboard adhering to enterprise human-interface guidelines.

---

### 3. EXISTING SYSTEM & LIMITATIONS
- **Paper Registers:** Susceptible to physical loss, misplacement, illegible physician handwriting, physical degradation, and unauthorized physical tampering.
- **Fragmented Spreadsheets:** Lack atomic multi-user concurrency controls, resulting in dirty reads, data loss, and conflicting appointment bookings.
- **Proprietary Silos:** Closed database formats that fail to provide standardized XML/XSD interoperability for cross-hospital referral exchange.

---

### 4. PROPOSED SYSTEM
PRMS provides a unified, reactive web architecture:
- Real-time cloud persistence using Cloud Firestore enterprise collections.
- Strict input validation on client and server to prevent injection attacks and dirty state.
- Dynamic XML engine that serializes real Firestore documents into namespace-qualified XML documents (`http://hospital.example.org/patients`).
- Formal XSD validation enforcing strict regex patterns (`PAT-YYYY-NNN`), integer age boundaries (0-130), and enumerations for blood groups and genders.
- XSLT transformation pipeline rendering publication-ready HTML clinical manifests directly in the client and backend.

---

### 5. SYSTEM MODULES
1. **Authentication & Session:** Secure hospital staff login, Google OAuth, and anonymous duty credentials with session persistence.
2. **Dashboard Overview & Demographic Analytics:** Metric counters, patient demographics visualization via Recharts (pediatric to geriatric age group distribution bar charts and gender stratification donut charts), real-time consultation queue, blood group distribution chart, and quick-action hub.
3. **Patient Registration:** Multi-step admission capturing Patient ID, name, age, gender, contact, residential address, clinical history, and allergies.
4. **Patient Directory:** Searchable and filterable data grid with full profile modal, edit capabilities, deletion guards, single-record XML exports, and one-click printable PDF clinical summaries via browser print service.
5. **Doctor Management:** Specialty consultant registry with qualification, availability schedule, room allocations, and roster status.
6. **Appointment Scheduler:** Patient-to-doctor booking engine with time slots, priority tiers, completion workflows, and cancellation logging.
7. **XML/XSD/XSLT Laboratory:** Full interactive tech center showcasing Patient and Appointment Schedule XML generation, dual XSD validation checks (patients.xsd and appointments.xsd), and XSLT HTML report transformation.
8. **Cloud Database Guide:** Direct Firebase Console links, sample clinic data seeder, and ABAC security rules verification.

---

### 6. SYSTEM ARCHITECTURE & WORKFLOW
```
┌────────────────────────────────────────────────────────┐
│      Browser Client: React 19 + TypeScript + Tailwind   │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Google Cloud Firestore │  │   Node.js Express Server │
│ - /patients collection   │  │ - /api/validate-xml      │
│ - /activityLogs subcoll. │  │ - /api/transform-xslt    │
│ - /doctors collection    │  │ - /api/schema & /api/xsl │
│ - /appointments col.     │  │ - Static Asset Server    │
│ - Security Rules (ABAC)  │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

---

### 7. TECHNOLOGIES EMPLOYED
- **Frontend:** React 19, TypeScript, Tailwind CSS, Recharts Data Visualization, Lucide Icons, Vite 8
- **Backend:** Node.js, Express, tsx
- **Database:** Google Cloud Firestore (Multi-tenant, real-time listeners)
- **Security:** Firebase Authentication, Firestore Security Rules (`rules_version = '2'`)
- **Data Interchange:** W3C XML 1.0, W3C XML Schema Definition (XSD), W3C XSLT 1.0

---

### 8. ADVANTAGES
- Instant search across thousands of patient and doctor records.
- Real-time updates without page reloading.
- Standardized data portability via W3C XML and XSD compliance.
- Zero local database installation required (cloud serverless).

---

### 9. LIMITATIONS & FUTURE ENHANCEMENTS
- **Limitations:** Dependent on internet connectivity for cloud database writes; specialized imaging (DICOM) files are outside current text scope.
- **Future Scope:** Integration with HL7/FHIR healthcare standards, automated SMS appointment reminders, and biometric fingerprint check-in.

---

### 10. REFERENCES
1. W3C XML 1.0 Recommendation, World Wide Web Consortium.
2. W3C XML Schema Definition Language (XSD) 1.1 Part 2: Datatypes.
3. Google Cloud Firestore Documentation, Google Cloud Platform (2026).
4. React Documentation, Meta Open Source.
