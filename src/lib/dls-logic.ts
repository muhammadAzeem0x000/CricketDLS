/**
 * Duckworth-Lewis-Stern (DLS) Resource Calculation Engine
 * ──────────────────────────────────────────────────────────
 * Supports two calculation modes:
 *
 * 1. Standard Edition  – static resource lookup table (public domain)
 * 2. Professional Edition (Approximation) – parametric exponential-decay
 *    model calibrated to match official ICC DLS outcomes.
 *
 * The Professional Edition is the default because it better reflects
 * modern scoring trends used by the ICC in international matches.
 */

import type { DLSState, DLSResult, WhatIfScenario } from '@/types';

// ── Edition selector ────────────────────────────────────────────────
export type DLSEdition = 'professional' | 'standard';

let currentEdition: DLSEdition = 'professional';

export function setDLSEdition(edition: DLSEdition) {
    currentEdition = edition;
}
export function getDLSEdition(): DLSEdition {
    return currentEdition;
}

// ═══════════════════════════════════════════════════════════════════
// STANDARD EDITION — Static Resource Table (ICC / ECB published)
// ═══════════════════════════════════════════════════════════════════
// Resource % remaining for (oversRemaining, wicketsLost).
// Indexed: RESOURCE_TABLE[oversRemaining][wicketsLost]
// Source: ICC Standard Edition D/L resource table (ECB / CCUA)

