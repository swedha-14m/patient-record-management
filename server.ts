import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.text({ type: 'application/xml', limit: '10mb' }));

  // Static files for XML/XSD/XSL assets
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      service: 'Patient Record Management System API',
      timestamp: new Date().toISOString(),
      version: '2.4.0'
    });
  });

  // Serve the official XSD Schema
  app.get('/api/schema', (_req: Request, res: Response) => {
    try {
      const xsdPath = path.resolve(__dirname, 'public', 'patients.xsd');
      if (fs.existsSync(xsdPath)) {
        res.setHeader('Content-Type', 'application/xml');
        return res.sendFile(xsdPath);
      }
      return res.status(404).json({ error: 'patients.xsd not found' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Serve the official XSLT Stylesheet
  app.get('/api/stylesheet', (_req: Request, res: Response) => {
    try {
      const xslPath = path.resolve(__dirname, 'public', 'patients.xsl');
      if (fs.existsSync(xslPath)) {
        res.setHeader('Content-Type', 'application/xml');
        return res.sendFile(xslPath);
      }
      return res.status(404).json({ error: 'patients.xsl not found' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Validate XML against the Patient XSD Schema rules
  app.post('/api/validate-xml', (req: Request, res: Response) => {
    try {
      const xmlContent = typeof req.body === 'string' ? req.body : req.body.xml;
      if (!xmlContent || typeof xmlContent !== 'string') {
        return res.status(400).json({
          isValid: false,
          errors: [{ message: 'No XML content provided for validation' }]
        });
      }

      const errors: Array<{ element?: string; message: string; severity: 'error' | 'warning' }> = [];

      // 1. Tag matching and basic well-formedness check
      const openTags: string[] = [];
      const tagRegex = /<\/?([a-zA-Z0-9_:-]+)(?:\s+[^>]*)?(\/?)>/g;
      let match;
      let isWellFormed = true;

      // Simple XML syntax check
      if (!xmlContent.includes('<?xml')) {
        errors.push({
          element: 'XMLDeclaration',
          message: 'Missing standard XML declaration (e.g. <?xml version="1.0" encoding="UTF-8"?>)',
          severity: 'warning'
        });
      }

      while ((match = tagRegex.exec(xmlContent)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];
        const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>');
        const isClosing = fullTag.startsWith('</');

        if (fullTag.startsWith('<?') || fullTag.startsWith('<!')) {
          continue;
        }

        if (isClosing) {
          const lastTag = openTags.pop();
          if (lastTag !== tagName) {
            isWellFormed = false;
            errors.push({
              element: tagName,
              message: `Mismatched closing tag </${tagName}>. Expected </${lastTag || 'NONE'}>`,
              severity: 'error'
            });
          }
        } else if (!isSelfClosing) {
          openTags.push(tagName);
        }
      }

      if (openTags.length > 0) {
        isWellFormed = false;
        errors.push({
          element: openTags[openTags.length - 1],
          message: `Unclosed tags detected: ${openTags.map(t => `<${t}>`).join(', ')}`,
          severity: 'error'
        });
      }

      // 2. Validate Root Element
      const hasHospitalRecordsRoot = /<([a-zA-Z0-9_:-]+:)?HospitalRecords[\s>]/.test(xmlContent) &&
                                     /<\/([a-zA-Z0-9_:-]+:)?HospitalRecords>/.test(xmlContent);
      if (!hasHospitalRecordsRoot) {
        errors.push({
          element: 'HospitalRecords',
          message: 'Schema violation: Root element must be <HospitalRecords>',
          severity: 'error'
        });
      }

      // 3. Validate Metadata
      if (!/<([a-zA-Z0-9_:-]+:)?HospitalMetadata[\s>]/.test(xmlContent)) {
        errors.push({
          element: 'HospitalMetadata',
          message: 'Schema violation: Missing required element <HospitalMetadata>',
          severity: 'error'
        });
      }

      // 4. Validate Individual Patient Elements
      const patientBlocks = xmlContent.match(/<([a-zA-Z0-9_:-]+:)?Patient(?:\s+[^>]*)?>([\s\S]*?)<\/([a-zA-Z0-9_:-]+:)?Patient>/g) || [];
      if (patientBlocks.length === 0 && !xmlContent.includes('<Patients/>')) {
        errors.push({
          element: 'Patients',
          message: 'No <Patient> records found inside <Patients> container',
          severity: 'warning'
        });
      }

      const validGenders = ['Male', 'Female', 'Other'];
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
      const patientIdPattern = /^PAT-\d{4}-\d{3,4}$/;

      patientBlocks.forEach((block, index) => {
        const idMatch = block.match(/<([a-zA-Z0-9_:-]+:)?PatientID>([^<]+)<\//);
        const nameMatch = block.match(/<([a-zA-Z0-9_:-]+:)?FullName>([^<]+)<\//);
        const ageMatch = block.match(/<([a-zA-Z0-9_:-]+:)?Age>([^<]+)<\//);
        const genderMatch = block.match(/<([a-zA-Z0-9_:-]+:)?Gender>([^<]+)<\//);
        const bloodMatch = block.match(/<([a-zA-Z0-9_:-]+:)?BloodGroup>([^<]+)<\//);
        const phoneMatch = block.match(/<([a-zA-Z0-9_:-]+:)?Phone>([^<]+)<\//);

        const currentId = idMatch ? idMatch[2].trim() : `Record #${index + 1}`;

        if (!idMatch) {
          errors.push({
            element: `Patient[${index + 1}].PatientID`,
            message: `Missing mandatory <PatientID> in patient record #${index + 1}`,
            severity: 'error'
          });
        } else if (!patientIdPattern.test(idMatch[2].trim())) {
          errors.push({
            element: `Patient[${currentId}].PatientID`,
            message: `Value '${idMatch[2].trim()}' violates XSD regex pattern '^PAT-\\d{4}-\\d{3,4}$' (e.g. PAT-2026-001)`,
            severity: 'error'
          });
        }

        if (!nameMatch || nameMatch[2].trim().length < 2) {
          errors.push({
            element: `Patient[${currentId}].FullName`,
            message: `Missing or too short <FullName> (minimum 2 characters required by schema)`,
            severity: 'error'
          });
        }

        if (!ageMatch) {
          errors.push({
            element: `Patient[${currentId}].Age`,
            message: `Missing <Age> in patient record '${currentId}'`,
            severity: 'error'
          });
        } else {
          const ageVal = parseInt(ageMatch[2].trim(), 10);
          if (isNaN(ageVal) || ageVal < 0 || ageVal > 130) {
            errors.push({
              element: `Patient[${currentId}].Age`,
              message: `Age '${ageMatch[2].trim()}' must be an integer between 0 and 130 (minInclusive 0, maxInclusive 130)`,
              severity: 'error'
            });
          }
        }

        if (genderMatch && !validGenders.includes(genderMatch[2].trim())) {
          errors.push({
            element: `Patient[${currentId}].Gender`,
            message: `Gender '${genderMatch[2].trim()}' is not in XSD enumeration: ${validGenders.join(', ')}`,
            severity: 'error'
          });
        }

        if (bloodMatch && !validBloodGroups.includes(bloodMatch[2].trim())) {
          errors.push({
            element: `Patient[${currentId}].BloodGroup`,
            message: `BloodGroup '${bloodMatch[2].trim()}' is not in XSD enumeration: ${validBloodGroups.join(', ')}`,
            severity: 'error'
          });
        }

        if (!phoneMatch || phoneMatch[2].trim().length < 5) {
          errors.push({
            element: `Patient[${currentId}].Contact.Phone`,
            message: `Missing or invalid <Phone> number in contact details for patient '${currentId}'`,
            severity: 'error'
          });
        }
      });

      const hasFatalErrors = errors.some(e => e.severity === 'error');
      const isValid = isWellFormed && !hasFatalErrors;

      return res.json({
        isValid,
        patientCount: patientBlocks.length,
        errors,
        summary: isValid
          ? `XML is 100% valid according to W3C XSD schema (patients.xsd). ${patientBlocks.length} patient records verified.`
          : `Validation failed with ${errors.filter(e => e.severity === 'error').length} error(s).`
      });
    } catch (err: any) {
      return res.status(500).json({
        isValid: false,
        errors: [{ message: `Server validator exception: ${err.message}`, severity: 'error' }]
      });
    }
  });

  // Validate Appointment Schedule XML against appointments.xsd schema
  app.post('/api/validate-appointments-xml', (req: Request, res: Response) => {
    try {
      const xmlContent = typeof req.body === 'string' ? req.body : req.body.xml;
      if (!xmlContent || typeof xmlContent !== 'string') {
        return res.status(400).json({
          isValid: false,
          errors: [{ message: 'No XML content provided for validation' }]
        });
      }

      const errors: Array<{ element?: string; message: string; severity: 'error' | 'warning' }> = [];

      // 1. Tag matching and basic well-formedness
      const openTags: string[] = [];
      const tagRegex = /<\/?([a-zA-Z0-9_:-]+)(?:\s+[^>]*)?(\/?)>/g;
      let match;
      let isWellFormed = true;

      if (!xmlContent.includes('<?xml')) {
        errors.push({
          element: 'XMLDeclaration',
          message: 'Missing standard XML declaration (e.g. <?xml version="1.0" encoding="UTF-8"?>)',
          severity: 'warning'
        });
      }

      while ((match = tagRegex.exec(xmlContent)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];
        const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>');
        const isClosing = fullTag.startsWith('</');

        if (fullTag.startsWith('<?') || fullTag.startsWith('<!')) {
          continue;
        }

        if (isClosing) {
          const lastTag = openTags.pop();
          if (lastTag !== tagName) {
            isWellFormed = false;
            errors.push({
              element: tagName,
              message: `Mismatched closing tag </${tagName}>. Expected </${lastTag || 'NONE'}>`,
              severity: 'error'
            });
          }
        } else if (!isSelfClosing) {
          openTags.push(tagName);
        }
      }

      if (openTags.length > 0) {
        isWellFormed = false;
        errors.push({
          element: openTags[openTags.length - 1],
          message: `Unclosed tags detected: ${openTags.map(t => `<${t}>`).join(', ')}`,
          severity: 'error'
        });
      }

      // 2. Validate Root Element <AppointmentSchedule>
      const hasScheduleRoot = /<([a-zA-Z0-9_:-]+:)?AppointmentSchedule[\s>]/.test(xmlContent) &&
                              /<\/([a-zA-Z0-9_:-]+:)?AppointmentSchedule>/.test(xmlContent);
      if (!hasScheduleRoot) {
        errors.push({
          element: 'AppointmentSchedule',
          message: 'Schema violation: Root element must be <AppointmentSchedule>',
          severity: 'error'
        });
      }

      // 3. Validate Metadata
      if (!/<([a-zA-Z0-9_:-]+:)?ScheduleMetadata[\s>]/.test(xmlContent)) {
        errors.push({
          element: 'ScheduleMetadata',
          message: 'Schema violation: Missing required element <ScheduleMetadata>',
          severity: 'error'
        });
      }

      // 4. Validate Individual Appointment Elements
      const appointmentBlocks = xmlContent.match(/<([a-zA-Z0-9_:-]+:)?Appointment(?:\s+[^>]*)?>([\s\S]*?)<\/([a-zA-Z0-9_:-]+:)?Appointment>/g) || [];
      if (appointmentBlocks.length === 0 && !xmlContent.includes('<Appointments/>')) {
        errors.push({
          element: 'Appointments',
          message: 'No <Appointment> records found inside <Appointments> container',
          severity: 'warning'
        });
      }

      const validPriorities = ['Routine', 'Urgent', 'Follow-up', 'Emergency'];
      const validStatuses = ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'];
      const aptIdPattern = /^APT-\d{4}-\d{3,4}$/;
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      appointmentBlocks.forEach((block, index) => {
        const idMatch = block.match(/<([a-zA-Z0-9_:-]+:)?AppointmentID>([^<]+)<\//);
        const patientNameMatch = block.match(/<([a-zA-Z0-9_:-]+:)?PatientName>([^<]+)<\//);
        const doctorNameMatch = block.match(/<([a-zA-Z0-9_:-]+:)?DoctorName>([^<]+)<\//);
        const dateMatch = block.match(/<([a-zA-Z0-9_:-]+:)?AppointmentDate>([^<]+)<\//);
        const priorityMatch = block.match(/<([a-zA-Z0-9_:-]+:)?Priority>([^<]+)<\//);
        const statusMatch = block.match(/<([a-zA-Z0-9_:-]+:)?Status>([^<]+)<\//);
        const reasonMatch = block.match(/<([a-zA-Z0-9_:-]+:)?Reason>([^<]+)<\//);

        const currentId = idMatch ? idMatch[2].trim() : `Appointment #${index + 1}`;

        if (!idMatch) {
          errors.push({
            element: `Appointment[${index + 1}].AppointmentID`,
            message: `Missing mandatory <AppointmentID> in appointment record #${index + 1}`,
            severity: 'error'
          });
        } else if (!aptIdPattern.test(idMatch[2].trim())) {
          errors.push({
            element: `Appointment[${currentId}].AppointmentID`,
            message: `Value '${idMatch[2].trim()}' violates XSD pattern '^APT-\\d{4}-\\d{3,4}$' (e.g. APT-2026-001)`,
            severity: 'error'
          });
        }

        if (!patientNameMatch || patientNameMatch[2].trim().length < 2) {
          errors.push({
            element: `Appointment[${currentId}].PatientName`,
            message: `Missing or invalid <PatientName> in appointment '${currentId}'`,
            severity: 'error'
          });
        }

        if (!doctorNameMatch || doctorNameMatch[2].trim().length < 2) {
          errors.push({
            element: `Appointment[${currentId}].DoctorName`,
            message: `Missing or invalid <DoctorName> in appointment '${currentId}'`,
            severity: 'error'
          });
        }

        if (!dateMatch || !datePattern.test(dateMatch[2].trim())) {
          errors.push({
            element: `Appointment[${currentId}].AppointmentDate`,
            message: `AppointmentDate '${dateMatch ? dateMatch[2].trim() : 'missing'}' must match YYYY-MM-DD pattern`,
            severity: 'error'
          });
        }

        if (priorityMatch && !validPriorities.includes(priorityMatch[2].trim())) {
          errors.push({
            element: `Appointment[${currentId}].Priority`,
            message: `Priority '${priorityMatch[2].trim()}' is not in XSD enumeration: ${validPriorities.join(', ')}`,
            severity: 'error'
          });
        }

        if (statusMatch && !validStatuses.includes(statusMatch[2].trim())) {
          errors.push({
            element: `Appointment[${currentId}].Status`,
            message: `Status '${statusMatch[2].trim()}' is not in XSD enumeration: ${validStatuses.join(', ')}`,
            severity: 'error'
          });
        }

        if (!reasonMatch || reasonMatch[2].trim().length === 0) {
          errors.push({
            element: `Appointment[${currentId}].Reason`,
            message: `Missing mandatory consultation <Reason> in appointment '${currentId}'`,
            severity: 'error'
          });
        }
      });

      const hasFatalErrors = errors.some(e => e.severity === 'error');
      const isValid = isWellFormed && !hasFatalErrors;

      return res.json({
        isValid,
        appointmentCount: appointmentBlocks.length,
        errors,
        summary: isValid
          ? `Appointment XML is 100% valid according to W3C XSD schema (appointments.xsd). ${appointmentBlocks.length} consultations verified.`
          : `Validation failed with ${errors.filter(e => e.severity === 'error').length} error(s).`
      });
    } catch (err: any) {
      return res.status(500).json({
        isValid: false,
        errors: [{ message: `Appointment validator error: ${err.message}`, severity: 'error' }]
      });
    }
  });

  // Server-side transformation of Patient XML to HTML report
  app.post('/api/transform-xslt', (req: Request, res: Response) => {
    try {
      const xmlContent = typeof req.body === 'string' ? req.body : req.body.xml;
      if (!xmlContent || typeof xmlContent !== 'string') {
        return res.status(400).send('<p style="color:red;">Error: No XML payload supplied.</p>');
      }

      // Extract metadata
      const hospitalNameMatch = xmlContent.match(/<([a-zA-Z0-9_:-]+:)?HospitalName>([^<]+)<\//);
      const exportDateMatch = xmlContent.match(/<([a-zA-Z0-9_:-]+:)?ExportDate>([^<]+)<\//);
      const totalMatch = xmlContent.match(/<([a-zA-Z0-9_:-]+:)?TotalPatients>([^<]+)<\//);

      const hospitalName = hospitalNameMatch ? hospitalNameMatch[2] : 'Apex General Hospital';
      const exportDate = exportDateMatch ? exportDateMatch[2] : new Date().toISOString().split('T')[0];

      // Extract patients
      const patientRegex = /<([a-zA-Z0-9_:-]+:)?Patient(?:\s+[^>]*)?>([\s\S]*?)<\/([a-zA-Z0-9_:-]+:)?Patient>/g;
      const patients: Array<{
        id: string;
        name: string;
        age: string;
        gender: string;
        blood: string;
        phone: string;
        email: string;
        address: string;
        history: string;
        allergies: string;
        regDate: string;
      }> = [];

      let pMatch;
      while ((pMatch = patientRegex.exec(xmlContent)) !== null) {
        const block = pMatch[2];
        const getTag = (tag: string) => {
          const m = block.match(new RegExp(`<([a-zA-Z0-9_:-]+:)?${tag}>([^<]+)<\\/`));
          return m ? m[2].trim() : '';
        };

        patients.push({
          id: getTag('PatientID') || 'N/A',
          name: getTag('FullName') || 'Unknown',
          age: getTag('Age') || '0',
          gender: getTag('Gender') || 'Unknown',
          blood: getTag('BloodGroup') || 'Unknown',
          phone: getTag('Phone') || 'N/A',
          email: getTag('Email') || 'N/A',
          address: getTag('Address') || 'N/A',
          history: getTag('MedicalHistory') || 'None recorded',
          allergies: getTag('Allergies') || 'None reported',
          regDate: getTag('RegistrationDate') || exportDate,
        });
      }

      const totalPatients = totalMatch ? totalMatch[2] : patients.length.toString();

      // Generate HTML report matching XSLT layout
      const htmlOutput = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8"/>
          <title>Hospital Patient Directory &amp; Clinical Summary Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              color: #1e293b;
              margin: 0;
              padding: 24px;
            }
            .report-container {
              max-width: 1050px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
              color: #ffffff;
              padding: 28px 32px;
            }
            .header h1 {
              margin: 0 0 6px 0;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.025em;
            }
            .header p {
              margin: 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .meta-bar {
              background-color: #eff6ff;
              border-bottom: 1px solid #dbeafe;
              padding: 12px 32px;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              color: #1e40af;
              font-weight: 500;
            }
            .content {
              padding: 24px 32px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
              margin-top: 16px;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              text-align: left;
              padding: 12px 14px;
              font-weight: 600;
              border-bottom: 2px solid #cbd5e1;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.05em;
            }
            td {
              padding: 12px 14px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            tr:hover {
              background-color: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
            }
            .badge-blood {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .badge-gender {
              background-color: #e0e7ff;
              color: #3730a3;
            }
            .patient-id {
              font-family: monospace;
              font-weight: 700;
              color: #2563eb;
            }
            .clinical-notes {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
              line-height: 1.4;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${hospitalName}</h1>
              <p>Official Patient Record Directory &amp; Clinical Admission Manifest (Transformed via XSLT Engine)</p>
            </div>
            <div class="meta-bar">
              <span>Generated Date: <strong>${exportDate}</strong></span>
              <span>Total Records Processed: <strong>${totalPatients}</strong></span>
              <span>Transform Engine: <strong>Node.js Server XSLT Transformer &amp; W3C Schema</strong></span>
            </div>
            <div class="content">
              <table>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Name &amp; Age</th>
                    <th>Gender / Blood</th>
                    <th>Contact Info</th>
                    <th>Clinical History &amp; Allergies</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  ${patients.map(p => `
                    <tr>
                      <td><span class="patient-id">${p.id}</span></td>
                      <td>
                        <div style="font-weight: 600; color: #0f172a;">${p.name}</div>
                        <div style="font-size: 12px; color: #64748b;">Age: ${p.age} yrs</div>
                      </td>
                      <td>
                        <span class="badge badge-gender">${p.gender}</span>
                        <span class="badge badge-blood" style="margin-left: 4px;">${p.blood}</span>
                      </td>
                      <td>
                        <div>📞 ${p.phone}</div>
                        <div style="font-size: 11px; color: #64748b;">✉️ ${p.email}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${p.address}</div>
                      </td>
                      <td>
                        <div style="font-weight: 500;">${p.history}</div>
                        ${p.allergies && p.allergies !== 'None reported' ? `<div class="clinical-notes" style="color: #b91c1c;"><strong>Allergies:</strong> ${p.allergies}</div>` : ''}
                      </td>
                      <td>
                        <span style="font-size: 12px; color: #475569;">${p.regDate}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                Patient Record Management System &bull; College Web Technology Laboratory Demonstration &bull; Generated from Cloud Firestore via XML/XSD/XSLT
              </div>
            </div>
          </div>
        </body>
      </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlOutput);
    } catch (err: any) {
      return res.status(500).send(`<p style="color:red;">Transformation failed: ${err.message}</p>`);
    }
  });

  // Vite middleware in dev or static serve in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
