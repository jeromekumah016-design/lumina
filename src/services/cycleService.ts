import { Cycle, CycleParticipant } from '../types/cycle';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mock data layer for "Alumni Lumina Cycles" — the past-cycle gallery.
 *
 * Mirrors the patterns in propertyService.ts / tripService.ts: a typed service
 * over in-memory mock data, with the small bit of per-user state (saved cycles)
 * persisted to AsyncStorage under `lumina:cycle:*` keys. A real backend can later
 * replace these impls without touching the screens.
 *
 * IMPORTANT design note (resolves the original spec's ambiguity):
 *   - getAllCycles() is the gallery source — ALWAYS the full alumni set.
 *   - Whether the current user has finished a cycle (the access GATE) lives in
 *     userService.getCompletedCycleIds(), NOT here. This service never filters the
 *     gallery by the current user.
 *
 * Cities follow the same city-first scaling as properties (Chicago / NYC / Atlanta).
 * An equal 5 women + 5 men = 10 per group, matching the platform's gender-balanced cohorts.
 */

const SAVED_KEY = 'lumina:cycle:saved';

// Build a 10-person group (equal 5 women + 5 men) from name lists, with pravatar avatars.
function makeGroup(prefix: string, women: string[], men: string[]): CycleParticipant[] {
  const w = women.slice(0, 5).map((name, i) => ({
    id: `${prefix}-w${i + 1}`,
    name,
    gender: 'FEMALE' as const,
    avatarUrl: `https://i.pravatar.cc/64?img=${20 + i}`,
  }));
  const m = men.slice(0, 5).map((name, i) => ({
    id: `${prefix}-m${i + 1}`,
    name,
    gender: 'MALE' as const,
    avatarUrl: `https://i.pravatar.cc/64?img=${50 + i}`,
  }));
  return [...w, ...m];
}

const mockCycles: Cycle[] = [
  {
    id: 'cyc-chi-2025-spring',
    city: 'Chicago',
    startDate: 'Apr 11',
    endDate: 'Apr 14, 2025',
    winner: {
      id: 'chi-1',
      title: 'Cozy Wicker Park Loft',
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      pricePerPerson: 95,
      location: 'Wicker Park · Chicago, IL',
    },
    groupSize: 10,
    participants: makeGroup(
      'cyc-chi1',
      ['Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia'],
      ['Liam', 'Noah', 'Oliver', 'James', 'Lucas'],
    ),
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900',
      'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=900',
      'https://images.unsplash.com/photo-1507992781348-310259076fe0?w=900',
    ],
    highlights: [
      'Sunset rooftop dinner the whole group cooked together',
      'Spontaneous lakefront bike ride at dawn',
      'Late-night deep-dish debate that became a group inside joke',
    ],
    itinerarySummary: [
      'Art Institute morning + The Bean',
      'Wicker Park record shops & cafés',
      'Architecture river cruise',
      'Group cook-off at the loft',
    ],
    averageRating: 4.9,
    completedAt: '2025-04-14T22:00:00.000Z',
  },
  {
    id: 'cyc-chi-2024-fall',
    city: 'Chicago',
    startDate: 'Oct 3',
    endDate: 'Oct 6, 2024',
    winner: {
      id: 'chi-3',
      title: 'Charming Lincoln Park Brownstone',
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
      pricePerPerson: 85,
      location: 'Lincoln Park · Chicago, IL',
    },
    groupSize: 10,
    participants: makeGroup(
      'cyc-chi2',
      ['Harper', 'Evelyn', 'Abigail', 'Ella', 'Scarlett'],
      ['Lucas', 'Henry', 'Jack', 'Owen', 'Leo'],
    ),
    photos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900',
      'https://images.unsplash.com/photo-1521334884684-d80222895322?w=900',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900',
    ],
    highlights: [
      'Fall colors walk through Lincoln Park',
      'Found a tiny jazz bar and closed it down',
      'Sunday farmers market brunch haul',
    ],
    itinerarySummary: [
      'Lincoln Park Zoo (free!)',
      'Second City comedy night',
      'Coffee crawl through the brownstone blocks',
      'Lakefront picnic',
    ],
    averageRating: 4.7,
    completedAt: '2024-10-06T21:00:00.000Z',
  },
  {
    id: 'cyc-nyc-2025-summer',
    city: 'New York',
    startDate: 'Jun 6',
    endDate: 'Jun 10, 2025',
    winner: {
      id: 'nyc-1',
      title: 'Williamsburg Loft with City Views',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56b77?w=1200',
      pricePerPerson: 145,
      location: 'Williamsburg · New York, NY',
    },
    groupSize: 10,
    participants: makeGroup(
      'cyc-nyc1',
      ['Lily', 'Aria', 'Zoe', 'Nora', 'Hazel'],
      ['Ethan', 'Mason', 'Logan', 'Daniel', 'Ryan'],
    ),
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56b77?w=900',
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900',
      'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=900',
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=900',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=900',
    ],
    highlights: [
      'Rooftop skyline views every single night',
      'Smorgasburg food marathon',
      'Ferry ride with the whole crew at golden hour',
    ],
    itinerarySummary: [
      'Brooklyn Bridge walk at sunrise',
      'Williamsburg vintage shopping',
      'MoMA afternoon',
      'Group dinner in the East Village',
    ],
    averageRating: 4.8,
    completedAt: '2025-06-10T23:00:00.000Z',
  },
  {
    id: 'cyc-nyc-2024-winter',
    city: 'New York',
    startDate: 'Dec 12',
    endDate: 'Dec 15, 2024',
    winner: {
      id: 'nyc-6',
      title: 'Brooklyn Heights Waterfront Home',
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      pricePerPerson: 165,
      location: 'Brooklyn Heights · New York, NY',
    },
    groupSize: 10,
    participants: makeGroup(
      'cyc-nyc2',
      ['Penelope', 'Layla', 'Riley', 'Nova', 'Aurora'],
      ['Sebastian', 'Jackson', 'Aiden', 'Caleb', 'Eli'],
    ),
    photos: [
      'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=900',
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=900',
      'https://images.unsplash.com/photo-1513107132679-9fef05f0a4a3?w=900',
    ],
    highlights: [
      'Holiday lights walk along the Promenade',
      'Cozy hot-cocoa night in by the windows',
      'Ice skating the whole group somehow survived',
    ],
    itinerarySummary: [
      'Rockefeller tree + skating',
      'Brooklyn Heights brownstone stroll',
      'Chelsea Market warm-up',
      'Broadway show night',
    ],
    averageRating: 4.6,
    completedAt: '2024-12-15T22:00:00.000Z',
  },
  {
    id: 'cyc-atl-2025-spring',
    city: 'Atlanta',
    startDate: 'Mar 21',
    endDate: 'Mar 24, 2025',
    winner: {
      id: 'atl-3',
      title: 'Inman Park Craftsman Home',
      imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200',
      pricePerPerson: 65,
      location: 'Inman Park · Atlanta, GA',
    },
    groupSize: 10,
    participants: makeGroup(
      'cyc-atl1',
      ['Camila', 'Gianna', 'Elena', 'Maya', 'Naomi'],
      ['Julian', 'Leo', 'Miles', 'Theo', 'Adam'],
    ),
    photos: [
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=900',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900',
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900',
    ],
    highlights: [
      'BeltLine bar crawl on foot',
      'Porch hangs that ran until 2am',
      'Surprise group spa afternoon',
    ],
    itinerarySummary: [
      'BeltLine Eastside Trail walk',
      'Ponce City Market food hall',
      'Inman Park porch dinner',
      'Botanical Garden morning',
    ],
    averageRating: 4.9,
    completedAt: '2025-03-24T21:00:00.000Z',
  },
  {
    id: 'cyc-atl-2024-summer',
    city: 'Atlanta',
    startDate: 'Aug 8',
    endDate: 'Aug 11, 2024',
    winner: {
      id: 'atl-1',
      title: 'Midtown Modern Loft',
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
      pricePerPerson: 78,
      location: 'Midtown · Atlanta, GA',
    },
    groupSize: 10,
    participants: makeGroup(
      'cyc-atl2',
      ['Delilah', 'Cora', 'Eliana', 'Adeline', 'Josephine'],
      ['Asher', 'Levi', 'Ezra', 'Jonah', 'Max'],
    ),
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=900',
      'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=900',
    ],
    highlights: [
      'Rooftop pool day in the Midtown heat',
      'Piedmont Park picnic + people watching',
      'Group karaoke nobody will admit happened',
    ],
    itinerarySummary: [
      'High Museum of Art',
      'Piedmont Park afternoon',
      'Midtown rooftop dinner',
      'World of Coca-Cola',
    ],
    averageRating: 4.7,
    completedAt: '2024-08-11T22:00:00.000Z',
  },
];

async function loadSaved(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function persistSaved(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  } catch {}
}

export const cycleService = {
  /** The gallery source: every alumni cycle, newest first. Never filtered by the current user. */
  async getAllCycles(): Promise<Cycle[]> {
    return [...mockCycles].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  },

  async getCycleById(id: string): Promise<Cycle | null> {
    return mockCycles.find((c) => c.id === id) || null;
  },

  // ── Saved / "inspiration" (the current user's bookmarks) ──────────────────
  async getSavedCycleIds(): Promise<string[]> {
    return loadSaved();
  },

  async isSaved(cycleId: string): Promise<boolean> {
    const ids = await loadSaved();
    return ids.includes(cycleId);
  },

  /** Toggle bookmark; returns the new saved state for the cycle. */
  async toggleSaved(cycleId: string): Promise<boolean> {
    const ids = await loadSaved();
    const exists = ids.includes(cycleId);
    const next = exists ? ids.filter((i) => i !== cycleId) : [...ids, cycleId];
    await persistSaved(next);
    return !exists;
  },

  /** Wipe cycle-specific persisted state (saved bookmarks) for demo resets. */
  async resetAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SAVED_KEY);
    } catch (e) {
      console.warn('cycleService.resetAll failed', e);
    }
  },
};
