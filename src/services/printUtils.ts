import { Patient } from '../types';

/**
 * Generates an official, printer-friendly HTML document for a patient clinical summary
 */
export function generatePatientPrintHtml(patient: Patient): string {
  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Patient Summary - ${patient.patientId} - ${patient.fullName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .print-header {
      border-bottom: 3px double #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .hospital-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .hospital-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .report-badge {
      text-align: right;
    }
    .doc-type {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .print-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }
    .patient-hero {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 16px;
    }
    .hero-field-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .hero-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .hero-id {
      font-family: monospace;
      font-weight: 700;
      color: #2563eb;
      font-size: 13px;
    }
    .blood-badge {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      font-size: 13px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 6px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .data-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .data-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .data-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .allergy-alert {
      background: #fff1f2;
      border: 1.5px solid #fda4af;
      border-radius: 6px;
      padding: 12px 16px;
      color: #881337;
      margin-bottom: 16px;
    }
    .allergy-title {
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      color: #be123c;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .clinical-history-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
    }
    .signoff-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-line {
      border-bottom: 1px solid #0f172a;
      height: 40px;
      margin-bottom: 6px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1 class="hospital-title">Apex General Hospital &amp; Medical Institute</h1>
      <p class="hospital-subtitle">Department of Clinical Records &bull; Electronic Health Record Custody</p>
    </div>
    <div class="report-badge">
      <span class="doc-type">Official Clinical Summary</span>
      <div class="print-meta">Generated: ${printDate}</div>
    </div>
  </div>

  <div class="patient-hero">
    <div>
      <div class="hero-field-label">Patient Legal Full Name</div>
      <div class="hero-name">${patient.fullName}</div>
      <div class="hero-id">ID: ${patient.patientId}</div>
    </div>
    <div>
      <div class="hero-field-label">Age &amp; Gender</div>
      <div class="data-value">${patient.age} Years &bull; ${patient.gender}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Admitted: ${patient.registrationDate}</div>
    </div>
    <div>
      <div class="hero-field-label">Blood Group</div>
      <div><span class="blood-badge">${patient.bloodGroup}</span></div>
    </div>
  </div>

  <div class="section-title">Patient Contact &amp; Residential Information</div>
  <div class="grid-2">
    <div class="data-box">
      <div class="data-label">Telephone / Mobile Number</div>
      <div class="data-value">${patient.phone}</div>
    </div>
    <div class="data-box">
      <div class="data-label">Email Address</div>
      <div class="data-value">${patient.email || 'None on record'}</div>
    </div>
    <div class="data-box" style="grid-column: span 2;">
      <div class="data-label">Residential Address</div>
      <div class="data-value">${patient.address}</div>
    </div>
    <div class="data-box" style="grid-column: span 2; background: #fdf4ff; border-color: #f0abfc;">
      <div class="data-label" style="color: #86198f;">Designated Emergency Contact</div>
      <div class="data-value" style="color: #701a75;">${patient.emergencyContact || 'No emergency contact provided'}</div>
    </div>
  </div>

  <div class="section-title">Clinical Profile &amp; Hypersensitivity Alerts</div>
  
  <div class="allergy-alert">
    <div class="allergy-title">&#9888; Documented Drug &amp; Environmental Allergies</div>
    <div><strong>${patient.allergies || 'No known drug allergies reported (NKDA).'}</strong></div>
  </div>

  <div class="clinical-history-box">
    <div class="data-label">Past Medical History &amp; Chronic Conditions</div>
    <div style="font-size: 13px; color: #1e293b; margin-top: 4px; line-height: 1.6;">
      ${patient.medicalHistory || 'No prior medical conditions documented.'}
    </div>
  </div>

  <div class="signoff-section">
    <div>
      <div class="signature-line"></div>
      <div style="font-size: 11px; font-weight: 700;">Attending Medical Officer Signature</div>
      <div style="font-size: 10px; color: #64748b;">MD / Registrar on Duty</div>
    </div>
    <div>
      <div class="signature-line"></div>
      <div style="font-size: 11px; font-weight: 700;">Hospital Clinical Registrar Stamp / Date</div>
      <div style="font-size: 10px; color: #64748b;">Apex General Hospital Records Bureau</div>
    </div>
  </div>

  <div class="footer-note">
    CONFIDENTIAL HEALTH RECORD &bull; Authorized under Apex Health Hospital Records Act &bull; Generated from Cloud Firestore EHR
  </div>
</body>
</html>
`;
}

/**
 * Triggers clean, printer-friendly PDF printing using an isolated hidden iframe
 * and window.print(), avoiding window.open and popup blockers.
 */
export function printPatientSummary(patient: Patient): void {
  const htmlContent = generatePatientPrintHtml(patient);

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = 'none';
  iframe.setAttribute('title', 'Patient Print Frame');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for resources to load, then invoke print
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print on iframe:', err);
    } finally {
      // Remove after printing dialogue opens
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  };

  // Fallback trigger if onload already fired
  setTimeout(() => {
    try {
      if (document.body.contains(iframe)) {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }
    } catch (err) {
      console.warn('Fallback print trigger error:', err);
    }
  }, 250);
}
