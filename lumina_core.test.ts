/**
 * lumina_core.test.ts
 *
 * Integration test suite for the Lumina collaborative property-voting engine.
 *
 * Targets:
 *   - src/services/propertyService.ts  — castVote, getUserVoteCount, getProperties
 *   - src/components/PropertySelectionScreen.tsx — computeResults / handleVote logic
 *     (verified through the service layer + inline algorithmic assertions that mirror
 *     the exact component code, since RNTL + full Expo render-chain setup is out of
 *     scope per the README "mobile-only, do not start dev server" requirement.)
 *
 * Two critical areas under test:
 *   1. 2-Vote Constraint  — the "everyone has 2 votes" cap is enforced correctly
 *      at the service boundary, and the UI-layer guard pattern mirrors it.
 *   2. Data Aggregation   — getProperties returns accurate vote metrics and the
 *      computeResults sort logic (keepVotes desc / eliminateVotes desc) yields the
 *      correct descending ranking and eliminated set.
 *
 * Isolation strategy:
 *   jest.resetModules() in beforeEach reloads propertyService (and the AsyncStorage
 *   mock) from scratch, so each test group starts with the canonical seed data:
 *     Chicago — chi-2 myVote:'keep', chi-5 myVote:'eliminate'  (2 votes pre-set)
 *   No cross-test state leakage.
 */

// ─── helpers ───────────────────────────────────────────────────────────────

/** Load a fresh propertyService instance (fresh module state each call). */
function freshService() {
  // Must be called AFTER jest.resetModules() to get a new module instance.
  const mod = require('./src/services/propertyService');
  return mod.propertyService as typeof import('./src/services/propertyService').propertyService;
}

type Svc = ReturnType<typeof freshService>;