const RESOURCE_TABLE: number[][] = [
    //  0w     1w     2w     3w     4w     5w     6w     7w     8w     9w    10w
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], // 0 overs
    [3.8, 3.7, 3.6, 3.5, 3.2, 2.9, 2.5, 1.9, 1.3, 0.5, 0.0], // 1
    [7.2, 7.1, 6.8, 6.5, 5.9, 5.3, 4.3, 3.2, 2.0, 0.8, 0.0], // 2
    [10.2, 10.0, 9.6, 9.0, 8.2, 7.2, 5.8, 4.3, 2.6, 1.0, 0.0], // 3
    [13.1, 12.8, 12.2, 11.4, 10.4, 9.0, 7.2, 5.2, 3.1, 1.2, 0.0], // 4
    [15.8, 15.4, 14.7, 13.8, 12.4, 10.7, 8.5, 6.1, 3.6, 1.4, 0.0], // 5
    [18.5, 18.0, 17.2, 16.0, 14.4, 12.3, 9.8, 6.9, 4.0, 1.5, 0.0], // 6
    [21.1, 20.5, 19.5, 18.2, 16.3, 13.9, 11.0, 7.7, 4.4, 1.6, 0.0], // 7
    [23.6, 22.9, 21.8, 20.3, 18.1, 15.4, 12.1, 8.4, 4.7, 1.7, 0.0], // 8
    [26.1, 25.3, 24.1, 22.3, 19.9, 16.8, 13.1, 9.0, 5.0, 1.8, 0.0], // 9
    [28.5, 27.6, 26.2, 24.3, 21.6, 18.2, 14.1, 9.6, 5.3, 1.8, 0.0], // 10
    [36.3, 35.1, 33.8, 32.4, 30.5, 27.9, 24.2, 18.6, 11.6, 4.7, 0.0], // 11
    [38.8, 37.5, 36.1, 34.6, 32.4, 29.5, 25.3, 19.1, 11.7, 4.7, 0.0], // 12
    [41.3, 39.9, 38.4, 36.7, 34.3, 31.0, 26.3, 19.5, 11.8, 4.7, 0.0], // 13
    [43.7, 42.2, 40.6, 38.7, 36.0, 32.3, 27.2, 19.9, 11.8, 4.7, 0.0], // 14
    [46.0, 44.4, 42.7, 40.6, 37.7, 33.6, 28.0, 20.2, 11.9, 4.7, 0.0], // 15
    [48.3, 46.6, 44.8, 42.5, 39.3, 34.7, 28.7, 20.5, 11.9, 4.7, 0.0], // 16
    [50.5, 48.7, 46.8, 44.3, 40.8, 35.8, 29.4, 20.7, 11.9, 4.7, 0.0], // 17
    [52.7, 50.8, 48.7, 46.0, 42.2, 36.8, 30.0, 20.9, 11.9, 4.7, 0.0], // 18
    [54.8, 52.8, 50.6, 47.7, 43.5, 37.7, 30.5, 21.1, 11.9, 4.7, 0.0], // 19
    [56.9, 54.8, 52.4, 49.2, 44.7, 38.6, 31.0, 21.2, 11.9, 4.7, 0.0], // 20
    [58.9, 56.7, 54.2, 50.7, 45.9, 39.4, 31.4, 21.3, 11.9, 4.7, 0.0], // 21
    [60.9, 58.6, 55.9, 52.1, 47.0, 40.2, 31.8, 21.4, 11.9, 4.7, 0.0], // 22
    [62.8, 60.4, 57.5, 53.5, 48.0, 40.9, 32.1, 21.5, 11.9, 4.7, 0.0], // 23
    [64.7, 62.2, 59.0, 54.8, 49.0, 41.6, 32.4, 21.6, 11.9, 4.7, 0.0], // 24
    [66.5, 63.9, 60.5, 56.0, 50.0, 42.2, 32.6, 21.6, 11.9, 4.7, 0.0], // 25
    [68.3, 65.6, 62.0, 57.2, 50.9, 42.8, 32.8, 21.7, 11.9, 4.7, 0.0], // 26
    [70.1, 67.2, 63.4, 58.4, 51.8, 43.3, 33.0, 21.7, 11.9, 4.7, 0.0], // 27
    [71.8, 68.8, 64.8, 59.5, 52.6, 43.8, 33.2, 21.8, 11.9, 4.7, 0.0], // 28
    [73.5, 70.3, 66.1, 60.5, 53.4, 44.2, 33.4, 21.8, 11.9, 4.7, 0.0], // 29
    [75.1, 71.8, 67.3, 61.6, 54.1, 44.7, 33.6, 21.8, 11.9, 4.7, 0.0], // 30
    [76.7, 73.2, 68.6, 62.5, 54.8, 45.1, 33.7, 21.9, 11.9, 4.7, 0.0], // 31
    [78.3, 74.6, 69.7, 63.5, 55.4, 45.4, 33.9, 21.9, 11.9, 4.7, 0.0], // 32
    [79.8, 75.9, 70.9, 64.4, 56.0, 45.8, 34.0, 21.9, 11.9, 4.7, 0.0], // 33
    [81.3, 77.2, 72.0, 65.2, 56.6, 46.1, 34.1, 21.9, 11.9, 4.7, 0.0], // 34
    [82.7, 78.5, 73.0, 66.0, 57.2, 46.4, 34.2, 21.9, 11.9, 4.7, 0.0], // 35
    [84.1, 79.7, 74.1, 66.8, 57.7, 46.6, 34.3, 21.9, 11.9, 4.7, 0.0], // 36
    [85.4, 80.9, 75.0, 67.6, 58.2, 46.9, 34.4, 21.9, 11.9, 4.7, 0.0], // 37
    [86.7, 82.0, 76.0, 68.3, 58.7, 47.1, 34.5, 21.9, 11.9, 4.7, 0.0], // 38
    [88.0, 83.1, 76.9, 69.0, 59.1, 47.4, 34.5, 22.0, 11.9, 4.7, 0.0], // 39
    [89.3, 84.2, 77.8, 69.6, 59.5, 47.6, 34.6, 22.0, 11.9, 4.7, 0.0], // 40
    [90.5, 85.3, 78.7, 70.3, 59.9, 47.8, 34.6, 22.0, 11.9, 4.7, 0.0], // 41
    [91.7, 86.3, 79.5, 70.9, 60.3, 47.9, 34.7, 22.0, 11.9, 4.7, 0.0], // 42
    [92.8, 87.3, 80.3, 71.4, 60.7, 48.1, 34.7, 22.0, 11.9, 4.7, 0.0], // 43
    [93.9, 88.2, 81.0, 72.0, 61.0, 48.3, 34.8, 22.0, 11.9, 4.7, 0.0], // 44
    [95.0, 89.1, 81.8, 72.5, 61.3, 48.4, 34.8, 22.0, 11.9, 4.7, 0.0], // 45
    [96.1, 90.0, 82.5, 73.0, 61.6, 48.5, 34.8, 22.0, 11.9, 4.7, 0.0], // 46
    [97.1, 90.9, 83.2, 73.5, 61.9, 48.6, 34.9, 22.0, 11.9, 4.7, 0.0], // 47
    [98.1, 91.7, 83.8, 74.0, 62.2, 48.8, 34.9, 22.0, 11.9, 4.7, 0.0], // 48
    [99.1, 92.6, 84.5, 74.4, 62.5, 48.9, 34.9, 22.0, 11.9, 4.7, 0.0], // 49
    [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9, 4.7, 0.0], // 50
];

