import { describe, it, expect } from 'vitest';
import {
  evaluateRequirement,
  hasVerifiedNonMatch,
  countVerifiedMatches,
  compareCandidates,
  deriveMatchStatus,
  deriveTopLevelStatus,
} from '@machina/core';

describe('evaluateRequirement', () => {
  it('returns UNKNOWN when there is no approved value', () => {
    const result = evaluateRequirement({}, { attribute: 'surface', value: 'road' });
    expect(result.status).toBe('UNKNOWN');
  });

  it('returns UNKNOWN when the approved entry has a null value', () => {
    const result = evaluateRequirement(
      { surface: { value: null, visibility: 'AGENT_VISIBLE' } },
      { attribute: 'surface', value: 'road' }
    );
    expect(result.status).toBe('UNKNOWN');
  });

  it('returns VERIFIED_MATCH when the approved value equals the requested value', () => {
    const result = evaluateRequirement(
      { surface: { value: 'road', visibility: 'AGENT_VISIBLE' } },
      { attribute: 'surface', value: 'road' }
    );
    expect(result.status).toBe('VERIFIED_MATCH');
  });

  it('returns VERIFIED_NON_MATCH when the approved value differs — not the same as UNKNOWN', () => {
    const result = evaluateRequirement(
      { surface: { value: 'trail', visibility: 'AGENT_VISIBLE' } },
      { attribute: 'surface', value: 'road' }
    );
    expect(result.status).toBe('VERIFIED_NON_MATCH');
  });

  it('CONTROL: still uses the true value for MATCHING_ONLY (matching sees everything)', () => {
    const result = evaluateRequirement(
      { surface: { value: 'road', visibility: 'MATCHING_ONLY' } },
      { attribute: 'surface', value: 'road' }
    );
    expect(result.status).toBe('VERIFIED_MATCH');
  });

  it('CONTROL: treats INTERNAL_ONLY as unavailable even for matching itself', () => {
    const result = evaluateRequirement(
      { surface: { value: 'road', visibility: 'INTERNAL_ONLY' } },
      { attribute: 'surface', value: 'road' }
    );
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('hasVerifiedNonMatch / countVerifiedMatches', () => {
  it('detects a disqualifying non-match among otherwise-fine requirements', () => {
    const results = [
      { attribute: 'surface', requested_value: 'road', status: 'VERIFIED_MATCH' as const },
      { attribute: 'width', requested_value: 'wide', status: 'VERIFIED_NON_MATCH' as const },
    ];
    expect(hasVerifiedNonMatch(results)).toBe(true);
    expect(countVerifiedMatches(results)).toBe(1);
  });

  it('is false when every requirement is a match or unknown', () => {
    const results = [
      { attribute: 'surface', requested_value: 'road', status: 'VERIFIED_MATCH' as const },
      { attribute: 'width', requested_value: 'wide', status: 'UNKNOWN' as const },
    ];
    expect(hasVerifiedNonMatch(results)).toBe(false);
  });
});

describe('compareCandidates', () => {
  it('ranks higher verified-match count first, regardless of similarity', () => {
    const strongMatchLowSimilarity = { verifiedCount: 3, similarity: 0.1 };
    const weakMatchHighSimilarity = { verifiedCount: 1, similarity: 0.9 };
    const sorted = [weakMatchHighSimilarity, strongMatchLowSimilarity].sort(compareCandidates);
    expect(sorted[0]).toBe(strongMatchLowSimilarity);
  });

  it('uses similarity only as a tiebreak when verified-match counts are equal', () => {
    const higherSimilarity = { verifiedCount: 2, similarity: 0.8 };
    const lowerSimilarity = { verifiedCount: 2, similarity: 0.3 };
    const sorted = [lowerSimilarity, higherSimilarity].sort(compareCandidates);
    expect(sorted[0]).toBe(higherSimilarity);
  });
});

describe('deriveMatchStatus', () => {
  it('is VERIFIED only when every requirement is a verified match', () => {
    expect(deriveMatchStatus([{ attribute: 'a', requested_value: 'x', status: 'VERIFIED_MATCH' }])).toBe('VERIFIED');
  });

  it('is PARTIAL when some requirements are unknown', () => {
    expect(
      deriveMatchStatus([
        { attribute: 'a', requested_value: 'x', status: 'VERIFIED_MATCH' },
        { attribute: 'b', requested_value: 'y', status: 'UNKNOWN' },
      ])
    ).toBe('PARTIAL');
  });
});

describe('deriveTopLevelStatus', () => {
  it('is INSUFFICIENT_DATA when nothing was verified anywhere but requirements existed', () => {
    expect(deriveTopLevelStatus(['PARTIAL', 'PARTIAL'], false, 2)).toBe('INSUFFICIENT_DATA');
  });

  it('is VERIFIED when at least one candidate is fully verified', () => {
    expect(deriveTopLevelStatus(['PARTIAL', 'VERIFIED'], true, 2)).toBe('VERIFIED');
  });

  it('is PARTIAL when something verified but nothing fully verified', () => {
    expect(deriveTopLevelStatus(['PARTIAL', 'PARTIAL'], true, 2)).toBe('PARTIAL');
  });
});
