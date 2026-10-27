import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  User,
  ShieldCheck,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  Calendar,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Patient, PatientActivityLog, PatientActivityAction } from '../types';
import {
  subscribeToPatientActivityLogs,
  logPatientActivity,
  seedInitialPatientLogsIfEmpty,
  auth
} from '../services/firebase';

interface ActivityLogProps {
  patient: Patient;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ patient }) => {
  const [logs, setLogs] = useState<PatientActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [newNote, setNewNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [noteSuccess, setNoteSuccess] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Seed initial logs if this record was created prior to the activity audit feature
    seedInitialPatientLogsIfEmpty(patient);

    // Subscribe to real-time chronological updates ordered by timestamp DESC
    const unsubscribe = subscribeToPatientActivityLogs(
      patient.id,
      (updatedLogs) => {
        setLogs(updatedLogs);
        setLoading(false);
      },
      (err) => {
        console.error('Activity logs subscription error:', err);
        setError('Failed to load real-time patient activity logs.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patient.id]);

  const handleAddStaffNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsSubmittingNote(true);
      const actor = auth.currentUser;
      const actorName = actor?.displayName || actor?.email || 'Duty Medical Officer (Staff)';
      const actorUid = actor?.uid || 'staff-auth';

      await logPatientActivity(patient.id, {
        patientDocId: patient.id,
        patientId: patient.patientId,
        action: 'NOTE_ADDED',
        actorUid,
        actorName,
        summary: newNote.trim(),
        changedFields: ['progressNotes'],
        timestamp: new Date().toISOString()
      });

      setNewNote('');
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to append staff note:', err);
      setError('Failed to append clinical progress note to activity log.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getActionBadge = (action: PatientActivityAction) => {
    switch (action) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>RECORD CREATED</span>
          </span>
        );
      case 'CLINICAL_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3" />
            <span>CLINICAL UPDATE</span>
          </span>
        );
      case 'CONTACT_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <User className="w-3 h-3" />
            <span>CONTACT UPDATE</span>
          </span>
        );
      case 'NOTE_ADDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <FileText className="w-3 h-3" />
            <span>CLINICAL NOTE</span>
          </span>
        );
      case 'DELETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            <span>DELETED</span>
          </span>
        );
      case 'UPDATED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <RefreshCw className="w-3 h-3" />
            <span>UPDATED</span>
          </span>
        );
    }
  };

  const formatTimestamp = (isoString: string): { datePart: string; timePart: string } => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return { datePart: isoString, timePart: '' };

      const datePart = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timePart = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return { datePart, timePart };
    } catch {
      return { datePart: isoString, timePart: '' };
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    return log.action === filterAction;
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Chronological Activity &amp; Audit Trail</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-mono">
                {logs.length} {logs.length === 1 ? 'event' : 'events'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Query timestamp index for <span className="font-semibold text-slate-700">{patient.patientId}</span> ({patient.fullName})
            </p>
          </div>
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Event Types</option>
            <option value="CREATED">Initial Creation</option>
            <option value="UPDATED">General Updates</option>
            <option value="CLINICAL_UPDATE">Clinical Updates</option>
            <option value="CONTACT_UPDATE">Contact Updates</option>
            <option value="NOTE_ADDED">Clinical Staff Notes</option>
          </select>
        </div>
      </div>

      {/* Add Quick Audit / Clinical Note */}
      <form onSubmit={handleAddStaffNote} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Clinical Progress Note / Modification Reason</span>
          </label>
          {noteSuccess && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Note appended to Firestore audit log
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="e.g. Consulted with Dr. Jenkins; patient BP rechecked, contact phone updated..."
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            disabled={isSubmittingNote}
          />
          <button
            type="submit"
            disabled={isSubmittingNote || !newNote.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmittingNote ? 'Saving...' : 'Log Entry'}</span>
          </button>
        </div>
      </form>

      {/* Timeline display */}
      {loading ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Querying Firestore activity timestamp index...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No activity logs found for this filter</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Any revisions to patient demographics, clinical notes, or phone details will be recorded here automatically.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredLogs.map((log) => {
            const { datePart, timePart } = formatTimestamp(log.timestamp);
            return (
              <div key={log.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[1.375rem] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 group-hover:scale-110 transition-transform" />

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs hover:border-slate-300 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.actorName}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{datePart}</span>
                      {timePart && <span className="text-slate-500 font-medium">({timePart})</span>}
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {log.summary}
                  </p>

                  {/* Changed fields pills */}
                  {log.changedFields && log.changedFields.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Modified Fields:</span>
                      {log.changedFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-100 text-slate-700 rounded border border-slate-200"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