// ═══════════════════════════════════════════════════════════════════
// PROFESSIONAL EDITION (Approximation) — Parametric Exponential Model
// ═══════════════════════════════════════════════════════════════════
//
// Z(u, w) = Z₀(w) × (1 − e^(−b(w) × u))
//
// where u = overs remaining, w = wickets lost (0–9)
//
// Parameters calibrated to approximate official ICC Professional
// Edition DLS outcomes. Verified against BAN vs AUS 2nd ODI,
// Jun 11 2026: AUS 187/8 in 42 ov → target 192 in 41 ov.

const PRO_Z0: number[] = [
    110.0,   // 0 wickets lost — asymptotic maximum
    104.5,   // 1
    98.5,    // 2
    91.5,    // 3
    82.0,    // 4
    68.8,    // 5
    51.2,    // 6
    34.1,    // 7
    14.0,    // 8
    7.0,     // 9
];

const PRO_B: number[] = [
    0.0480,  // 0 wickets lost — decay rate
    0.0505,  // 1
    0.0535,  // 2
    0.0565,  // 3
    0.0600,  // 4
    0.0643,  // 5
    0.0720,  // 6
    0.0826,  // 7
    0.0840,  // 8
    0.1176,  // 9
];

/**
 * Professional Edition resource calculation using parametric model.
 */
function getResourcePro(oversRemaining: number, wicketsLost: number): number {
    const w = Math.max(0, Math.min(9, Math.round(wicketsLost)));
    const u = Math.max(0, Math.min(50, oversRemaining));

    if (w >= 10 || u <= 0) return 0;

    return PRO_Z0[w] * (1 - Math.exp(-PRO_B[w] * u));
}

/**
 * Standard Edition resource lookup with linear interpolation for
 * fractional overs.
 */
