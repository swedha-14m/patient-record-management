import { Patient, Appointment, XMLValidationResult } from '../types';

/**
 * Escapes characters for XML safe serialization
 */
export function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates official schema-compliant XML document string from patient records
 */
export function generatePatientsXML(
  patients: Patient[],
  hospitalName: string = 'Apex General Hospital & Medical Research Institute'
): string {
  const exportDate = new Date().toISOString().split('T')[0];

  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<HospitalRecords xmlns="http://hospital.example.org/patients"',
    '                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '                 xsi:schemaLocation="http://hospital.example.org/patients patients.xsd">',
    '  <HospitalMetadata>',
    `    <HospitalName>${escapeXml(hospitalName)}</HospitalName>`,
    `    <ExportDate>${exportDate}</ExportDate>`,
    `    <TotalPatients>${patients.length}</TotalPatients>`,
    '    <SystemVersion>PRMS v2.4 (College Web Tech Edition)</SystemVersion>',
    '  </HospitalMetadata>',
    '  <Patients>'
  ];

  for (const p of patients) {
    xmlLines.push('    <Patient status="Active">');
    xmlLines.push(`      <PatientID>${escapeXml(p.patientId)}</PatientID>`);
    xmlLines.push(`      <FullName>${escapeXml(p.fullName)}</FullName>`);
    xmlLines.push(`      <Age>${p.age}</Age>`);
    xmlLines.push(`      <Gender>${escapeXml(p.gender)}</Gender>`);
    xmlLines.push(`      <BloodGroup>${escapeXml(p.bloodGroup)}</BloodGroup>`);
    xmlLines.push('      <Contact>');
    xmlLines.push(`        <Phone>${escapeXml(p.phone)}</Phone>`);
    xmlLines.push(`        <Email>${escapeXml(p.email)}</Email>`);
    xmlLines.push(`        <Address>${escapeXml(p.address)}</Address>`);
    if (p.emergencyContact) {
      xmlLines.push(`        <EmergencyContact>${escapeXml(p.emergencyContact)}</EmergencyContact>`);
    }
    xmlLines.push('      </Contact>');
    xmlLines.push('      <ClinicalDetails>');
    xmlLines.push(`        <MedicalHistory>${escapeXml(p.medicalHistory || 'None recorded')}</MedicalHistory>`);
    if (p.allergies) {
      xmlLines.push(`        <Allergies>${escapeXml(p.allergies)}</Allergies>`);
    }
    xmlLines.push(`        <RegistrationDate>${escapeXml(p.registrationDate || exportDate)}</RegistrationDate>`);
    xmlLines.push('      </ClinicalDetails>');
    xmlLines.push('    </Patient>');
  }

  xmlLines.push('  </Patients>');
  xmlLines.push('</HospitalRecords>');

  return xmlLines.join('\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/xml') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate XML via server API with client-side fallback
 */
export async function validateXMLWithServer(xmlContent: string): Promise<XMLValidationResult> {
  try {
    const response = await fetch('/api/validate-xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xml: xmlContent })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Server XML validation unreachable, using client DOMParser fallback:', e);
  }

  return clientValidateXML(xmlContent);
}

/**
 * Client-side DOMParser & Schema check for patient XML
 */
