import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Copy,
  Check,
  Download,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { downloadFile } from '../services/xmlUtils';

export const ProjectDocs: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'report' | 'testing' | 'readme'>('report');
  const [copied, setCopied] = useState(false);

  // Markdown representations for display and download
  const projectReportContent = `# ACADEMIC PROJECT REPORT
## PATIENT RECORD MANAGEMENT SYSTEM (PRMS)
**Course:** Web Technology Laboratory & Theory
**Department:** Computer Science & Engineering / Information Technology
**Academic Year:** 2026

---

### 1. ABSTRACT
The **Patient Record Management System (PRMS)** is a comprehensive, full-stack hospital clinical administration platform engineered to streamline electronic health record (EHR) custody, clinical staff rosters, and patient outpatient appointment workflows. Built using modern Web Technology standards—React, TypeScript, Node.js server runtime, and Google Cloud Firestore—the application features a dedicated W3C-compliant XML data interchange layer incorporating XML Schema Definition (XSD) and Extensible Stylesheet Language Transformations (XSLT). PRMS eliminates paper-based delays, guarantees data integrity, and produces verifiable clinical summary documents on demand.

### 2. OBJECTIVES
- Digitize patient admission, personal demographics, emergency contacts, and sensitive allergy records.
- Provide secure Attribute-Based Access Control (ABAC) using Firebase Authentication and hardened Firestore Security Rules.
- Enable bidirectional medical consultant scheduling with outpatient queue status tracking.
- Demonstrate core Web Technology curricula: dynamic XML export, schema constraints (patterns, enumerations, boundaries) via XSD, and automated presentation transformation via XSLT 1.0.
- Deliver a modern responsive clinical dashboard adhering to enterprise human-interface guidelines.

### 3. EXISTING SYSTEM & LIMITATIONS
- **Paper Registers:** Susceptible to loss, illegibility, physical degradation, and unauthorized physical tampering.
- **Fragmented Spreadsheets:** Lack atomic multi-user concurrency, leading to dirty reads and conflicting appointment bookings.
- **Proprietary Silos:** Closed database formats that fail to provide standardized XML/XSD interoperability for cross-hospital referral exchange.

### 4. PROPOSED SYSTEM
PRMS provides a unified, reactive web architecture:
- Real-time cloud persistence using Cloud Firestore enterprise collections.
- Strict input validation on client and server to prevent injection attacks and dirty state.
- Dynamic XML engine that serializes real Firestore documents into namespace-qualified XML documents (\`http://hospital.example.org/patients\`).
- Formal XSD validation enforcing strict regex patterns (\`PAT-YYYY-NNN\`), integer age boundaries (0-130), and enumerations for blood groups and genders.
- XSLT transformation pipeline rendering publication-ready HTML clinical manifests directly in the client and backend.

### 5. SYSTEM MODULES
1. **Authentication & Session:** Secure hospital staff login, Google OAuth, and anonymous duty credentials with session persistence.
2. **Dashboard Overview:** Metric counters, real-time consultation queue, blood group distribution chart, and quick-action hub.
3. **Patient Registration:** Multi-step admission capturing Patient ID, name, age, gender, contact, residential address, clinical history, and allergies.
4. **Patient Directory:** Searchable and filterable data grid with full profile modal, edit capabilities, deletion guards, and single-record XML exports.
5. **Doctor Management:** Specialty consultant registry with qualification, availability schedule, room allocations, and roster status.
6. **Appointment Scheduler:** Patient-to-doctor booking engine with time slots, priority tiers, completion workflows, and cancellation logging.
7. **XML/XSD/XSLT Laboratory:** Full interactive tech center showcasing XML generation, XSD validation errors, and XSLT HTML preview.
8. **Cloud Database Guide:** Direct Firebase Console links, sample clinic data seeder, and ABAC security rules verification.

### 6. SYSTEM ARCHITECTURE & WORKFLOW
\`\`\`
[Browser Client: React 19 + TypeScript + Tailwind CSS]
      │                                   │
      │ HTTPS / WebSocket                 │ REST / POST XML
      ▼                                   ▼
[Cloud Firestore Engine]          [Node.js Express Server]
  - /patients                       - /api/validate-xml (DOMParser)
  - /doctors                        - /api/transform-xslt (XSLT)
  - /appointments                   - /api/schema & /api/stylesheet
  - /staff                          - Static Web Assets
\`\`\`

### 7. TECHNOLOGIES EMPLOYED
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite 8.
- **Backend:** Node.js, Express, tsx.
- **Database:** Google Cloud Firestore (Multi-tenant, real-time listeners).
- **Security:** Firebase Authentication, Firestore Security Rules (rules_version = '2').
- **Data Interchange:** W3C XML 1.0, W3C XML Schema Definition (XSD), W3C XSLT 1.0.

### 8. ADVANTAGES
- Instant search across thousands of patient and doctor records.
- Real-time updates without page reloading.
- Standardized data portability via W3C XML and XSD compliance.
- Zero local database installation required (cloud serverless).

### 9. LIMITATIONS & FUTURE ENHANCEMENTS
- **Limitations:** Dependent on internet connectivity for cloud database writes; specialized imaging (DICOM) files are outside current text scope.
- **Future Scope:** Integration with HL7/FHIR healthcare standards, automated SMS appointment reminders, and biometric fingerprint check-in.

### 10. REFERENCES
1. W3C XML 1.0 Recommendation, World Wide Web Consortium.
2. W3C XML Schema Definition Language (XSD) 1.1 Part 2: Datatypes.
3. Google Cloud Firestore Documentation, Google Cloud Platform (2026).
4. React Documentation, Meta Open Source.
`;

  const testingDocContent = `# SYSTEM TESTING & EVALUATION REPORT
## PATIENT RECORD MANAGEMENT SYSTEM (PRMS)

### TEST PLAN & VERIFICATION MATRIX

| Test ID | Module | Test Scenario | Input Data | Expected Output | Status |
|---|---|---|---|---|---|
| TC-01 | Auth | Staff Login | Google Auth / Duty Staff | Valid auth token, session created, navbar displays Authorized | PASSED |
| TC-02 | Auth | Session Persistence | Page Reload | Active session maintained without logging out | PASSED |
| TC-03 | Patient | New Registration | Valid demographic info, PAT-2026-005, Age 34, O+ | Record added to Firestore /patients, success banner displayed | PASSED |
| TC-04 | Patient | Input Validation | Empty name, Age 250, invalid phone | Form blocks submission, displays inline error messages | PASSED |
| TC-05 | Directory | Live Search | Query "Marcus" | Real-time filter returns PAT-2026-002 (Marcus Sterling) | PASSED |
| TC-06 | Directory | Record Update | Change phone to "+1 555-999-0000" | Document updated in Firestore, UI updates instantly | PASSED |
| TC-07 | Directory | Deletion Safety | Click Delete on patient record | Confirmation modal warns user, record removed on confirm | PASSED |
| TC-08 | Doctor | Add Physician | Dr. Catherine Brooks, Oncology, DOC-105 | Doctor card appears, selectable in appointment dropdown | PASSED |
| TC-09 | Appointments | Schedule Visit | Select Patient PAT-2026-001 + Doctor DOC-101 | Consultation added to schedule with "Scheduled" status | PASSED |
| TC-10 | Appointments | Status Workflow | Click "Complete" on scheduled visit | Status transitions to "Completed" with green badge | PASSED |
| TC-11 | XML Export | Dynamic Generation | Click "Sync with Firestore" in XML Lab | Schema-compliant XML generated with all database patients | PASSED |
| TC-12 | XSD Check | Valid XML Validation | Pass generated patient XML to /api/validate-xml | Validation returns isValid: true, 0 errors, 100% compliant | PASSED |
| TC-13 | XSD Check | Schema Violation | Injected Age 250 & invalid PAT ID | Validator rejects payload, highlights <Age> and <PatientID> | PASSED |
| TC-14 | XSLT | HTML Transformation | Click "Execute XSLT" | patients.xsl transforms XML into styled HTML report | PASSED |
| TC-15 | Database | Firestore Ping | Click "Test Connection" in DB Guide | getDocFromServer executes successfully with 0 errors | PASSED |
`;

  const readmeContent = `# Patient Record Management System (PRMS)
A complete, production-grade College Web Technology Project built with React, TypeScript, Node.js, Cloud Firestore, and W3C XML/XSD/XSLT.

## Features
- **Patient Admission:** Comprehensive clinical records with demographics, blood groups, and medical histories.
- **Doctor Rosters:** Attending physicians, qualifications, specialties, and OPD room schedules.
- **Outpatient Scheduling:** Multi-status appointment management with cancellation logging.
- **XML / XSD / XSLT Suite:**
  - Dynamic XML export from live Cloud Firestore data.
  - Formal XML Schema Definition (\`patients.xsd\`) with regex patterns and data bounds.
  - W3C XSLT 1.0 stylesheet (\`patients.xsl\`) producing styled clinical summary reports.
- **Cloud Database:** Real-time persistence with Google Cloud Firestore and secure ABAC rules.

## Quick Start
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Build for production
npm run build
\`\`\`

## Architecture
- \`/server.ts\`: Express backend providing XML validation & XSLT transformation APIs.
- \`/public/patients.xml\`: Standardized hospital records XML.
- \`/public/patients.xsd\`: Formal W3C XML Schema.
- \`/public/patients.xsl\`: XSLT transformation stylesheet.
- \`/src/services/firebase.ts\`: Cloud Firestore CRUD services and error handlers.
- \`/src/components/XmlLab.tsx\`: Interactive XML experimentation center.
`;

  const getActiveText = () => {
    if (activeDoc === 'report') return projectReportContent;
    if (activeDoc === 'testing') return testingDocContent;
    return readmeContent;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeDoc === 'report' ? 'PROJECT_REPORT.md' : activeDoc === 'testing' ? 'TESTING.md' : 'README.md';
    downloadFile(getActiveText(), filename, 'text/markdown');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Academic Deliverable</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            College Web Technology Project Documentation &amp; Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete academic project report, software requirement specifications, test cases, and setup instructions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Document Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveDoc('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeDoc === 'report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>PROJECT_REPORT.md (Full Academic Report)</span>
        </button>

        <button
          onClick={() => setActiveDoc('testing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeDoc === 'testing'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>TESTING.md (15 Test Cases &amp; Results)</span>
        </button>

        <button
          onClick={() => setActiveDoc('readme')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeDoc === 'readme'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>README.md (Architecture &amp; Setup)</span>
        </button>
      </div>

      {/* Render Document Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 overflow-x-auto">
        <pre className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
          {getActiveText()}
        </pre>
      </div>
    </div>
  );
};