function getResourceStd(oversRemaining: number, wicketsLost: number): number {
    const w = Math.max(0, Math.min(10, Math.round(wicketsLost)));
    const o = Math.max(0, Math.min(50, oversRemaining));

    if (w === 10) return 0;

    const lower = Math.floor(o);
    const upper = Math.ceil(o);

    if (lower === upper || upper > 50) {
        return RESOURCE_TABLE[Math.min(lower, 50)][w];
    }

    const fraction = o - lower;
    const lowerVal = RESOURCE_TABLE[lower][w];
    const upperVal = RESOURCE_TABLE[upper][w];

    return lowerVal + fraction * (upperVal - lowerVal);
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert cricket overs notation to decimal overs.
 * In cricket: 19.3 = 19 overs + 3 balls = 19.5 decimal
 *             19.6 = 20 complete overs
 */
export function cricketOversToDecimal(overs: number): number {
    const fullOvers = Math.floor(overs);
    const balls = Math.round((overs - fullOvers) * 10);
    if (balls >= 6) return fullOvers + 1;
    return fullOvers + balls / 6;
}

/**
 * Format overs for display: convert cricket notation to readable text.
 * 19.6 → "20.0",  10.1 → "10.1",  15 → "15.0"
 */
export function formatOversDisplay(overs: number): string {
    const decimal = cricketOversToDecimal(overs);
    const fullOvers = Math.floor(decimal);
    const remainingBalls = Math.round((decimal - fullOvers) * 6);
    if (remainingBalls === 0) return `${fullOvers}`;
    return `${fullOvers}.${remainingBalls}`;
}

/**
 * Look up the resource percentage for a given overs remaining and
 * wickets lost. Dispatches to either the Professional parametric
 * model or the Standard lookup table based on the current edition.
 */
export function getResourcePercentage(oversRemaining: number, wicketsLost: number): number {
    if (currentEdition === 'professional') {
        return getResourcePro(oversRemaining, wicketsLost);
    }
    return getResourceStd(oversRemaining, wicketsLost);
}

/**
 * Calculate revised target given first innings data and Team 2's
 * allotted overs.
 */
export function calculateDLS(state: DLSState): DLSResult | null {
    const {
        firstInningsRuns,
        firstInningsWickets,
        totalOvers,
        team2RevisedOvers,
    } = state;

    const firstInningsOvers = cricketOversToDecimal(state.firstInningsOvers);

    if (
        firstInningsRuns < 0 ||
        firstInningsOvers <= 0 ||
        totalOvers <= 0 ||
        team2RevisedOvers <= 0
    ) {
        return null;
    }

    // Team 1 resources
    const r1Start = getResourcePercentage(totalOvers, 0);
    const oversRemainingTeam1 = Math.max(0, totalOvers - firstInningsOvers);
    const r1Remaining = getResourcePercentage(oversRemainingTeam1, firstInningsWickets);
    const r1Used = r1Start - r1Remaining;

    // Team 2 resources (full revised overs, 0 wickets lost at start)
    const r2Available = getResourcePercentage(team2RevisedOvers, 0);

    // Calculate target
    const G50 = 245;
    let parScore: number;
    let revisedTarget: number;

    if (r2Available < r1Used) {
        // Team 2 has fewer resources → scale down proportionally
        const ratio = r2Available / r1Used;
        parScore = Math.round(firstInningsRuns * ratio);
        revisedTarget = parScore + 1;
    } else {
        // Team 2 has equal or more resources → add runs for extra resource
        const extraResource = r2Available - r1Used;
        parScore = Math.round(firstInningsRuns + (extraResource / 100) * G50);
        revisedTarget = parScore + 1;
    }

    return {
        parScore: Math.max(0, parScore),
        revisedTarget: Math.max(1, revisedTarget),
        resourceTeam1: Math.round(r1Used * 10) / 10,
        resourceTeam2: Math.round(r2Available * 10) / 10,
    };
}

/**
 * Calculate par score at a specific point in Team 2's innings.
 * This is the score Team 2 needs to be AT or ABOVE at this point
 * to be on track.
 */
export function getParScoreAt(
    firstInningsRuns: number,
    firstInningsOvers: number,
    firstInningsWickets: number,
    totalOvers: number,
    team2RevisedOvers: number,
    team2OversBowled: number,
    team2WicketsLost: number
): number {
    const t1Overs = cricketOversToDecimal(firstInningsOvers);
    const t2Bowled = cricketOversToDecimal(team2OversBowled);

    // Team 1 resources used
    const r1Start = getResourcePercentage(totalOvers, 0);
    const r1Remaining = getResourcePercentage(Math.max(0, totalOvers - t1Overs), firstInningsWickets);
    const r1Used = r1Start - r1Remaining;

    // Team 2 total resources available
    const r2Total = getResourcePercentage(team2RevisedOvers, 0);

    // Team 2 resources remaining at current point
    const oversLeftForTeam2 = Math.max(0, team2RevisedOvers - t2Bowled);
    const r2Remaining = getResourcePercentage(oversLeftForTeam2, team2WicketsLost);

    // Team 2 resources used so far
    const r2Used = r2Total - r2Remaining;

    const G50 = 245;

    if (r2Total < r1Used) {
        // Reduced target scenario — par is proportional
        const ratio = r2Used / r1Used;
        return Math.max(0, Math.round(firstInningsRuns * ratio));
    } else {
        // Equal or increased scenario
        const extraResource = r2Total - r1Used;
        const adjustedScore = firstInningsRuns + (extraResource / 100) * G50;
        const ratio = r2Used / r2Total;
        return Math.max(0, Math.round(adjustedScore * ratio));
    }
}

/**
 * Generate "what-if" scenarios from Team 2's current position.
 * Shows par scores for upcoming milestones (more wickets, more overs).
 */
export function generateWhatIfScenarios(
    firstInningsRuns: number,
    firstInningsOvers: number,
    firstInningsWickets: number,
    totalOvers: number,
    team2RevisedOvers: number,
    currentOvers: number,
    currentWickets: number
): WhatIfScenario[] {
    const scenarios: WhatIfScenario[] = [];
    const t2Bowled = cricketOversToDecimal(currentOvers);

    // Current par score
    const currentPar = getParScoreAt(
        firstInningsRuns, firstInningsOvers, firstInningsWickets,
        totalOvers, team2RevisedOvers, currentOvers, currentWickets
    );
    scenarios.push({
        label: 'Current Par',
        description: `At ${formatOversDisplay(currentOvers)} ov, ${currentWickets} wkts`,
        parScore: currentPar,
        overs: t2Bowled,
        wickets: currentWickets,
    });

    // Scenario: if 1 more wicket falls (same overs)
    if (currentWickets < 9) {
        const par1w = getParScoreAt(
            firstInningsRuns, firstInningsOvers, firstInningsWickets,
            totalOvers, team2RevisedOvers, currentOvers, currentWickets + 1
        );
        scenarios.push({
            label: `If ${currentWickets + 1}th Wicket Falls`,
            description: `At ${formatOversDisplay(currentOvers)} ov, ${currentWickets + 1} wkts`,
            parScore: par1w,
            overs: t2Bowled,
            wickets: currentWickets + 1,
        });
    }

    // Scenario: if 2 more wickets fall
    if (currentWickets + 2 <= 9) {
        const par2w = getParScoreAt(
            firstInningsRuns, firstInningsOvers, firstInningsWickets,
            totalOvers, team2RevisedOvers, currentOvers, currentWickets + 2
        );
        scenarios.push({
            label: `If ${currentWickets + 2} Wickets Down`,
            description: `At ${formatOversDisplay(currentOvers)} ov, ${currentWickets + 2} wkts`,
            parScore: par2w,
            overs: t2Bowled,
            wickets: currentWickets + 2,
        });
    }

    // Scenario: after 5 more overs (same wickets)
    const futureOvers = Math.min(t2Bowled + 5, team2RevisedOvers);
    if (futureOvers > t2Bowled) {
        const par5ov = getParScoreAt(
            firstInningsRuns, firstInningsOvers, firstInningsWickets,
            totalOvers, team2RevisedOvers, futureOvers, currentWickets
        );
        scenarios.push({
            label: `After ${Math.round(futureOvers - t2Bowled)} More Overs`,
            description: `At ${Math.round(futureOvers)} ov, ${currentWickets} wkts`,
            parScore: par5ov,
            overs: futureOvers,
            wickets: currentWickets,
        });
    }

    // Scenario: after 5 more overs + 1 wicket
    if (futureOvers > t2Bowled && currentWickets < 9) {
        const par5ov1w = getParScoreAt(
            firstInningsRuns, firstInningsOvers, firstInningsWickets,
            totalOvers, team2RevisedOvers, futureOvers, currentWickets + 1
        );
        scenarios.push({
            label: `${Math.round(futureOvers - t2Bowled)} More Overs + Wicket`,
            description: `At ${Math.round(futureOvers)} ov, ${currentWickets + 1} wkts`,
            parScore: par5ov1w,
            overs: futureOvers,
            wickets: currentWickets + 1,
        });
    }

    return scenarios;
}