export function clientValidateXML(xmlString: string): XMLValidationResult {
  const errors: { element?: string; message: string; severity: 'error' | 'warning' }[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    return {
      isValid: false,
      patientCount: 0,
      errors: [{
        element: 'XML Syntax',
        message: parseError[0].textContent || 'Malformed XML syntax',
        severity: 'error'
      }],
      summary: 'XML is malformed and could not be parsed by XML DOMParser.'
    };
  }

  const root = xmlDoc.documentElement;
  if (!root || (root.localName !== 'HospitalRecords' && root.tagName !== 'HospitalRecords')) {
    errors.push({
      element: 'Root',
      message: 'Root element must be <HospitalRecords>',
      severity: 'error'
    });
  }

  const patientNodes = xmlDoc.getElementsByTagName('Patient');
  const count = patientNodes.length;

  for (let i = 0; i < patientNodes.length; i++) {
    const node = patientNodes[i];
    const pid = node.getElementsByTagName('PatientID')[0]?.textContent?.trim();
    const name = node.getElementsByTagName('FullName')[0]?.textContent?.trim();
    const age = node.getElementsByTagName('Age')[0]?.textContent?.trim();
    const gender = node.getElementsByTagName('Gender')[0]?.textContent?.trim();
    const blood = node.getElementsByTagName('BloodGroup')[0]?.textContent?.trim();
    const phone = node.getElementsByTagName('Phone')[0]?.textContent?.trim();

    if (!pid) {
      errors.push({ element: `Patient[${i + 1}]`, message: 'Missing <PatientID>', severity: 'error' });
    } else if (!/^PAT-\d{4}-\d{3,4}$/.test(pid)) {
      errors.push({
        element: `Patient[${pid}]`,
        message: `Patient ID '${pid}' does not match pattern PAT-YYYY-NNN`,
        severity: 'error'
      });
    }

    if (!name || name.length < 2) {
      errors.push({ element: `Patient[${pid || i}]`, message: 'Full name missing or < 2 characters', severity: 'error' });
    }

    if (age !== undefined) {
      const num = parseInt(age, 10);
      if (isNaN(num) || num < 0 || num > 130) {
        errors.push({ element: `Patient[${pid || i}]`, message: `Age '${age}' invalid (must be 0-130)`, severity: 'error' });
      }
    }

    const validGenders = ['Male', 'Female', 'Other'];
    if (gender && !validGenders.includes(gender)) {
      errors.push({ element: `Patient[${pid || i}]`, message: `Gender '${gender}' invalid`, severity: 'error' });
    }

    const validBlood = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
    if (blood && !validBlood.includes(blood)) {
      errors.push({ element: `Patient[${pid || i}]`, message: `Blood group '${blood}' invalid`, severity: 'error' });
    }

    if (!phone) {
      errors.push({ element: `Patient[${pid || i}]`, message: 'Missing contact phone', severity: 'error' });
    }
  }

  const hasErrors = errors.some(e => e.severity === 'error');
  return {
    isValid: !hasErrors,
    patientCount: count,
    errors,
    summary: !hasErrors
      ? `XML structure matches patients.xsd schema. ${count} patient records verified.`
      : `Schema check found ${errors.filter(e => e.severity === 'error').length} error(s).`
  };
}

/**
 * Transform XML using XSLT stylesheet via Browser native XSLTProcessor with fallback to server
 */
export async function transformXMLWithXSLT(xmlString: string, xslString: string): Promise<string> {
  if (typeof window !== 'undefined' && 'XSLTProcessor' in window) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      const xslDoc = parser.parseFromString(xslString, 'application/xml');

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('XML parsing error in input document');
      }
      if (xslDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('XSLT parsing error in stylesheet document');
      }

      const xsltProcessor = new window.XSLTProcessor();
      xsltProcessor.importStylesheet(xslDoc);

      const resultDocument = xsltProcessor.transformToDocument(xmlDoc);
      const serializer = new XMLSerializer();
      const transformedHtml = serializer.serializeToString(resultDocument);

      if (transformedHtml && transformedHtml.length > 50) {
        return transformedHtml;
      }
    } catch (browserError) {
      console.warn('Browser XSLTProcessor error, attempting server fallback:', browserError);
    }
  }

  try {
    const res = await fetch('/api/transform-xslt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xml: xmlString })
    });

    if (res.ok) {
      return await res.text();
    }
  } catch (serverErr) {
    console.error('Server XSLT transform failed:', serverErr);
  }

  throw new Error('Both browser and server XSLT transformation engines were unable to process document.');
}

/**
 * Generates official schema-compliant XML document string from appointment records
 */
export function generateAppointmentsXML(
  appointments: Appointment[],
  hospitalName: string = 'Apex General Hospital & Medical Research Institute'
): string {
  const exportDate = new Date().toISOString().split('T')[0];

  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<AppointmentSchedule xmlns="http://hospital.example.org/appointments"',
    '                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '                     xsi:schemaLocation="http://hospital.example.org/appointments appointments.xsd">',
    '  <ScheduleMetadata>',
    `    <HospitalName>${escapeXml(hospitalName)}</HospitalName>`,
    `    <ExportDate>${exportDate}</ExportDate>`,
    `    <TotalAppointments>${appointments.length}</TotalAppointments>`,
    '    <SystemVersion>PRMS v2.4 (College Web Tech Edition)</SystemVersion>',
    '  </ScheduleMetadata>',
    '  <Appointments>'
  ];

  for (const a of appointments) {
    xmlLines.push('    <Appointment>');
    xmlLines.push(`      <AppointmentID>${escapeXml(a.appointmentId)}</AppointmentID>`);
    xmlLines.push(`      <PatientID>${escapeXml(a.patientId)}</PatientID>`);
    xmlLines.push(`      <PatientName>${escapeXml(a.patientName)}</PatientName>`);
    xmlLines.push(`      <DoctorID>${escapeXml(a.doctorId)}</DoctorID>`);
    xmlLines.push(`      <DoctorName>${escapeXml(a.doctorName)}</DoctorName>`);
    xmlLines.push(`      <Department>${escapeXml(a.department)}</Department>`);
    xmlLines.push(`      <AppointmentDate>${escapeXml(a.appointmentDate)}</AppointmentDate>`);
    xmlLines.push(`      <TimeSlot>${escapeXml(a.timeSlot)}</TimeSlot>`);
    xmlLines.push(`      <Priority>${escapeXml(a.priority)}</Priority>`);
    xmlLines.push(`      <Status>${escapeXml(a.status)}</Status>`);
    xmlLines.push(`      <Reason>${escapeXml(a.reason)}</Reason>`);
    if (a.notes) {
      xmlLines.push(`      <Notes>${escapeXml(a.notes)}</Notes>`);
    }
    if (a.cancellationReason) {
      xmlLines.push(`      <CancellationReason>${escapeXml(a.cancellationReason)}</CancellationReason>`);
    }
    xmlLines.push(`      <CreatedAt>${escapeXml(a.createdAt || exportDate)}</CreatedAt>`);
    xmlLines.push('    </Appointment>');
  }

  xmlLines.push('  </Appointments>');
  xmlLines.push('</AppointmentSchedule>');

  return xmlLines.join('\n');
}

