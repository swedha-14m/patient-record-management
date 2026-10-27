import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Users, PieChart as PieChartIcon, BarChart3, Activity, HeartPulse } from 'lucide-react';
import { Patient } from '../types';

interface DemographicsChartsProps {
  patients: Patient[];
}

const GENDER_COLORS: Record<string, string> = {
  Male: '#2563EB',   // Blue 600
  Female: '#EC4899', // Pink 500
  Other: '#8B5CF6',  // Purple 500
  Unknown: '#94A3B8' // Slate 400
};

export const DemographicsCharts: React.FC<DemographicsChartsProps> = ({ patients }) => {
  // 1. Calculate Age Distribution
  const ageDistribution = useMemo(() => {
    const brackets = [
      { key: '0-17', bracket: '0-17 yrs', category: 'Pediatric', min: 0, max: 17, count: 0 },
      { key: '18-35', bracket: '18-35 yrs', category: 'Young Adult', min: 18, max: 35, count: 0 },
      { key: '36-50', bracket: '36-50 yrs', category: 'Adult', min: 36, max: 50, count: 0 },
      { key: '51-65', bracket: '51-65 yrs', category: 'Middle Age', min: 51, max: 65, count: 0 },
      { key: '65+', bracket: '65+ yrs', category: 'Geriatric', min: 66, max: 150, count: 0 },
    ];

    patients.forEach(patient => {
      const age = Number(patient.age);
      if (!isNaN(age)) {
        const found = brackets.find(b => age >= b.min && age <= b.max);
        if (found) {
          found.count += 1;
        } else if (age > 65) {
          brackets[brackets.length - 1].count += 1;
        }
      }
    });

    return brackets;
  }, [patients]);

  // 2. Calculate Gender Split
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {
      Male: 0,
      Female: 0,
      Other: 0
    };

    patients.forEach(p => {
      const g = p.gender || 'Other';
      if (counts[g] !== undefined) {
        counts[g] += 1;
      } else {
        counts['Other'] += 1;
      }
    });

    const total = patients.length;
    return Object.entries(counts)
      .filter(([_, value]) => total === 0 || value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: GENDER_COLORS[name] || '#64748b'
      }));
  }, [patients]);

  // 3. Demographic Summary KPIs
  const metrics = useMemo(() => {
    if (patients.length === 0) {
      return {
        avgAge: 0,
        pediatricCount: 0,
        geriatricCount: 0,
        predominantGender: 'N/A'
      };
    }

    const totalAge = patients.reduce((acc, p) => acc + (Number(p.age) || 0), 0);
    const avgAge = Math.round(totalAge / patients.length);

    const pediatricCount = patients.filter(p => Number(p.age) <= 17).length;
    const geriatricCount = patients.filter(p => Number(p.age) >= 65).length;

    const highestGender = [...genderData].sort((a, b) => b.value - a.value)[0]?.name || 'N/A';

    return {
      avgAge,
      pediatricCount,
      geriatricCount,
      predominantGender: highestGender
    };
  }, [patients, genderData]);

  // Custom Bar Chart Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = patients.length || 1;
      const pct = Math.round((data.count / total) * 100);
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs border border-slate-700">
          <div className="font-semibold text-blue-300">{data.bracket}</div>
          <div className="text-slate-300 text-[11px]">{data.category}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold text-white">{data.count}</span>
            <span className="text-slate-400">patient{data.count !== 1 ? 's' : ''} ({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Chart Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs border border-slate-700">
          <div className="font-semibold flex items-center gap-1.5" style={{ color: data.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold text-white">{data.value}</span>
            <span className="text-slate-400">({data.percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">Patient Demographics Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time population age distribution and gender stratification from Firestore
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
            <span className="text-slate-400 mr-1.5">Mean Age:</span>
            <span className="font-bold text-slate-900">{metrics.avgAge} yrs</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium">
            <span className="text-blue-500 mr-1.5">Dominant:</span>
            <span className="font-bold">{metrics.predominantGender}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-medium">
            <span className="text-purple-500 mr-1.5">Geriatric (65+):</span>
            <span className="font-bold">{metrics.geriatricCount}</span>
          </div>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-12 px-4 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Patient Records in Database</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Demographic charts will populate dynamically once patient records are registered or seeded into Firestore.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Age Distribution Bar Chart (7 cols on large screens) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-slate-50/60 p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Age Group Distribution
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {patients.length} Registered Patients
              </span>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="bracket"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Micro breakdown pills below bar chart */}
            <div className="grid grid-cols-5 gap-1.5 pt-3 mt-2 border-t border-slate-200 text-center">
              {ageDistribution.map(bracket => (
                <div key={bracket.key} className="bg-white py-1 px-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 truncate">{bracket.category}</div>
                  <div className="text-xs font-bold text-slate-800">{bracket.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Gender Stratification Donut Chart (5 cols on large screens) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-50/60 p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Gender Stratification
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Split Ratio</span>
            </div>

            <div className="w-full h-48 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-slate-800">{patients.length}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total</span>
              </div>
            </div>

            {/* Gender Legend Cards */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              {genderData.map(item => (
                <div
                  key={item.name}
                  className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{item.value}</span>
                    <span className="text-slate-400 font-medium text-[11px] w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