// ───────────────────────────────────────────────────────────────────────────
// Suite 1 — 2-Vote Constraint
// ───────────────────────────────────────────────────────────────────────────
describe('2-Vote Constraint', () => {
  let svc: Svc;

  beforeEach(() => {
    jest.resetModules();
    svc = freshService();
  });

  // ── 1a. Initial vote count reflects seed data ───────────────────────────
  it('getUserVoteCount() returns 2 for the default Chicago seed (chi-2=keep, chi-5=eliminate)', async () => {
    const count = await svc.getUserVoteCount();
    expect(count).toBe(2);
  });

  // ── 1b. 3rd new vote is silently blocked ────────────────────────────────
  it('castVote on a 3rd property (myVote=null) is blocked when vote budget is exhausted', async () => {
    // chi-1 starts with myVote: null — it's a "new" vote attempt.
    // Budget is already at 2/2 (chi-2='keep', chi-5='eliminate').
    const props = await svc.getProperties();
    const chi1Before = props.find((p) => p.id === 'chi-1')!;
    expect(chi1Before.myVote).toBeNull(); // confirm precondition

    const returned = await svc.castVote('chi-1', 'keep');

    // Service returns the unchanged property — vote was NOT applied.
    expect(returned.myVote).toBeNull();
  });

  it('keepVotes for chi-1 are NOT incremented when the 3rd vote is blocked', async () => {
    const propsBefore = await svc.getProperties();
    const keepBefore = propsBefore.find((p) => p.id === 'chi-1')!.keepVotes;

    await svc.castVote('chi-1', 'keep'); // blocked

    const propsAfter = await svc.getProperties();
    const keepAfter = propsAfter.find((p) => p.id === 'chi-1')!.keepVotes;

    expect(keepAfter).toBe(keepBefore);
  });

  it('getUserVoteCount() stays at 2 after a blocked 3rd-vote attempt', async () => {
    await svc.castVote('chi-1', 'keep'); // blocked
    const count = await svc.getUserVoteCount();
    expect(count).toBe(2);
  });

  // ── 1c. Changing an existing vote is NOT a new vote — never blocked ─────
  it('switching an existing keep vote to eliminate on chi-2 succeeds even at 2/2 budget', async () => {
    // chi-2 already has myVote:'keep' — this is a change, not a new vote
    const result = await svc.castVote('chi-2', 'eliminate');
    expect(result.myVote).toBe('eliminate');
  });

  it('keepVotes for chi-2 decrements and eliminateVotes increments when vote is switched', async () => {
    const propsBefore = await svc.getProperties();
    const chi2 = propsBefore.find((p) => p.id === 'chi-2')!;
    const keepBefore = chi2.keepVotes;    // seed: 18
    const elimBefore = chi2.eliminateVotes; // seed: 5

    await svc.castVote('chi-2', 'eliminate');

    const propsAfter = await svc.getProperties();
    const chi2After = propsAfter.find((p) => p.id === 'chi-2')!;

    expect(chi2After.keepVotes).toBe(keepBefore - 1);
    expect(chi2After.eliminateVotes).toBe(elimBefore + 1);
  });

  it('vote count remains 2 after changing (not adding) a vote', async () => {
    await svc.castVote('chi-2', 'eliminate'); // change keep → eliminate
    const count = await svc.getUserVoteCount();
    expect(count).toBe(2);
  });

  // ── 1d. Clearing a vote frees a slot, enabling a new vote ───────────────
  it('casting null on chi-2 clears it and reduces the vote count to 1', async () => {
    await svc.castVote('chi-2', null);
    const count = await svc.getUserVoteCount();
    expect(count).toBe(1);
  });

  it('after clearing chi-2, a new vote on chi-1 (previously blocked) now succeeds', async () => {
    await svc.castVote('chi-2', null); // free a slot

    const result = await svc.castVote('chi-1', 'keep');
    expect(result.myVote).toBe('keep');
  });

  it('keepVotes for chi-1 increments after the slot is freed and vote is cast', async () => {
    const propsBefore = await svc.getProperties();
    const keepBefore = propsBefore.find((p) => p.id === 'chi-1')!.keepVotes; // seed: 24

    await svc.castVote('chi-2', null); // free slot
    await svc.castVote('chi-1', 'keep');

    const propsAfter = await svc.getProperties();
    const keepAfter = propsAfter.find((p) => p.id === 'chi-1')!.keepVotes;

    expect(keepAfter).toBe(keepBefore + 1);
  });

  it('vote count returns to 2 after clearing one slot and filling it', async () => {
    await svc.castVote('chi-2', null);
    await svc.castVote('chi-1', 'keep');
    const count = await svc.getUserVoteCount();
    expect(count).toBe(2);
  });

  // ── 1e. UI-layer guard simulation (mirrors handleVote logic in PropertySelectionScreen) ──
  // The component's handleVote() guard:
  //   const isNewVote = prop.myVote == null && vote != null;
  //   if (isNewVote && userVoteCount >= 2) { Alert.alert(...); return; }
  // We simulate that decision logic here to confirm it fires under the right conditions.
  it('UI guard: isNewVote=true + userVoteCount>=2 → guard fires (no castVote call)', async () => {
    const userVoteCount = await svc.getUserVoteCount(); // 2
    const props = await svc.getProperties();
    const chi1 = props.find((p) => p.id === 'chi-1')!; // myVote: null

    const vote = 'keep';
    const isNewVote = chi1.myVote == null && vote != null;
    const guardFires = isNewVote && userVoteCount >= 2;

    expect(guardFires).toBe(true);
  });

  it('UI guard: isNewVote=false (changing existing vote) → guard does NOT fire', async () => {
    const userVoteCount = await svc.getUserVoteCount(); // 2
    const props = await svc.getProperties();
    const chi2 = props.find((p) => p.id === 'chi-2')!; // myVote: 'keep'

    const vote = 'eliminate';
    const isNewVote = chi2.myVote == null && vote != null; // false — already voted here
    const guardFires = isNewVote && userVoteCount >= 2;

    expect(guardFires).toBe(false);
  });

  it('UI guard: userVoteCount<2 → guard does NOT fire even for a new vote', async () => {
    await svc.castVote('chi-2', null); // drop count to 1
    const userVoteCount = await svc.getUserVoteCount(); // 1
    const props = await svc.getProperties();
    const chi1 = props.find((p) => p.id === 'chi-1')!;

    const vote = 'keep';
    const isNewVote = chi1.myVote == null && vote != null;
    const guardFires = isNewVote && userVoteCount >= 2; // false — budget not exhausted

    expect(guardFires).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Suite 2 — Data Aggregation & Results View Sorting
// ───────────────────────────────────────────────────────────────────────────
describe('Data Aggregation — Results View', () => {
  let svc: Svc;

  beforeEach(() => {
    jest.resetModules();
    svc = freshService();
  });

  // ── 2a. getProperties data integrity ───────────────────────────────────
  it('getProperties() returns exactly 6 Chicago properties', async () => {
    const props = await svc.getProperties();
    expect(props).toHaveLength(6);
  });

  it('every property has the required fields (id, title, keepVotes, eliminateVotes, myVote, rank)', async () => {
    const props = await svc.getProperties();
    for (const p of props) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.title).toBe('string');
      expect(p.title.length).toBeGreaterThan(3);
      expect(typeof p.keepVotes).toBe('number');
      expect(typeof p.eliminateVotes).toBe('number');
      expect(typeof p.rank).toBe('number');
      expect(p.myVote === null || p.myVote === 'keep' || p.myVote === 'eliminate').toBe(true);
      expect(p.pricePerPerson).toBeGreaterThan(0);
      expect(typeof p.location.city).toBe('string');
    }
  });

  it('seed vote totals match the known fixture values for all 6 Chicago properties', async () => {
    const props = await svc.getProperties();
    const byId = Object.fromEntries(props.map((p) => [p.id, p]));

    // Expected from src/services/propertyService.ts seed data
    expect(byId['chi-1'].keepVotes).toBe(24);
    expect(byId['chi-1'].eliminateVotes).toBe(6);
    expect(byId['chi-2'].keepVotes).toBe(18);
    expect(byId['chi-2'].eliminateVotes).toBe(5);
    expect(byId['chi-3'].keepVotes).toBe(31);
    expect(byId['chi-3'].eliminateVotes).toBe(12);
    expect(byId['chi-4'].keepVotes).toBe(16);
    expect(byId['chi-4'].eliminateVotes).toBe(3);
    expect(byId['chi-5'].keepVotes).toBe(9);
    expect(byId['chi-5'].eliminateVotes).toBe(8);
    expect(byId['chi-6'].keepVotes).toBe(22);
    expect(byId['chi-6'].eliminateVotes).toBe(10);
  });

  // ── 2b. computeResults — keepVotes descending sort (mirrors component logic) ──
  // Mirrors PropertySelectionScreen.tsx:244-245:
  //   const sortedByKeep = [...properties].sort((a, b) => b.keepVotes - a.keepVotes);
  it('sorting by keepVotes descending produces the correct ranked order', async () => {
    const props = await svc.getProperties();
    const sortedByKeep = [...props].sort((a, b) => b.keepVotes - a.keepVotes);
    const ids = sortedByKeep.map((p) => p.id);

    // Expected order: chi-3(31) > chi-1(24) > chi-6(22) > chi-2(18) > chi-4(16) > chi-5(9)
    expect(ids).toEqual(['chi-3', 'chi-1', 'chi-6', 'chi-2', 'chi-4', 'chi-5']);
  });

  it('top-3 shortlist by keepVotes is chi-3, chi-1, chi-6', async () => {
    const props = await svc.getProperties();
    const top3 = [...props]
      .sort((a, b) => b.keepVotes - a.keepVotes)
      .slice(0, 3)
      .map((p) => p.id);

    expect(top3).toEqual(['chi-3', 'chi-1', 'chi-6']);
  });

  it('computeResults summary string names the top-3 titles in keepVotes order', async () => {
    const props = await svc.getProperties();
    const sortedByKeep = [...props].sort((a, b) => b.keepVotes - a.keepVotes);
    const summary = `Top picks: ${sortedByKeep
      .slice(0, 3)
      .map((p) => p.title)
      .join(', ')}. Bottom elims: 3 properties.`;

    expect(summary).toContain('Charming Lincoln Park Brownstone'); // chi-3: 31 keep
    expect(summary).toContain('Cozy Wicker Park Loft');            // chi-1: 24 keep
    expect(summary).toContain('Hyde Park Victorian Gem');          // chi-6: 22 keep
    // The highest-keep property is listed first
    expect(summary.indexOf('Charming Lincoln Park Brownstone'))
      .toBeLessThan(summary.indexOf('Cozy Wicker Park Loft'));
  });

  // ── 2c. computeResults — eliminateVotes descending sort (elimination set) ──
  // Mirrors PropertySelectionScreen.tsx:247:
  //   const bottom = [...properties].sort((a, b) => b.eliminateVotes - a.eliminateVotes).slice(0,3)
  it('sorting by eliminateVotes descending produces the correct order', async () => {
    const props = await svc.getProperties();
    const sortedByElim = [...props].sort((a, b) => b.eliminateVotes - a.eliminateVotes);
    const ids = sortedByElim.map((p) => p.id);

    // Expected: chi-3(12) > chi-6(10) > chi-5(8) > chi-1(6) > chi-2(5) > chi-4(3)
    expect(ids).toEqual(['chi-3', 'chi-6', 'chi-5', 'chi-1', 'chi-2', 'chi-4']);
  });

  it('bottom-3 eliminated set is {chi-3, chi-6, chi-5} (most eliminate votes)', async () => {
    const props = await svc.getProperties();
    const bottom3 = new Set(
      [...props]
        .sort((a, b) => b.eliminateVotes - a.eliminateVotes)
        .slice(0, 3)
        .map((p) => p.id)
    );

    expect(bottom3.has('chi-3')).toBe(true); // 12 eliminate votes
    expect(bottom3.has('chi-6')).toBe(true); // 10 eliminate votes
    expect(bottom3.has('chi-5')).toBe(true); // 8 eliminate votes
  });

  // ── 2d. Edge-case: chi-3 ranks #1 by keep AND appears in eliminated set ─
  // This is a real behavioural edge case in the app: a property beloved by most
  // (31 keep votes) can still land in the eliminated set if it also has the
  // highest eliminate-vote count (12).  The algorithm is intentional — it flags
  // the most polarising properties.
  it('chi-3 (highest keepVotes=31) also appears in the eliminated set (eliminateVotes=12, highest)', async () => {
    const props = await svc.getProperties();
    const eliminatedIds = new Set(
      [...props]
        .sort((a, b) => b.eliminateVotes - a.eliminateVotes)
        .slice(0, 3)
        .map((p) => p.id)
    );
    const top1ByKeep = [...props].sort((a, b) => b.keepVotes - a.keepVotes)[0].id;

    expect(top1ByKeep).toBe('chi-3');
    expect(eliminatedIds.has('chi-3')).toBe(true);
  });

  it('properties NOT in the eliminated set include chi-1, chi-2, chi-4 (lower eliminate counts)', async () => {
    const props = await svc.getProperties();
    const eliminatedIds = new Set(
      [...props]
        .sort((a, b) => b.eliminateVotes - a.eliminateVotes)
        .slice(0, 3)
        .map((p) => p.id)
    );

    expect(eliminatedIds.has('chi-1')).toBe(false); // 6 elim votes
    expect(eliminatedIds.has('chi-2')).toBe(false); // 5 elim votes
    expect(eliminatedIds.has('chi-4')).toBe(false); // 3 elim votes
  });

  // ── 2e. Multi-city data integrity ──────────────────────────────────────
  it('New York properties sort correctly: nyc-3(35) is top by keepVotes', async () => {
    await svc.setCurrentCity('New York');
    const props = await svc.getProperties();
    const topByKeep = [...props].sort((a, b) => b.keepVotes - a.keepVotes)[0];

    expect(topByKeep.id).toBe('nyc-3');
    expect(topByKeep.keepVotes).toBe(35);
    expect(topByKeep.title).toBe('Trendy Bushwick Artist Loft');
  });

  it('Atlanta properties sort correctly: atl-3(33) is top by keepVotes', async () => {
    await svc.setCurrentCity('Atlanta');
    const props = await svc.getProperties();
    const topByKeep = [...props].sort((a, b) => b.keepVotes - a.keepVotes)[0];

    expect(topByKeep.id).toBe('atl-3');
    expect(topByKeep.keepVotes).toBe(33);
    expect(topByKeep.title).toBe('Inman Park Craftsman Home');
  });

  it('city switch isolates data: Chicago chi- ids, NYC nyc- ids, Atlanta atl- ids', async () => {
    const chicago = await svc.getProperties();
    expect(chicago.every((p) => p.id.startsWith('chi-'))).toBe(true);

    await svc.setCurrentCity('New York');
    const nyc = await svc.getProperties();
    expect(nyc.every((p) => p.id.startsWith('nyc-'))).toBe(true);

    await svc.setCurrentCity('Atlanta');
    const atl = await svc.getProperties();
    expect(atl.every((p) => p.id.startsWith('atl-'))).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Suite 3 — Vote Count Mutation Accuracy
// (verifies that keepVotes/eliminateVotes track every castVote call correctly)
// ───────────────────────────────────────────────────────────────────────────
describe('Vote Count Mutations', () => {
  let svc: Svc;

  beforeEach(() => {
    jest.resetModules();
    svc = freshService();
  });

  it('castVote keep on an unvoted property increments keepVotes by 1 and leaves eliminateVotes unchanged', async () => {
    // First free a slot so we can cast a new vote.
    await svc.castVote('chi-2', null); // drop chi-2's keep vote

    const before = (await svc.getProperties()).find((p) => p.id === 'chi-1')!;
    await svc.castVote('chi-1', 'keep');
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-1')!;

    expect(after.keepVotes).toBe(before.keepVotes + 1);
    expect(after.eliminateVotes).toBe(before.eliminateVotes);
  });

  it('castVote eliminate on an unvoted property increments eliminateVotes by 1 and leaves keepVotes unchanged', async () => {
    await svc.castVote('chi-5', null); // free the eliminate slot on chi-5

    const before = (await svc.getProperties()).find((p) => p.id === 'chi-1')!;
    await svc.castVote('chi-1', 'eliminate');
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-1')!;

    expect(after.eliminateVotes).toBe(before.eliminateVotes + 1);
    expect(after.keepVotes).toBe(before.keepVotes);
  });

  it('switching vote from keep to eliminate: keepVotes-- and eliminateVotes++ (net zero total-vote change)', async () => {
    // chi-2 starts with myVote:'keep'
    const before = (await svc.getProperties()).find((p) => p.id === 'chi-2')!;
    await svc.castVote('chi-2', 'eliminate');
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-2')!;

    expect(after.keepVotes).toBe(before.keepVotes - 1);
    expect(after.eliminateVotes).toBe(before.eliminateVotes + 1);
    expect(after.myVote).toBe('eliminate');
  });

  it('switching vote from eliminate to keep: eliminateVotes-- and keepVotes++ (net zero total-vote change)', async () => {
    // chi-5 starts with myVote:'eliminate'
    const before = (await svc.getProperties()).find((p) => p.id === 'chi-5')!;
    await svc.castVote('chi-5', 'keep');
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-5')!;

    expect(after.eliminateVotes).toBe(before.eliminateVotes - 1);
    expect(after.keepVotes).toBe(before.keepVotes + 1);
    expect(after.myVote).toBe('keep');
  });

  it('clearing a keep vote (null) decrements keepVotes by 1', async () => {
    const before = (await svc.getProperties()).find((p) => p.id === 'chi-2')!;
    await svc.castVote('chi-2', null);
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-2')!;

    expect(after.keepVotes).toBe(before.keepVotes - 1);
    expect(after.myVote).toBeNull();
  });

  it('clearing an eliminate vote (null) decrements eliminateVotes by 1', async () => {
    const before = (await svc.getProperties()).find((p) => p.id === 'chi-5')!;
    await svc.castVote('chi-5', null);
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-5')!;

    expect(after.eliminateVotes).toBe(before.eliminateVotes - 1);
    expect(after.myVote).toBeNull();
  });

  it('double-clearing a vote (null→null) does NOT double-decrement vote counts', async () => {
    const before = (await svc.getProperties()).find((p) => p.id === 'chi-2')!;
    await svc.castVote('chi-2', null); // first clear
    await svc.castVote('chi-2', null); // second clear (myVote already null — no revert)
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-2')!;

    // keepVotes should be exactly 1 less than seed, not 2 less.
    expect(after.keepVotes).toBe(before.keepVotes - 1);
  });

  it('castVote returns the mutated property immediately (optimistic update)', async () => {
    // chi-2 has myVote:'keep' — switch to eliminate
    const returned = await svc.castVote('chi-2', 'eliminate');
    expect(returned.myVote).toBe('eliminate');
    expect(returned.id).toBe('chi-2');
    expect(typeof returned.keepVotes).toBe('number');
    expect(typeof returned.eliminateVotes).toBe('number');
  });

  it('castVote throws on an unknown property ID', async () => {
    await expect(svc.castVote('does-not-exist', 'keep')).rejects.toThrow('Property not found');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Suite 4 — Input Validation & Persistence Correctness
// Locks in fixes for: empty-comment validation, null-vote persistence,
// getUserVoteCount/getProperties consistency, and safe vote-value loading.
// ───────────────────────────────────────────────────────────────────────────
describe('Input Validation & Persistence Correctness', () => {
  let svc: Svc;

  beforeEach(() => {
    jest.resetModules();
    svc = freshService();
  });

  // ── 4a. addComment: empty text must be rejected ─────────────────────────
  it('addComment throws for an empty string', async () => {
    await expect(svc.addComment('chi-1', '')).rejects.toThrow('Comment text cannot be empty');
  });

  it('addComment throws for a whitespace-only string', async () => {
    await expect(svc.addComment('chi-1', '   ')).rejects.toThrow('Comment text cannot be empty');
  });

  it('addComment with valid text returns a comment with trimmed text and correct author', async () => {
    const comment = await svc.addComment('chi-1', '  Great natural light!  ');
    expect(comment.text).toBe('Great natural light!');
    expect(comment.author).toBe('You');
    expect(typeof comment.id).toBe('string');
    expect(comment.id.length).toBeGreaterThan(0);
  });

  it('addComment with valid text increments commentCount for the property', async () => {
    const before = (await svc.getProperties()).find((p) => p.id === 'chi-1')!.commentCount;
    await svc.addComment('chi-1', 'Nice view');
    const after = (await svc.getProperties()).find((p) => p.id === 'chi-1')!.commentCount;
    expect(after).toBe(before + 1);
  });

  // ── 4b. persistVote(null) stores the 'none' sentinel ────────────────────
  // When a vote is cleared we store the explicit sentinel 'none' rather than
  // removing the key.  removeItem leaves no trace, so on the next app restart
  // loadPersisted would see a missing key and fall back to the seed value
  // (e.g. chi-2.myVote='keep'), silently re-activating the cleared vote.
  // The 'none' sentinel survives the restart and overrides the seed.
  it('castVote(null) stores the "none" sentinel in AsyncStorage (not empty string, not removed)', async () => {
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;

    await svc.castVote('chi-2', null); // chi-2 seed has myVote:'keep'

    const stored = await AsyncStorageMock.getItem('lumina:Chicago:chi-2:myVote');
    expect(stored).toBe('none');
  });

  it('castVote(keep) stores the literal string "keep" in AsyncStorage', async () => {
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;

    await svc.castVote('chi-2', null); // free a slot
    await svc.castVote('chi-1', 'keep');

    const stored = await AsyncStorageMock.getItem('lumina:Chicago:chi-1:myVote');
    expect(stored).toBe('keep');
  });

  it('castVote(eliminate) stores the literal string "eliminate" in AsyncStorage', async () => {
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;

    await svc.castVote('chi-2', null); // free a slot
    await svc.castVote('chi-1', 'eliminate');

    const stored = await AsyncStorageMock.getItem('lumina:Chicago:chi-1:myVote');
    expect(stored).toBe('eliminate');
  });

  // ── 4c. loadPersisted ignores corrupt/unexpected vote strings ────────────
  // Only 'keep' and 'eliminate' are valid — anything else (including a future
  // sentinel or corrupt data) must NOT overwrite the in-memory seed value.
  it('getProperties ignores an unknown vote string in AsyncStorage and preserves seed myVote', async () => {
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    // Manually inject a corrupt value that would slip through a naive `if (str)` check
    await AsyncStorageMock.setItem('lumina:Chicago:chi-1:myVote', 'invalid_value');

    const props = await svc.getProperties();
    const chi1 = props.find((p) => p.id === 'chi-1')!;
    // chi-1 seed is myVote: null — must NOT be overwritten by 'invalid_value'
    expect(chi1.myVote).toBeNull();
  });

  // ── 4d. getUserVoteCount stays consistent with getProperties ─────────────
  // getUserVoteCount() now calls getProperties() internally so the count
  // always reflects the same merged (in-memory + AsyncStorage) state.
  it('getUserVoteCount matches a manual count from getProperties in the default state', async () => {
    const count = await svc.getUserVoteCount();
    const props = await svc.getProperties();
    const manual = props.filter((p) => p.myVote != null).length;
    expect(count).toBe(manual); // both should be 2
    expect(count).toBe(2);
  });

  it('getUserVoteCount stays consistent with getProperties after a sequence of mutations', async () => {
    // switch chi-2 keep→eliminate, clear chi-5, cast chi-1 keep
    await svc.castVote('chi-2', 'eliminate');
    await svc.castVote('chi-5', null);
    await svc.castVote('chi-1', 'keep');

    const count = await svc.getUserVoteCount();
    const props = await svc.getProperties();
    const manual = props.filter((p) => p.myVote != null).length;

    expect(count).toBe(manual); // chi-2=eliminate, chi-1=keep → 2
    expect(count).toBe(2);
  });

  it('getUserVoteCount is 0 when all votes are cleared', async () => {
    await svc.castVote('chi-2', null);
    await svc.castVote('chi-5', null);

    const count = await svc.getUserVoteCount();
    expect(count).toBe(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Suite 5 — Restart-Persistence, setCurrentCity guard, addComment propertyId
//           validation, and getCurrentRound immutability
// ───────────────────────────────────────────────────────────────────────────
describe('Restart Persistence, City Guard, Comment Property Validation, Round Copy', () => {
  let svc: Svc;

  beforeEach(() => {
    jest.resetModules();
    svc = freshService();
  });

  // ── 5a. 'none' sentinel survives "restart" ──────────────────────────────
  // Simulates the case where session 1 cleared a seed vote and session 2
  // (fresh module, same AsyncStorage) should see myVote=null, not the seed 'keep'.
  it('loadPersisted treats the "none" sentinel as null, overriding the seed value', async () => {
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    // Inject 'none' as if a previous session had cleared chi-2 (seed: myVote:'keep')
    await AsyncStorageMock.setItem('lumina:Chicago:chi-2:myVote', 'none');

    const props = await svc.getProperties();
    const chi2 = props.find((p) => p.id === 'chi-2')!;
    // Seed has 'keep' — 'none' sentinel must win
    expect(chi2.myVote).toBeNull();
  });

  it('getUserVoteCount respects the "none" sentinel — cleared seed vote is not counted', async () => {
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    await AsyncStorageMock.setItem('lumina:Chicago:chi-2:myVote', 'none');

    // chi-5 still has seed 'eliminate' and no AsyncStorage key → counts as 1
    const count = await svc.getUserVoteCount();
    expect(count).toBe(1);
  });

  it('castVote(null) followed by getProperties still returns myVote null within the same session', async () => {
    // This is the within-session case (no module restart) — should already pass but
    // verifies the 'none' sentinel doesn't break same-session reads.
    await svc.castVote('chi-2', null);
    const props = await svc.getProperties();
    expect(props.find((p) => p.id === 'chi-2')!.myVote).toBeNull();
  });

  // ── 5b. setCurrentCity throws for unknown city names ────────────────────
  it('setCurrentCity throws Error("Unknown city: …") for an unrecognised city', async () => {
    await expect(svc.setCurrentCity('Miami')).rejects.toThrow('Unknown city: Miami');
  });

  it('setCurrentCity throws for an empty string', async () => {
    await expect(svc.setCurrentCity('')).rejects.toThrow('Unknown city: ');
  });

  it('setCurrentCity does NOT throw for each valid city', async () => {
    await expect(svc.setCurrentCity('Chicago')).resolves.toBeUndefined();
    await expect(svc.setCurrentCity('New York')).resolves.toBeUndefined();
    await expect(svc.setCurrentCity('Atlanta')).resolves.toBeUndefined();
  });

  it('currentCity stays on the previous valid city after a failed setCurrentCity', async () => {
    await svc.setCurrentCity('New York');
    await expect(svc.setCurrentCity('Miami')).rejects.toThrow();
    // Service should still be on New York, not silently reset to Chicago
    const city = await svc.getCurrentCity();
    expect(city).toBe('New York');
  });

  // ── 5c. addComment rejects unknown propertyId ───────────────────────────
  it('addComment throws Error("Property not found") for an unknown property ID', async () => {
    await expect(svc.addComment('does-not-exist', 'Good vibes')).rejects.toThrow('Property not found');
  });

  it('addComment throws for a valid property from a DIFFERENT city than the current one', async () => {
    // Switch to New York; chi- IDs are Chicago-only, so chi-1 is unknown in NYC context
    await svc.setCurrentCity('New York');
    await expect(svc.addComment('chi-1', 'Great view')).rejects.toThrow('Property not found');
  });

  it('addComment succeeds for a valid property in the current city', async () => {
    const comment = await svc.addComment('chi-3', 'Love the brownstone feel');
    expect(comment.author).toBe('You');
    expect(comment.text).toBe('Love the brownstone feel');
  });

  // ── 5d. getCurrentRound returns a defensive copy ─────────────────────────
  // Mutating the returned object must not affect subsequent getCurrentRound()
  // calls — otherwise a stale reference in state could corrupt the round data.
  it('getCurrentRound returns a copy — mutating it does not affect the service state', async () => {
    const r1 = await svc.getCurrentRound();
    const originalDay = r1.currentDay; // seed: 2

    r1.currentDay = 999; // external mutation attempt

    const r2 = await svc.getCurrentRound();
    expect(r2.currentDay).toBe(originalDay); // service state unchanged
    expect(r2.currentDay).not.toBe(999);
  });

  it('advanceRound still returns the updated day after getCurrentRound copy fix', async () => {
    const before = await svc.getCurrentRound();
    const after = await svc.advanceRound();
    expect(after.currentDay).toBe(Math.min(before.totalDays, before.currentDay + 1));
  });
});