/**
 * Validate Appointments XML via server API with client-side fallback
 */
export async function validateAppointmentsXMLWithServer(xmlContent: string): Promise<XMLValidationResult> {
  try {
    const response = await fetch('/api/validate-appointments-xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xml: xmlContent })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Server appointments XML validation unreachable, using client DOMParser fallback:', e);
  }

  return clientValidateAppointmentsXML(xmlContent);
}

/**
 * Client-side DOMParser & Schema check for appointments
 */
export function clientValidateAppointmentsXML(xmlString: string): XMLValidationResult {
  const errors: { element?: string; message: string; severity: 'error' | 'warning' }[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    return {
      isValid: false,
      patientCount: 0,
      errors: [{
        element: 'XML Syntax',
        message: parseError[0].textContent || 'Malformed XML syntax',
        severity: 'error'
      }],
      summary: 'Appointment XML is malformed and could not be parsed by XML DOMParser.'
    };
  }

  const root = xmlDoc.documentElement;
  if (!root || (root.localName !== 'AppointmentSchedule' && root.tagName !== 'AppointmentSchedule')) {
    errors.push({
      element: 'Root',
      message: 'Root element must be <AppointmentSchedule>',
      severity: 'error'
    });
  }

  const appointmentNodes = xmlDoc.getElementsByTagName('Appointment');
  const count = appointmentNodes.length;

  for (let i = 0; i < appointmentNodes.length; i++) {
    const node = appointmentNodes[i];
    const aid = node.getElementsByTagName('AppointmentID')[0]?.textContent?.trim();
    const pName = node.getElementsByTagName('PatientName')[0]?.textContent?.trim();
    const dName = node.getElementsByTagName('DoctorName')[0]?.textContent?.trim();
    const date = node.getElementsByTagName('AppointmentDate')[0]?.textContent?.trim();
    const priority = node.getElementsByTagName('Priority')[0]?.textContent?.trim();
    const status = node.getElementsByTagName('Status')[0]?.textContent?.trim();
    const reason = node.getElementsByTagName('Reason')[0]?.textContent?.trim();

    if (!aid) {
      errors.push({ element: `Appointment[${i + 1}]`, message: 'Missing <AppointmentID>', severity: 'error' });
    } else if (!/^APT-\d{4}-\d{3,4}$/.test(aid)) {
      errors.push({
        element: `Appointment[${aid}]`,
        message: `Appointment ID '${aid}' violates XSD regex pattern APT-YYYY-NNN`,
        severity: 'error'
      });
    }

    if (!pName || pName.length < 2) {
      errors.push({ element: `Appointment[${aid || i}]`, message: 'Missing or too short <PatientName>', severity: 'error' });
    }

    if (!dName || dName.length < 2) {
      errors.push({ element: `Appointment[${aid || i}]`, message: 'Missing or too short <DoctorName>', severity: 'error' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push({ element: `Appointment[${aid || i}]`, message: `<AppointmentDate> must match YYYY-MM-DD pattern`, severity: 'error' });
    }

    const validPriorities = ['Routine', 'Urgent', 'Follow-up', 'Emergency'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push({ element: `Appointment[${aid || i}]`, message: `Priority '${priority}' is not valid in XSD`, severity: 'error' });
    }

    const validStatuses = ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      errors.push({ element: `Appointment[${aid || i}]`, message: `Status '${status}' is not valid in XSD`, severity: 'error' });
    }

    if (!reason) {
      errors.push({ element: `Appointment[${aid || i}]`, message: 'Missing consultation <Reason>', severity: 'error' });
    }
  }

  const hasErrors = errors.some(e => e.severity === 'error');
  return {
    isValid: !hasErrors,
    patientCount: count,
    errors,
    summary: !hasErrors
      ? `Appointment XML matches appointments.xsd schema. ${count} appointment records verified.`
      : `Schema check found ${errors.filter(e => e.severity === 'error').length} error(s).`
  };
}
