'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Wifi,
  ChevronRight,
  BarChart3,
  CloudRain,
  Trophy,
  Zap,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
} from 'lucide-react';
import LiveMatchSelector from '@/components/LiveMatchSelector';
import Toast from '@/components/Toast';
import {
  calculateDLS,
  generateWhatIfScenarios,
  getParScoreAt,
  formatOversDisplay,
} from '@/lib/dls-logic';
import type { DLSState, DLSResult, InningsData, Team2Progress, WhatIfScenario } from '@/types';

const INITIAL_STATE: DLSState = {
  firstInningsRuns: 0,
  firstInningsWickets: 0,
  firstInningsOvers: 50,
  totalOvers: 50,
  team2RevisedOvers: 50,
};

const INITIAL_TEAM2: Team2Progress = {
  runs: 0,
  oversBowled: 0,
  wicketsLost: 0,
};

export default function Home() {
  const [dlsData, setDlsData] = useState<DLSState>(INITIAL_STATE);
  const [team2, setTeam2] = useState<Team2Progress>(INITIAL_TEAM2);
  const [result, setResult] = useState<DLSResult | null>(null);
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const [importedTeam, setImportedTeam] = useState<string | null>(null);

  // Live par score at Team 2's current position
  const currentPar = useMemo(() => {
    if (!result || step < 3) return null;
    return getParScoreAt(
      dlsData.firstInningsRuns,
      dlsData.firstInningsOvers,
      dlsData.firstInningsWickets,
      dlsData.totalOvers,
      dlsData.team2RevisedOvers,
      team2.oversBowled,
      team2.wicketsLost
    );
  }, [result, step, dlsData, team2]);

  // What-if scenarios
  const scenarios: WhatIfScenario[] = useMemo(() => {
    if (!result || step < 3) return [];
    return generateWhatIfScenarios(
      dlsData.firstInningsRuns,
      dlsData.firstInningsOvers,
      dlsData.firstInningsWickets,
      dlsData.totalOvers,
      dlsData.team2RevisedOvers,
      team2.oversBowled,
      team2.wicketsLost
    );
  }, [result, step, dlsData, team2]);

  const handleLiveSelect = useCallback((data: InningsData) => {
    setDlsData((prev) => ({
      ...prev,
      firstInningsRuns: data.runs,
      firstInningsWickets: data.wickets,
      firstInningsOvers: data.overs,
      totalOvers: data.totalOvers,
      team2RevisedOvers: data.totalOvers,
    }));
    setImportedTeam(data.teamName);
    setToast({
      message: `Imported ${data.teamName}: ${data.runs}/${data.wickets} (${formatOversDisplay(data.overs)} ov)`,
      type: 'success',
    });
    setStep(2);
  }, []);

  const handleApiError = useCallback((message: string) => {
    setToast({ message, type: 'error' });
  }, []);

  const handleCalculate = () => {
    const res = calculateDLS(dlsData);
    if (res) {
      setResult(res);
      setTeam2(INITIAL_TEAM2);
      setStep(3);
    } else {
      setToast({ message: 'Invalid inputs. Please check your values.', type: 'error' });
    }
  };

  const handleReset = () => {
    setDlsData(INITIAL_STATE);
    setResult(null);
    setTeam2(INITIAL_TEAM2);
    setStep(1);
    setImportedTeam(null);
  };

  const updateField = (field: keyof DLSState, value: string) => {
    const num = parseFloat(value) || 0;
    setDlsData((prev) => ({ ...prev, [field]: num }));
  };

  const updateTeam2 = (field: keyof Team2Progress, value: string) => {
    const num = parseFloat(value) || 0;
    setTeam2((prev) => ({ ...prev, [field]: num }));
  };

  // Determine ahead/behind status
  const getStatus = () => {
    if (currentPar === null) return null;
    const diff = team2.runs - currentPar;
    if (diff > 0) return { label: 'Ahead', diff: `+${diff}`, color: 'text-green-600', bg: 'bg-green-50 border-green-200', Icon: TrendingUp };
    if (diff < 0) return { label: 'Behind', diff: `${diff}`, color: 'text-red-600', bg: 'bg-red-50 border-red-200', Icon: TrendingDown };
    return { label: 'On Par', diff: '0', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', Icon: Minus };
  };

  const status = getStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <LiveMatchSelector
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleLiveSelect}
        onError={handleApiError}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-md shadow-green-600/20">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">DLS Calculator</h1>
              <p className="text-xs text-gray-400">Duckworth-Lewis-Stern Method</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">Live Sync</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Live Import Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white rounded-2xl font-semibold shadow-lg shadow-red-600/25 transition-all duration-200 active:scale-[0.98]"
        >
          <Wifi className="w-5 h-5" />
          Load from Live Match
          <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
        </button>

        {importedTeam && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
            <Zap className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800">
              Data imported from <span className="font-bold">{importedTeam}</span>&apos;s innings
            </p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => { if (s <= step) setStep(s); }}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {/* ─── Step 1: First Innings ─────────────────────────── */}
        {step >= 1 && (
          <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${step === 1 ? 'ring-2 ring-green-600/20' : ''}`}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Step 1: First Innings</h2>
                <p className="text-xs text-gray-400">Score at the end of first innings</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Format Toggle */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Match Format</label>
                <div className="mt-1.5 flex gap-2">
                  {[50, 20].map((o) => (
                    <button
                      key={o}
                      onClick={() => setDlsData((prev) => ({
                        ...prev,
                        totalOvers: o,
                        firstInningsOvers: o,
                        team2RevisedOvers: o,
                      }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${dlsData.totalOvers === o
                        ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
                    >
                      {o} Overs {o === 50 ? '(ODI)' : '(T20)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoreboard */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                    {importedTeam || 'Team 1'} — First Innings
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-mono font-bold tracking-tight">
                      {dlsData.firstInningsRuns}
                    </span>
                    <span className="text-2xl font-mono text-gray-400">/</span>
                    <span className="text-3xl font-mono font-semibold text-gray-300">
                      {dlsData.firstInningsWickets}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 font-mono">
                    ({formatOversDisplay(dlsData.firstInningsOvers)} overs)
                  </p>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Runs</label>
                  <input
                    type="number" min="0" max="999"
                    value={dlsData.firstInningsRuns || ''}
                    onChange={(e) => updateField('firstInningsRuns', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-3 text-center text-lg font-mono font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Overs</label>
                  <input
                    type="number" min="0" max={dlsData.totalOvers} step="0.1"
                    value={dlsData.firstInningsOvers || ''}
                    onChange={(e) => updateField('firstInningsOvers', e.target.value)}
                    placeholder={String(dlsData.totalOvers)}
                    className="w-full px-3 py-3 text-center text-lg font-mono font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Wickets</label>
                  <input
                    type="number" min="0" max="10"
                    value={dlsData.firstInningsWickets || ''}
                    onChange={(e) => updateField('firstInningsWickets', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-3 text-center text-lg font-mono font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-md shadow-green-600/20"
                >
                  Continue to Interruption
                </button>
              )}
            </div>
          </section>
        )}

        {/* ─── Step 2: Interruption (Simplified) ─────────────── */}
        {step >= 2 && (
          <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${step === 2 ? 'ring-2 ring-green-600/20' : ''}`}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <CloudRain className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Step 2: Rain Interruption</h2>
                <p className="text-xs text-gray-400">How many overs does Team 2 get?</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Enter the revised number of overs Team 2 gets to bat after the rain delay.
                  If no rain, keep this the same as the match format.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Team 2 Revised Overs
                </label>
                <input
                  type="number" min="1" max={dlsData.totalOvers} step="1"
                  value={dlsData.team2RevisedOvers || ''}
                  onChange={(e) => updateField('team2RevisedOvers', e.target.value)}
                  placeholder={String(dlsData.totalOvers)}
                  className="w-full px-4 py-4 text-center text-2xl font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  out of {dlsData.totalOvers} overs
                </p>
              </div>

              {step === 2 && (
                <button
                  onClick={handleCalculate}
                  className="w-full py-3.5 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-green-600/25 active:scale-[0.98]"
                >
                  Calculate DLS Target
                </button>
              )}
            </div>
          </section>
        )}

        {/* ─── Step 3: Par Score Dashboard ────────────────────── */}
        {step === 3 && result && (
          <>
            {/* Revised Target */}
            <section className="bg-gradient-to-br from-green-700 to-green-600 rounded-2xl p-6 text-center shadow-lg shadow-green-600/20">
              <p className="text-xs uppercase tracking-widest text-green-200 mb-2">Revised Target</p>
              <p className="text-5xl font-mono font-bold text-white">{result.revisedTarget}</p>
              <p className="text-sm text-green-200 mt-1">
                runs to win in {dlsData.team2RevisedOvers} overs
              </p>
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-xs text-green-200">Par Score</p>
                  <p className="text-lg font-mono font-bold text-white">{result.parScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-200">Team 1 Res.</p>
                  <p className="text-lg font-mono font-bold text-white">{result.resourceTeam1}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-200">Team 2 Res.</p>
                  <p className="text-lg font-mono font-bold text-white">{result.resourceTeam2}%</p>
                </div>
              </div>
            </section>

            {/* Team 2 Live Progress */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Team 2 Progress</h2>
                  <p className="text-xs text-gray-400">Enter current score to see live par</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Runs</label>
                    <input
                      type="number" min="0" max="999"
                      value={team2.runs || ''}
                      onChange={(e) => updateTeam2('runs', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-3 text-center text-lg font-mono font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Overs</label>
                    <input
                      type="number" min="0" max={dlsData.team2RevisedOvers} step="0.1"
                      value={team2.oversBowled || ''}
                      onChange={(e) => updateTeam2('oversBowled', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-3 text-center text-lg font-mono font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Wickets</label>
                    <input
                      type="number" min="0" max="10"
                      value={team2.wicketsLost || ''}
                      onChange={(e) => updateTeam2('wicketsLost', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-3 text-center text-lg font-mono font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Live Par & Status */}
                {currentPar !== null && team2.oversBowled > 0 && status && (
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${status.bg}`}>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Par Score</p>
                      <p className="text-3xl font-mono font-bold text-gray-900 mt-1">{currentPar}</p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1.5 ${status.color}`}>
                        <status.Icon className="w-5 h-5" />
                        <span className="text-2xl font-mono font-bold">{status.diff}</span>
                      </div>
                      <p className={`text-xs font-semibold mt-0.5 ${status.color}`}>{status.label} par</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* What-If Scenarios */}
            {scenarios.length > 0 && team2.oversBowled > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">What-If Scenarios</h2>
                    <p className="text-xs text-gray-400">Par score projections from here</p>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  {scenarios.map((s, i) => {
                    const isCurrentPar = i === 0;
                    const diff = team2.runs - s.parScore;
                    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                    const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-amber-600';

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isCurrentPar
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100/80'
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isCurrentPar ? 'text-green-800' : 'text-gray-800'}`}>
                            {s.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className={`text-xl font-mono font-bold ${isCurrentPar ? 'text-green-700' : 'text-gray-900'}`}>
                            {s.parScore}
                          </p>
                          <p className={`text-xs font-mono font-semibold ${diffColor}`}>
                            {diffStr}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Calculation
            </button>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400">
          DLS Standard Edition • For reference only — not for official use
        </p>
      </footer>
    </div>
  );
}
