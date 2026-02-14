import type { Match, InningsData, ScorecardResponse } from '@/types';

const RAPID_API_HOST = 'cricbuzz-cricket.p.rapidapi.com';

function getHeaders(): HeadersInit {
    const key = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    if (!key || key === 'your_rapidapi_key_here') {
        throw new Error('RAPIDAPI_KEY_MISSING');
    }
    return {
        'x-rapidapi-key': key,
        'x-rapidapi-host': RAPID_API_HOST,
    };
}

// ─── Fetch live matches ────────────────────────────────────────────
export async function getLiveMatches(): Promise<Match[]> {
    const res = await fetch(`https://${RAPID_API_HOST}/matches/v1/live`, {
        headers: getHeaders(),
        next: { revalidate: 0 },
    });

    if (!res.ok) {
        throw new Error(`API_ERROR_${res.status}`);
    }

    const data = await res.json();

    // The Cricbuzz API returns { typeMatches: [ { matchType, seriesMatches: [...] } ] }
    const matches: Match[] = [];

    const typeMatches = data?.typeMatches ?? [];
    for (const typeMatch of typeMatches) {
        const seriesMatches = typeMatch?.seriesMatches ?? [];
        for (const series of seriesMatches) {
            const seriesAdWrapper = series?.seriesAdWrapper ?? series;
            const matchList = seriesAdWrapper?.matches ?? [];
            for (const m of matchList) {
                const info = m?.matchInfo;
                if (!info) continue;

                // Only include ODI and T20 (formats where DLS applies)
                const format = (info.matchFormat ?? '').toUpperCase();
                if (format !== 'ODI' && format !== 'T20') continue;

                const match: Match = {
                    matchId: info.matchId,
                    matchDesc: info.matchDesc ?? '',
                    matchFormat: format,
                    state: info.state ?? '',
                    status: info.status ?? '',
                    team1: {
                        teamId: info.team1?.teamId ?? 0,
                        teamSName: info.team1?.teamSName ?? 'TBA',
                        teamName: info.team1?.teamName ?? 'TBA',
                    },
                    team2: {
                        teamId: info.team2?.teamId ?? 0,
                        teamSName: info.team2?.teamSName ?? 'TBA',
                        teamName: info.team2?.teamName ?? 'TBA',
                    },
                    seriesName: series?.seriesAdWrapper?.seriesName ?? series?.seriesName ?? '',
                    venueInfo: {
                        ground: info.venueInfo?.ground ?? '',
                        city: info.venueInfo?.city ?? '',
                    },
                };

                // Attach score if available
                if (m?.matchScore) {
                    match.scoreCard = {
                        inngs1: m.matchScore.team1Score?.inngs1 ?? undefined,
                        inngs2: m.matchScore.team2Score?.inngs1 ?? undefined,
                    };
                }

                matches.push(match);
            }
        }
    }

    return matches;
}

// ─── Extract DLS-ready data directly from a Match object ───────────
// The live matches endpoint already returns runs/wickets/overs,
// so we don't need a second API call to hscard.
export function mapMatchToDls(match: Match): InningsData | null {
    try {
        const inngs1 = match.scoreCard?.inngs1;
        if (!inngs1) return null;

        const runs = inngs1.runs ?? 0;
        const wickets = inngs1.wickets ?? 0;
        const overs = inngs1.overs ?? 0;
        const teamName = match.team1.teamSName ?? match.team1.teamName ?? 'Unknown';
        const totalOvers = match.matchFormat === 'T20' ? 20 : 50;

        return { runs, wickets, overs, teamName, totalOvers };
    } catch {
        return null;
    }
}

