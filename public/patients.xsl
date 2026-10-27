<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:p="http://hospital.example.org/patients"
                exclude-result-prefixes="p">
  <xsl:output method="html" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/">
    <html>
      <head>
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
            max-width: 1000px;
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
            margin: 0 0 8px 0;
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
          .badge-status {
            background-color: #dcfce7;
            color: #166534;
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
            <h1><xsl:value-of select="//p:HospitalMetadata/p:HospitalName | //HospitalMetadata/HospitalName"/></h1>
            <p>Official Patient Record Directory &amp; Clinical Admission Manifest (Transformed via XSLT)</p>
          </div>
          <div class="meta-bar">
            <span>Generated Date: <strong><xsl:value-of select="//p:HospitalMetadata/p:ExportDate | //HospitalMetadata/ExportDate"/></strong></span>
            <span>Total Records Processed: <strong><xsl:value-of select="//p:HospitalMetadata/p:TotalPatients | //HospitalMetadata/TotalPatients"/></strong></span>
            <span>Transform Engine: <strong>W3C XSLT 1.0</strong></span>
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
                <xsl:for-each select="//p:Patients/p:Patient | //Patients/Patient">
                  <tr>
                    <td>
                      <span class="patient-id"><xsl:value-of select="p:PatientID | PatientID"/></span>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: #0f172a;"><xsl:value-of select="p:FullName | FullName"/></div>
                      <div style="font-size: 12px; color: #64748b;">Age: <xsl:value-of select="p:Age | Age"/> yrs</div>
                    </td>
                    <td>
                      <span class="badge badge-gender"><xsl:value-of select="p:Gender | Gender"/></span>
                      <span class="badge badge-blood" style="margin-left: 4px;"><xsl:value-of select="p:BloodGroup | BloodGroup"/></span>
                    </td>
                    <td>
                      <div>&#128222; <xsl:value-of select="p:Contact/p:Phone | Contact/Phone"/></div>
                      <div style="font-size: 11px; color: #64748b;">&#9993; <xsl:value-of select="p:Contact/p:Email | Contact/Email"/></div>
                      <div style="font-size: 11px; color: #94a3b8;"><xsl:value-of select="p:Contact/p:Address | Contact/Address"/></div>
                    </td>
                    <td>
                      <div style="font-weight: 500;"><xsl:value-of select="p:ClinicalDetails/p:MedicalHistory | ClinicalDetails/MedicalHistory"/></div>
                      <xsl:if test="p:ClinicalDetails/p:Allergies != '' or ClinicalDetails/Allergies != ''">
                        <div class="clinical-notes" style="color: #b91c1c;">
                          Allergies: <xsl:value-of select="p:ClinicalDetails/p:Allergies | ClinicalDetails/Allergies"/>
                        </div>
                      </xsl:if>
                    </td>
                    <td>
                      <span style="font-size: 12px; color: #475569;"><xsl:value-of select="p:ClinicalDetails/p:RegistrationDate | ClinicalDetails/RegistrationDate"/></span>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>

            <div class="footer">
              Patient Record Management System &bull; College Web Technology Laboratory Demonstration &bull; Generated from Cloud Firestore via XML/XSD/XSLT
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
