/**
 * Duckworth-Lewis-Stern (DLS) Resource Table & Calculation Engine
 * ──────────────────────────────────────────────────────────────────
 * Uses the Standard Edition resource percentages.
 * Rows  = overs remaining (0–50)
 * Cols  = wickets lost    (0–10)
 */

import type { DLSState, DLSResult, WhatIfScenario } from '@/types';

// Resource % remaining for given (oversRemaining, wicketsLost)
// Indexed: RESOURCE_TABLE[oversRemaining][wicketsLost]
const RESOURCE_TABLE: number[][] = [
    //  0w     1w     2w     3w     4w     5w     6w     7w     8w     9w    10w
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], // 0 overs
    [3.2, 3.2, 3.1, 3.0, 2.8, 2.5, 2.1, 1.5, 0.9, 0.3, 0.0], // 1
    [6.3, 6.2, 6.0, 5.8, 5.4, 4.9, 4.0, 2.9, 1.8, 0.7, 0.0], // 2
    [9.2, 9.1, 8.9, 8.5, 7.9, 7.1, 5.8, 4.3, 2.7, 1.0, 0.0], // 3
    [12.1, 11.9, 11.6, 11.1, 10.3, 9.2, 7.6, 5.6, 3.5, 1.3, 0.0], // 4
    [14.9, 14.7, 14.2, 13.6, 12.6, 11.2, 9.3, 6.9, 4.3, 1.6, 0.0], // 5
    [17.6, 17.3, 16.8, 16.0, 14.8, 13.2, 10.9, 8.1, 5.1, 1.9, 0.0], // 6
    [20.2, 19.9, 19.2, 18.3, 17.0, 15.1, 12.5, 9.3, 5.8, 2.2, 0.0], // 7
    [22.7, 22.3, 21.6, 20.6, 19.1, 16.9, 14.0, 10.4, 6.6, 2.5, 0.0], // 8
    [25.2, 24.7, 23.9, 22.8, 21.1, 18.7, 15.5, 11.5, 7.3, 2.7, 0.0], // 9
    [27.5, 27.0, 26.1, 24.9, 23.0, 20.5, 16.9, 12.6, 7.9, 3.0, 0.0], // 10
    [29.8, 29.3, 28.3, 26.9, 24.9, 22.1, 18.3, 13.6, 8.6, 3.2, 0.0], // 11
    [32.1, 31.5, 30.4, 28.9, 26.8, 23.8, 19.7, 14.6, 9.2, 3.5, 0.0], // 12
    [34.2, 33.6, 32.4, 30.8, 28.6, 25.4, 21.0, 15.6, 9.8, 3.7, 0.0], // 13
    [36.3, 35.6, 34.4, 32.7, 30.3, 26.9, 22.3, 16.5, 10.4, 3.9, 0.0], // 14
    [38.4, 37.6, 36.3, 34.5, 32.0, 28.4, 23.5, 17.5, 11.0, 4.1, 0.0], // 15
    [40.4, 39.6, 38.2, 36.3, 33.6, 29.9, 24.7, 18.4, 11.5, 4.3, 0.0], // 16
    [42.3, 41.5, 40.0, 38.0, 35.2, 31.3, 25.9, 19.2, 12.1, 4.5, 0.0], // 17
    [44.2, 43.3, 41.8, 39.7, 36.8, 32.7, 27.0, 20.1, 12.6, 4.7, 0.0], // 18
    [46.0, 45.1, 43.5, 41.3, 38.3, 34.0, 28.1, 20.9, 13.1, 4.9, 0.0], // 19
    [47.8, 46.8, 45.2, 42.9, 39.7, 35.3, 29.2, 21.7, 13.6, 5.1, 0.0], // 20
    [49.5, 48.5, 46.8, 44.4, 41.1, 36.6, 30.2, 22.5, 14.1, 5.3, 0.0], // 21
    [51.2, 50.1, 48.4, 45.9, 42.5, 37.8, 31.3, 23.2, 14.6, 5.5, 0.0], // 22
    [52.8, 51.7, 49.9, 47.4, 43.9, 39.0, 32.3, 24.0, 15.0, 5.6, 0.0], // 23
    [54.4, 53.3, 51.4, 48.8, 45.2, 40.2, 33.2, 24.7, 15.5, 5.8, 0.0], // 24
    [55.9, 54.8, 52.9, 50.2, 46.5, 41.3, 34.2, 25.4, 15.9, 6.0, 0.0], // 25
    [57.4, 56.3, 54.3, 51.5, 47.7, 42.4, 35.1, 26.1, 16.3, 6.1, 0.0], // 26
    [58.9, 57.7, 55.7, 52.9, 48.9, 43.5, 36.0, 26.7, 16.8, 6.3, 0.0], // 27
    [60.3, 59.1, 57.0, 54.1, 50.1, 44.6, 36.9, 27.4, 17.2, 6.4, 0.0], // 28
    [61.7, 60.4, 58.3, 55.4, 51.3, 45.6, 37.7, 28.0, 17.6, 6.6, 0.0], // 29
    [63.0, 61.7, 59.6, 56.6, 52.4, 46.6, 38.6, 28.6, 18.0, 6.7, 0.0], // 30
    [64.3, 63.0, 60.8, 57.7, 53.5, 47.6, 39.4, 29.2, 18.3, 6.9, 0.0], // 31
    [65.6, 64.2, 62.0, 58.9, 54.6, 48.5, 40.2, 29.8, 18.7, 7.0, 0.0], // 32
    [66.8, 65.5, 63.2, 60.0, 55.6, 49.4, 40.9, 30.4, 19.1, 7.1, 0.0], // 33
    [68.0, 66.7, 64.3, 61.1, 56.6, 50.3, 41.7, 30.9, 19.4, 7.3, 0.0], // 34
    [69.2, 67.8, 65.4, 62.1, 57.6, 51.2, 42.4, 31.5, 19.8, 7.4, 0.0], // 35
    [70.3, 68.9, 66.5, 63.2, 58.5, 52.0, 43.1, 32.0, 20.1, 7.5, 0.0], // 36
    [71.4, 70.0, 67.6, 64.2, 59.4, 52.9, 43.8, 32.5, 20.4, 7.6, 0.0], // 37
    [72.5, 71.1, 68.6, 65.1, 60.3, 53.7, 44.4, 33.0, 20.7, 7.8, 0.0], // 38
    [73.6, 72.1, 69.6, 66.1, 61.2, 54.5, 45.1, 33.5, 21.0, 7.9, 0.0], // 39
    [74.6, 73.1, 70.6, 67.0, 62.1, 55.2, 45.7, 34.0, 21.3, 8.0, 0.0], // 40
    [75.6, 74.1, 71.5, 67.9, 62.9, 56.0, 46.3, 34.4, 21.6, 8.1, 0.0], // 41
    [76.6, 75.1, 72.4, 68.8, 63.7, 56.7, 46.9, 34.9, 21.9, 8.2, 0.0], // 42
    [77.6, 76.0, 73.3, 69.6, 64.5, 57.4, 47.5, 35.3, 22.2, 8.3, 0.0], // 43
    [78.5, 76.9, 74.2, 70.5, 65.3, 58.1, 48.1, 35.7, 22.4, 8.4, 0.0], // 44
    [79.4, 77.8, 75.1, 71.3, 66.1, 58.8, 48.7, 36.1, 22.7, 8.5, 0.0], // 45
    [80.3, 78.7, 75.9, 72.1, 66.8, 59.4, 49.2, 36.6, 22.9, 8.6, 0.0], // 46
    [81.2, 79.5, 76.7, 72.9, 67.5, 60.1, 49.7, 36.9, 23.2, 8.7, 0.0], // 47
    [82.0, 80.3, 77.5, 73.6, 68.2, 60.7, 50.3, 37.3, 23.4, 8.8, 0.0], // 48
    [82.8, 81.1, 78.3, 74.4, 68.9, 61.3, 50.8, 37.7, 23.7, 8.9, 0.0], // 49
    [83.8, 82.0, 79.2, 75.2, 69.7, 62.0, 51.3, 38.1, 23.9, 9.0, 0.0], // 50
];

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
 * Look up the resource percentage for a given overs remaining and wickets lost.
 * Supports fractional overs via linear interpolation.
 */
export function getResourcePercentage(oversRemaining: number, wicketsLost: number): number {
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

/**
 * Calculate revised target given first innings data and Team 2's allotted overs.
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
        const ratio = r2Available / r1Used;
        parScore = Math.round(firstInningsRuns * ratio);
        revisedTarget = parScore + 1;
    } else {
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
 * This is the score Team 2 needs to be AT or ABOVE at this point to be on track.
 *
 * Par = Team1Score × (resources used by Team2 so far) / (Team1 resources used)
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
