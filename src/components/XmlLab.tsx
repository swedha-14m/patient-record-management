import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  RefreshCw,
  Play,
  Code2,
  FileText,
  Eye,
  Check,
  Layers,
  Sparkles,
  Printer,
  CalendarCheck,
  Users
} from 'lucide-react';
import { Patient, Appointment, XMLValidationResult } from '../types';
import {
  generatePatientsXML,
  generateAppointmentsXML,
  downloadFile,
  validateXMLWithServer,
  clientValidateXML,
  validateAppointmentsXMLWithServer,
  clientValidateAppointmentsXML,
  transformXMLWithXSLT
} from '../services/xmlUtils';

interface XmlLabProps {
  patients: Patient[];
  appointments: Appointment[];
}

export const XmlLab: React.FC<XmlLabProps> = ({ patients, appointments }) => {
  // Main dataset mode: 'patients' | 'appointments'
  const [datasetMode, setDatasetMode] = useState<'patients' | 'appointments'>('patients');

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'xml' | 'xsd' | 'xslt' | 'preview'>('xml');

  // Patient XML/XSD/XSLT State
  const [xmlContent, setXmlContent] = useState<string>('');
  const [xsdContent, setXsdContent] = useState<string>('');
  const [xslContent, setXslContent] = useState<string>('');
  const [transformedHtml, setTransformedHtml] = useState<string>('');
  const [validationResult, setValidationResult] = useState<XMLValidationResult | null>(null);

  // Appointment XML/XSD State
  const [apptXmlContent, setApptXmlContent] = useState<string>('');
  const [apptXsdContent, setApptXsdContent] = useState<string>('');
  const [apptValidationResult, setApptValidationResult] = useState<XMLValidationResult | null>(null);

  // Loading & Action State
  const [isValidating, setIsValidating] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load patient files & initialize
  useEffect(() => {
    if (patients.length > 0) {
      setXmlContent(generatePatientsXML(patients));
    } else {
      fetch('/patients.xml')
        .then((res) => res.text())
        .then((data) => setXmlContent(data))
        .catch(() => setXmlContent(generatePatientsXML([])));
    }

    fetch('/patients.xsd')
      .then((res) => res.text())
      .then((data) => setXsdContent(data))
      .catch((err) => console.error('Failed to load patients.xsd:', err));

    fetch('/patients.xsl')
      .then((res) => res.text())
      .then((data) => setXslContent(data))
      .catch((err) => console.error('Failed to load patients.xsl:', err));
  }, [patients]);

  // Load appointment files & initialize
  useEffect(() => {
    if (appointments.length > 0) {
      setApptXmlContent(generateAppointmentsXML(appointments));
    } else {
      fetch('/appointments.xml')
        .then((res) => res.text())
        .then((data) => setApptXmlContent(data))
        .catch(() => setApptXmlContent(generateAppointmentsXML([])));
    }

    fetch('/appointments.xsd')
      .then((res) => res.text())
      .then((data) => setApptXsdContent(data))
      .catch((err) => console.error('Failed to load appointments.xsd:', err));
  }, [appointments]);

  // Sync patient XML with live Firestore patients
  const handleRegeneratePatientsFromDb = () => {
    const freshXml = generatePatientsXML(patients);
    setXmlContent(freshXml);
    setValidationResult(null);
  };

  // Sync appointment XML with live Firestore appointments
  const handleRegenerateAppointmentsFromDb = () => {
    const freshXml = generateAppointmentsXML(appointments);
    setApptXmlContent(freshXml);
    setApptValidationResult(null);
  };

  // Validate Patient XML
  const handleRunPatientValidation = async () => {
    setIsValidating(true);
    try {
      const res = await validateXMLWithServer(xmlContent);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult(clientValidateXML(xmlContent));
    } finally {
      setIsValidating(false);
    }
  };

  // Validate Appointment XML
  const handleRunAppointmentValidation = async () => {
    setIsValidating(true);
    try {
      const res = await validateAppointmentsXMLWithServer(apptXmlContent);
      setApptValidationResult(res);
    } catch (err: any) {
      setApptValidationResult(clientValidateAppointmentsXML(apptXmlContent));
    } finally {
      setIsValidating(false);
    }
  };

  // Run XSLT transformation on Patient XML
  const handleRunTransform = async () => {
    setIsTransforming(true);
    try {
      let currentXsl = xslContent;
      if (!currentXsl) {
        const res = await fetch('/patients.xsl');
        currentXsl = await res.text();
        setXslContent(currentXsl);
      }

      const html = await transformXMLWithXSLT(xmlContent, currentXsl);
      setTransformedHtml(html);
      setActiveSubTab('preview');
    } catch (err: any) {
      alert(`Transformation failed: ${err.message}`);
    } finally {
      setIsTransforming(false);
    }
  };

  // Copy helper
  const handleCopyCurrent = () => {
    const textToCopy = datasetMode === 'patients' ? xmlContent : apptXmlContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download helpers
  const handleDownloadPatientXml = () => {
    downloadFile(xmlContent, 'patients-export.xml', 'application/xml');
  };

  const handleDownloadPatientXsd = () => {
    downloadFile(xsdContent, 'patients.xsd', 'application/xml');
  };

  const handleDownloadApptXml = () => {
    downloadFile(apptXmlContent, 'appointments-export.xml', 'application/xml');
  };

  const handleDownloadApptXsd = () => {
    downloadFile(apptXsdContent, 'appointments.xsd', 'application/xml');
  };

  const handleDownloadHtmlReport = () => {
    if (!transformedHtml) return;
    downloadFile(transformedHtml, 'hospital-patient-report.html', 'text/html');
  };

  // Injection test cases for academic demo
  const injectInvalidPatientXml = (type: 'pattern' | 'age' | 'gender' | 'tag') => {
    if (type === 'pattern') {
      setXmlContent(xmlContent.replace(/<PatientID>PAT-\d{4}-\d{3,4}<\/PatientID>/, '<PatientID>INVALID_ID_99</PatientID>'));
    } else if (type === 'age') {
      setXmlContent(xmlContent.replace(/<Age>\d+<\/Age>/, '<Age>250</Age>'));
    } else if (type === 'gender') {
      setXmlContent(xmlContent.replace(/<Gender>(Male|Female|Other)<\/Gender>/, '<Gender>UnknownAlien</Gender>'));
    } else if (type === 'tag') {
      setXmlContent(xmlContent.replace('</PatientID>', '</MismatchedTag>'));
    }
    setValidationResult(null);
  };

  const injectInvalidApptXml = (type: 'pattern' | 'date' | 'priority' | 'tag') => {
    if (type === 'pattern') {
      setApptXmlContent(apptXmlContent.replace(/<AppointmentID>APT-\d{4}-\d{3,4}<\/AppointmentID>/, '<AppointmentID>INVALID_APT_CODE</AppointmentID>'));
    } else if (type === 'date') {
      setApptXmlContent(apptXmlContent.replace(/<AppointmentDate>\d{4}-\d{2}-\d{2}<\/AppointmentDate>/, '<AppointmentDate>28-10-2026</AppointmentDate>'));
    } else if (type === 'priority') {
      setApptXmlContent(apptXmlContent.replace(/<Priority>(Routine|Urgent|Follow-up|Emergency)<\/Priority>/, '<Priority>SuperHighPriority</Priority>'));
    } else if (type === 'tag') {
      setApptXmlContent(apptXmlContent.replace('</AppointmentID>', '</MismatchedTag>'));
    }
    setApptValidationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-indigo-100 border border-white/20">
              <FileCode2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>College Web Technology Core Laboratory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {datasetMode === 'patients'
                ? 'Patient Records XML, XSD & XSLT Suite'
                : 'Appointment Schedule XML & XSD Validation'}
            </h1>
            <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
              {datasetMode === 'patients'
                ? 'Export live patient admissions into W3C Schema-compliant XML, validate constraints with patients.xsd, and transform with patients.xsl.'
                : 'Export live outpatient consultation bookings into standardized XML, and validate with appointments.xsd (patterns, dates, priority enums).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {datasetMode === 'patients' ? (
              <>
                <button
                  onClick={handleRegeneratePatientsFromDb}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl border border-white/30 backdrop-blur-xs transition"
                  title="Regenerate XML from latest Cloud Firestore patients"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Patients ({patients.length})</span>
                </button>
                <button
                  onClick={handleRunPatientValidation}
                  disabled={isValidating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isValidating ? 'Validating...' : 'Validate XSD'}</span>
                </button>
                <button
                  onClick={handleRunTransform}
                  disabled={isTransforming}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  <span>{isTransforming ? 'Transforming...' : 'Execute XSLT'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRegenerateAppointmentsFromDb}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl border border-white/30 backdrop-blur-xs transition"
                  title="Regenerate XML from latest Cloud Firestore appointments"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Appointments ({appointments.length})</span>
                </button>
                <button
                  onClick={handleRunAppointmentValidation}
                  disabled={isValidating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isValidating ? 'Validating...' : 'Validate appointments.xsd'}</span>
                </button>
                <button
                  onClick={handleDownloadApptXml}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download .xml</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Selector Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setDatasetMode('patients');
            setActiveSubTab('xml');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            datasetMode === 'patients'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Records (XML, XSD &amp; XSLT)</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => {
            setDatasetMode('appointments');
            setActiveSubTab('xml');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            datasetMode === 'appointments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Export Appointments (XML &amp; XSD Validation)</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {appointments.length}
          </span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('xml')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'xml'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>
              {datasetMode === 'patients' ? '1. Patient XML Source' : '1. Appointment Schedule XML'}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('xsd')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'xsd'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>
              {datasetMode === 'patients' ? '2. Schema (patients.xsd)' : '2. Schema (appointments.xsd)'}
            </span>
          </button>

          {datasetMode === 'patients' && (
            <>
              <button
                onClick={() => setActiveSubTab('xslt')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                  activeSubTab === 'xslt'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>3. Stylesheet (patients.xsl)</span>
              </button>

              <button
                onClick={() => {
                  if (!transformedHtml) handleRunTransform();
                  else setActiveSubTab('preview');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                  activeSubTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>4. Transformed HTML Report</span>
              </button>
            </>
          )}
        </div>

        {/* Action buttons for active sub-tab */}
        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={handleCopyCurrent}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy XML'}</span>
          </button>

          {datasetMode === 'patients' ? (
            <>
              {activeSubTab === 'xml' && (
                <button
                  onClick={handleDownloadPatientXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md border border-indigo-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download patients.xml</span>
                </button>
              )}
              {activeSubTab === 'xsd' && (
                <button
                  onClick={handleDownloadPatientXsd}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md border border-indigo-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download patients.xsd</span>
                </button>
              )}
              {activeSubTab === 'preview' && transformedHtml && (
                <button
                  onClick={handleDownloadHtmlReport}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HTML Report</span>
                </button>
              )}
            </>
          ) : (
            <>
              {activeSubTab === 'xml' && (
                <button
                  onClick={handleDownloadApptXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md border border-indigo-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download appointments.xml</span>
                </button>
              )}
              {activeSubTab === 'xsd' && (
                <button
                  onClick={handleDownloadApptXsd}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md border border-indigo-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download appointments.xsd</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation Result Banner for Patient Records */}
      {datasetMode === 'patients' && validationResult && (
        <div
          className={`p-5 rounded-xl border shadow-xs space-y-2.5 ${
            validationResult.isValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {validationResult.isValid ? 'Patient XSD Schema Validation Passed (100% Valid)' : 'Patient Schema Validation Failed'}
                </h3>
                <p className="text-xs opacity-90">{validationResult.summary}</p>
              </div>
            </div>
            <button
              onClick={() => setValidationResult(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>

          {validationResult.errors.length > 0 && (
            <div className="pt-2 border-t border-rose-200/60 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                Detailed Schema Violations:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {validationResult.errors.map((err, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/70 border border-rose-200 font-mono text-[11px]">
                    <span className="font-bold text-rose-700">&lt;{err.element || 'element'}&gt;:</span>{' '}
                    <span className="text-slate-800">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Result Banner for Appointments Schedule */}
      {datasetMode === 'appointments' && apptValidationResult && (
        <div
          className={`p-5 rounded-xl border shadow-xs space-y-2.5 ${
            apptValidationResult.isValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {apptValidationResult.isValid ? (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {apptValidationResult.isValid
                    ? 'Appointment XSD Validation Passed (100% Valid according to appointments.xsd)'
                    : 'Appointment Schema Validation Failed'}
                </h3>
                <p className="text-xs opacity-90">{apptValidationResult.summary}</p>
              </div>
            </div>
            <button
              onClick={() => setApptValidationResult(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>

          {apptValidationResult.errors.length > 0 && (
            <div className="pt-2 border-t border-rose-200/60 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                Detailed Schema Violations:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {apptValidationResult.errors.map((err, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/70 border border-rose-200 font-mono text-[11px]">
                    <span className="font-bold text-rose-700">&lt;{err.element || 'element'}&gt;:</span>{' '}
                    <span className="text-slate-800">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== CONTENT SECTION ==================== */}

      {/* PATIENT DATASET MODE */}
      {datasetMode === 'patients' && (
        <>
          {activeSubTab === 'xml' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-semibold text-slate-900">Live Patient XML Payload</span>
                  <span>&bull;</span>
                  <span>{xmlContent.split('\n').length} lines</span>
                  <span>&bull;</span>
                  <span>{patients.length} live records formatted</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Demo Testing:</span>
                  <button
                    onClick={() => injectInvalidPatientXml('pattern')}
                    className="px-2 py-1 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                    title="Break PAT-YYYY-NNN ID pattern"
                  >
                    Invalid ID
                  </button>
                  <button
                    onClick={() => injectInvalidPatientXml('age')}
                    className="px-2 py-1 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                    title="Inject Age: 250"
                  >
                    Invalid Age
                  </button>
                  <button
                    onClick={() => injectInvalidPatientXml('gender')}
                    className="px-2 py-1 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                    title="Inject invalid gender enum"
                  >
                    Invalid Enum
                  </button>
                  <button
                    onClick={handleRegeneratePatientsFromDb}
                    className="px-2 py-1 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 font-medium"
                  >
                    Reset Valid
                  </button>
                </div>
              </div>

              <textarea
                value={xmlContent}
                onChange={(e) => {
                  setXmlContent(e.target.value);
                  setValidationResult(null);
                }}
                rows={22}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 leading-relaxed focus:outline-hidden resize-y"
              />
            </div>
          )}

          {activeSubTab === 'xsd' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 font-mono">/public/patients.xsd</span>
                  <p className="text-[11px] text-slate-500">
                    W3C XML Schema Definition specifying complex types, regex patterns, age restrictions, and enumerations
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[11px] font-bold">
                  XSD 1.0
                </span>
              </div>

              <textarea
                readOnly
                value={xsdContent}
                rows={22}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-blue-300 leading-relaxed focus:outline-hidden"
              />
            </div>
          )}

          {activeSubTab === 'xslt' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 font-mono">/public/patients.xsl</span>
                  <p className="text-[11px] text-slate-500">
                    W3C Extensible Stylesheet Language Transformations converting patient XML into HTML reports
                  </p>
                </div>
                <button
                  onClick={handleRunTransform}
                  disabled={isTransforming}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 text-xs shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Transformation</span>
                </button>
              </div>

              <textarea
                readOnly
                value={xslContent}
                rows={22}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-purple-300 leading-relaxed focus:outline-hidden"
              />
            </div>
          )}

          {activeSubTab === 'preview' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900">Transformed HTML Clinical Document</span>
                  <p className="text-[11px] text-slate-500">Rendered via client XSLTProcessor &amp; Node.js server fallback</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(transformedHtml);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Document</span>
                  </button>
                  <button
                    onClick={handleDownloadHtmlReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>

              {transformedHtml ? (
                <div className="p-4 bg-slate-100 min-h-[500px]">
                  <iframe
                    title="XSLT Transformed HTML Output"
                    srcDoc={transformedHtml}
                    className="w-full min-h-[600px] bg-white rounded-xl border border-slate-300 shadow-sm"
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <Play className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">No Transformation Executed Yet</p>
                  <button
                    onClick={handleRunTransform}
                    disabled={isTransforming}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition"
                  >
                    Execute XSLT Transformation Now
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* APPOINTMENT DATASET MODE */}
      {datasetMode === 'appointments' && (
        <>
          {activeSubTab === 'xml' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-semibold text-slate-900">Live Appointment Schedule XML Payload</span>
                  <span>&bull;</span>
                  <span>{apptXmlContent.split('\n').length} lines</span>
                  <span>&bull;</span>
                  <span>{appointments.length} consultations formatted</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Demo Testing:</span>
                  <button
                    onClick={() => injectInvalidApptXml('pattern')}
                    className="px-2 py-1 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                    title="Break APT-YYYY-NNN ID pattern"
                  >
                    Invalid APT-ID
                  </button>
                  <button
                    onClick={() => injectInvalidApptXml('date')}
                    className="px-2 py-1 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                    title="Inject non-ISO date format"
                  >
                    Invalid Date
                  </button>
                  <button
                    onClick={() => injectInvalidApptXml('priority')}
                    className="px-2 py-1 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                    title="Inject non-enum priority"
                  >
                    Invalid Priority
                  </button>
                  <button
                    onClick={handleRegenerateAppointmentsFromDb}
                    className="px-2 py-1 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 font-medium"
                  >
                    Reset Valid
                  </button>
                </div>
              </div>

              <textarea
                value={apptXmlContent}
                onChange={(e) => {
                  setApptXmlContent(e.target.value);
                  setApptValidationResult(null);
                }}
                rows={22}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-amber-300 leading-relaxed focus:outline-hidden resize-y"
              />
            </div>
          )}

          {activeSubTab === 'xsd' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 font-mono">/public/appointments.xsd</span>
                  <p className="text-[11px] text-slate-500">
                    W3C XML Schema Definition specifying complex types, APT ID patterns, appointment dates, and priority enumerations
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[11px] font-bold">
                  XSD 1.0
                </span>
              </div>

              <textarea
                readOnly
                value={apptXsdContent}
                rows={22}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-blue-300 leading-relaxed focus:outline-hidden"
              />
            </div>
          )}
        </>
      )}

      {/* College Web Tech Laboratory Checklist & Viva Voce Guide */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Web Technology Lab Evaluation &amp; XML/XSD Schema Overview</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1.5">
            <h4 className="font-bold text-blue-900">Patient XML (patients.xsd)</h4>
            <p className="text-blue-700 text-[11px] leading-relaxed">
              Validates schema constraints: <code className="font-mono text-[10px]">xs:pattern</code> for Patient ID
              (<code className="font-mono text-[10px]">PAT-\d&#123;4&#125;-\d&#123;3,4&#125;</code>), Age boundary (0-130),
              and enumerations for Gender and Blood Groups.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1.5">
            <h4 className="font-bold text-amber-900">Appointment Schedule (appointments.xsd)</h4>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Enforces pattern <code className="font-mono text-[10px]">^APT-\d&#123;4&#125;-\d&#123;3,4&#125;$</code>,
              valid ISO date (<code className="font-mono text-[10px]">YYYY-MM-DD</code>), and enumerations for Priority
              (<code className="font-mono text-[10px]">Routine</code>, <code className="font-mono text-[10px]">Urgent</code>, etc.)
              and Status.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200 space-y-1.5">
            <h4 className="font-bold text-purple-900">XSLT 1.0 Transformation</h4>
            <p className="text-purple-700 text-[11px] leading-relaxed">
              Uses <code className="font-mono text-[10px]">xsl:template</code>, <code className="font-mono text-[10px]">xsl:for-each</code>,
              and <code className="font-mono text-[10px]">xsl:value-of</code> to produce a responsive clinical summary table with highlighted badges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
