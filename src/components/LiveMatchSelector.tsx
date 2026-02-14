'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    AlertCircle,
    Wifi,
    MapPin,
    Trophy,
} from 'lucide-react';
import type { Match, InningsData } from '@/types';
import { getLiveMatches, mapMatchToDls } from '@/lib/api';

interface LiveMatchSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: InningsData) => void;
    onError: (message: string) => void;
}

export default function LiveMatchSelector({
    isOpen,
    onClose,
    onSelect,
    onError,
}: LiveMatchSelectorProps) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMatch, setLoadingMatch] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchMatches();
        }
        return () => {
            setMatches([]);
            setError(null);
        };
    }, [isOpen]);

    async function fetchMatches() {
        setLoading(true);
        setError(null);
        try {
            const data = await getLiveMatches();
            setMatches(data);
            if (data.length === 0) {
                setError('No live ODI or T20 matches at the moment.');
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error && err.message === 'RAPIDAPI_KEY_MISSING'
                    ? 'API key not configured. Please add your RapidAPI key to .env.local'
                    : 'Could not fetch live data. Please enter manually.';
            setError(message);
            onError(message);
        } finally {
            setLoading(false);
        }
    }

    function handleSelectMatch(match: Match) {
        const data = mapMatchToDls(match);

        if (!data) {
            onError('No scorecard data available for this match. Please enter data manually.');
            onClose();
            return;
        }

        onSelect(data);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-700 to-green-600">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Wifi className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Live Matches</h2>
                            <p className="text-xs text-green-100">
                                Select a match to auto-fill
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <p className="text-sm">Fetching live matches…</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <AlertCircle className="w-8 h-8 mb-3 text-amber-400" />
                            <p className="text-sm text-center text-gray-500">{error}</p>
                            <button
                                onClick={fetchMatches}
                                className="mt-4 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        matches.map((match) => (
                            <button
                                key={match.matchId}
                                onClick={() => handleSelectMatch(match)}
                                disabled={loadingMatch !== null}
                                className="w-full text-left p-4 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl transition-all duration-150 group disabled:opacity-50"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        {/* Teams */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-base">
                                                {match.team1.teamSName}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400">
                                                vs
                                            </span>
                                            <span className="font-bold text-gray-900 text-base">
                                                {match.team2.teamSName}
                                            </span>
                                        </div>

                                        {/* Score summary */}
                                        {match.scoreCard && (
                                            <div className="flex gap-4 mb-2">
                                                {match.scoreCard.inngs1 && (
                                                    <span className="text-sm font-mono font-semibold text-green-700">
                                                        {match.scoreCard.inngs1.runs}/
                                                        {match.scoreCard.inngs1.wickets}
                                                        <span className="text-xs text-gray-400 ml-1">
                                                            ({match.scoreCard.inngs1.overs} ov)
                                                        </span>
                                                    </span>
                                                )}
                                                {match.scoreCard.inngs2 && (
                                                    <span className="text-sm font-mono font-semibold text-blue-700">
                                                        {match.scoreCard.inngs2.runs}/
                                                        {match.scoreCard.inngs2.wickets}
                                                        <span className="text-xs text-gray-400 ml-1">
                                                            ({match.scoreCard.inngs2.overs} ov)
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Meta */}
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Trophy className="w-3 h-3" />
                                                {match.matchFormat} • {match.matchDesc}
                                            </span>
                                            {match.venueInfo?.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {match.venueInfo.city}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                            {match.status}
                                        </p>
                                    </div>

                                    {/* Loading indicator */}
                                    {loadingMatch === match.matchId && (
                                        <Loader2 className="w-5 h-5 text-green-600 animate-spin flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
}
