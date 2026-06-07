import { Property, Round, Member, Comment } from '../types/property';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Feature 1: live group-voting status ───────────────────────────────────
export type GroupVotingStatus = {
  votedCount: number;
  totalMembers: number;
  memberStatuses: { id: string; name: string; hasVoted: boolean }[];
};

// ─── Feature 2: smart recommendations + budget ─────────────────────────────
export type RankedProperty = Property & {
  score: number;
  isOverBudget: boolean;
  recommendation: 'top-pick' | 'budget-warning' | null;
};

/**
 * Mock data layer for the Property Selection "game" (collaborative keep/eliminate voting).
 * 
 * City-first scaling per user request:
 * "as we scale other travel based cycles will begin later but cities first like chicago new york and atlanta"
 * "sart with airbnb and or vbro properties in chicago"
 * 
 * Chicago is the initial/default city. NYC and Atlanta stubbed with realistic Airbnb/Vrbo-style
 * listings (neighborhoods, pricing). Other travel-based cycles (creators, open, themed) come later.
 * 
 * This is 100% mock behind a typed service. Real backend API (from Lumina server / future API)
 * will plug in by replacing the impls here. Callers (screens) stay unchanged.
 * (Web platform work is deferred per user request; focus is 100% mobile app.)
 *
 * "each home": every property now has a distinct short title (e.g. "Cozy Wicker Park Loft").
 * Titles + layout (price badge on photo, etc.) styled to the latest refs (uUd7bSPn0aMdWxe331WZFmGWSaD3-1780419240011).
 * Preserves vote counts/prices for visual continuity with prior Chicago-tuned data.
 */
const mockPropertiesByCity: Record<string, Property[]> = {
  'Chicago': [
    {
      id: 'chi-1',
      rank: 1,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      title: 'Cozy Wicker Park Loft',
      pricePerPerson: 95,
      location: { city: 'Wicker Park', country: 'Chicago, IL' },
      keepVotes: 24,
      eliminateVotes: 6,
      commentCount: 8,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'chi-2',
      rank: 2,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      title: 'Gold Coast Lakefront Studio',
      pricePerPerson: 120,
      location: { city: 'Gold Coast', country: 'Chicago, IL' },
      keepVotes: 18,
      eliminateVotes: 5,
      commentCount: 5,
      myVote: 'keep',
      isFavorited: true,
    },
    {
      id: 'chi-3',
      rank: 3,
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      title: 'Charming Lincoln Park Brownstone',
      pricePerPerson: 85,
      location: { city: 'Lincoln Park', country: 'Chicago, IL' },
      keepVotes: 31,
      eliminateVotes: 12,
      commentCount: 12,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'chi-4',
      rank: 4,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56b77?w=800',
      title: 'Modern River North Penthouse',
      pricePerPerson: 150,
      location: { city: 'River North', country: 'Chicago, IL' },
      keepVotes: 16,
      eliminateVotes: 3,
      commentCount: 3,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'chi-5',
      rank: 5,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-603d5595e5e7?w=800',
      title: 'Sunny Logan Square 2BR',
      pricePerPerson: 70,
      location: { city: 'Logan Square', country: 'Chicago, IL' },
      keepVotes: 9,
      eliminateVotes: 8,
      commentCount: 4,
      myVote: 'eliminate',
      isFavorited: false,
    },
    {
      id: 'chi-6',
      rank: 6,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      title: 'Hyde Park Victorian Gem',
      pricePerPerson: 110,
      location: { city: 'Hyde Park', country: 'Chicago, IL' },
      keepVotes: 22,
      eliminateVotes: 10,
      commentCount: 7,
      myVote: null,
      isFavorited: true,
    },
  ],
  'New York': [
    {
      id: 'nyc-1',
      rank: 1,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56b77?w=800',
      title: 'Williamsburg Loft with City Views',
      pricePerPerson: 145,
      location: { city: 'Williamsburg', country: 'New York, NY' },
      keepVotes: 28,
      eliminateVotes: 4,
      commentCount: 15,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'nyc-2',
      rank: 2,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      title: 'Sleek SoHo 1BR Condo',
      pricePerPerson: 180,
      location: { city: 'SoHo', country: 'New York, NY' },
      keepVotes: 22,
      eliminateVotes: 7,
      commentCount: 11,
      myVote: 'keep',
      isFavorited: true,
    },
    {
      id: 'nyc-3',
      rank: 3,
      imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
      title: 'Trendy Bushwick Artist Loft',
      pricePerPerson: 95,
      location: { city: 'Bushwick', country: 'New York, NY' },
      keepVotes: 35,
      eliminateVotes: 9,
      commentCount: 18,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'nyc-4',
      rank: 4,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56b77?w=800',
      title: 'Luxury Upper East Side Studio',
      pricePerPerson: 210,
      location: { city: 'Upper East Side', country: 'New York, NY' },
      keepVotes: 14,
      eliminateVotes: 11,
      commentCount: 6,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'nyc-5',
      rank: 5,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-603d5595e5e7?w=800',
      title: 'Cozy Harlem Brownstone Apt',
      pricePerPerson: 78,
      location: { city: 'Harlem', country: 'New York, NY' },
      keepVotes: 12,
      eliminateVotes: 15,
      commentCount: 9,
      myVote: 'eliminate',
      isFavorited: false,
    },
    {
      id: 'nyc-6',
      rank: 6,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      title: 'Brooklyn Heights Waterfront Home',
      pricePerPerson: 165,
      location: { city: 'Brooklyn Heights', country: 'New York, NY' },
      keepVotes: 27,
      eliminateVotes: 8,
      commentCount: 13,
      myVote: null,
      isFavorited: true,
    },
  ],
  'Atlanta': [
    {
      id: 'atl-1',
      rank: 1,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      title: 'Midtown Modern Loft',
      pricePerPerson: 78,
      location: { city: 'Midtown', country: 'Atlanta, GA' },
      keepVotes: 29,
      eliminateVotes: 5,
      commentCount: 10,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'atl-2',
      rank: 2,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      title: 'Virginia Highland Bungalow',
      pricePerPerson: 105,
      location: { city: 'Virginia Highland', country: 'Atlanta, GA' },
      keepVotes: 21,
      eliminateVotes: 6,
      commentCount: 7,
      myVote: 'keep',
      isFavorited: true,
    },
    {
      id: 'atl-3',
      rank: 3,
      imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
      title: 'Inman Park Craftsman Home',
      pricePerPerson: 65,
      location: { city: 'Inman Park', country: 'Atlanta, GA' },
      keepVotes: 33,
      eliminateVotes: 8,
      commentCount: 14,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'atl-4',
      rank: 4,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56b77?w=800',
      title: 'Upscale Buckhead Condo',
      pricePerPerson: 130,
      location: { city: 'Buckhead', country: 'Atlanta, GA' },
      keepVotes: 19,
      eliminateVotes: 4,
      commentCount: 5,
      myVote: null,
      isFavorited: false,
    },
    {
      id: 'atl-5',
      rank: 5,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-603d5595e5e7?w=800',
      title: 'East Atlanta Eclectic 1BR',
      pricePerPerson: 55,
      location: { city: 'East Atlanta', country: 'Atlanta, GA' },
      keepVotes: 11,
      eliminateVotes: 14,
      commentCount: 8,
      myVote: 'eliminate',
      isFavorited: false,
    },
    {
      id: 'atl-6',
      rank: 6,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      title: 'Charming Decatur Cottage',
      pricePerPerson: 98,
      location: { city: 'Decatur', country: 'Atlanta, GA' },
      keepVotes: 25,
      eliminateVotes: 9,
      commentCount: 11,
      myVote: null,
      isFavorited: true,
    },
  ],
};

let currentCity = 'Chicago';

// Feature 1: simulated group-voting presence (resets on module load)
let _simulatedVotedCount = 4; // demo starts 4/11 voted

// Feature 2: group budget cap ($/person/night)
let _groupBudget = 130;

const getStorageKey = (city: string, propId: string, field: string) => `lumina:${city}:${propId}:${field}`;

async function loadPersisted(prop: Property, city: string): Promise<Property> {
  const myVoteStr = await AsyncStorage.getItem(getStorageKey(city, prop.id, 'myVote'));
  const favStr = await AsyncStorage.getItem(getStorageKey(city, prop.id, 'isFavorited'));
  if (myVoteStr === 'keep' || myVoteStr === 'eliminate') prop.myVote = myVoteStr;
  else if (myVoteStr === 'none') prop.myVote = null; // explicitly cleared in a prior session
  if (favStr) prop.isFavorited = favStr === 'true';
  return prop;
}

async function persistVote(city: string, propId: string, vote: 'keep' | 'eliminate' | null) {
  const key = getStorageKey(city, propId, 'myVote');
  // Store 'none' (not remove) so that explicitly cleared seed votes remain
  // cleared after an app restart — removeItem would leave no key, causing
  // loadPersisted to fall back to the seed value and resurrect the vote.
  await AsyncStorage.setItem(key, vote === null ? 'none' : vote);
}

async function persistFavorite(city: string, propId: string, fav: boolean) {
  await AsyncStorage.setItem(getStorageKey(city, propId, 'isFavorited'), fav.toString());
}

let currentRound: Round = {
  currentDay: 2,
  totalDays: 3,
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 23 + 1000 * 60 * 47 + 1000 * 12).toISOString(),
};

/**
 * Initial group members for the demo cycle ("to start").
 * 7 women + 4 men = 11 total participants.
 * This seeds the header avatars (first 3 shown overlapping + blue +N pill) for the Property Selection game.
 * Matches the gender balance intent from the platform matching engine (gender-aware cohorts).
 * Avatars use pravatar with seeds chosen for presentation; names are first names only.
 * The group size / composition is per-cycle (same across cities for now).
 */
const mockMembers: Member[] = [
  // 7 women
  { id: 'u1', name: 'Emma', avatarUrl: 'https://i.pravatar.cc/32?img=28' },
  { id: 'u2', name: 'Olivia', avatarUrl: 'https://i.pravatar.cc/32?img=29' },
  { id: 'u3', name: 'Sophia', avatarUrl: 'https://i.pravatar.cc/32?img=32' },
  { id: 'u4', name: 'Isabella', avatarUrl: 'https://i.pravatar.cc/32?img=35' },
  { id: 'u5', name: 'Mia', avatarUrl: 'https://i.pravatar.cc/32?img=40' },
  { id: 'u6', name: 'Ava', avatarUrl: 'https://i.pravatar.cc/32?img=47' },
  { id: 'u7', name: 'Charlotte', avatarUrl: 'https://i.pravatar.cc/32?img=49' },
  // 4 men
  { id: 'u8', name: 'Liam', avatarUrl: 'https://i.pravatar.cc/32?img=12' },
  { id: 'u9', name: 'Noah', avatarUrl: 'https://i.pravatar.cc/32?img=15' },
  { id: 'u10', name: 'Oliver', avatarUrl: 'https://i.pravatar.cc/32?img=18' },
  { id: 'u11', name: 'James', avatarUrl: 'https://i.pravatar.cc/32?img=60' },
];

/**
 * Per-property comments for the discussion modal (per-city).
 * Seeded with realistic group chatter. New comments from "You" are added at runtime + persisted via AsyncStorage.
 * commentCount on Property is kept in sync on add.
 */
const seedComments: Record<string, Record<string, Comment[]>> = {
  'Chicago': {
    'chi-1': [
      { id: 'c1', author: 'Sophia', text: 'Love the high ceilings and natural light here!', timestamp: '2h ago' },
      { id: 'c2', author: 'Liam', text: 'Rooftop is a huge plus for group hangs.', timestamp: '1h ago' },
    ],
    'chi-2': [
      { id: 'c3', author: 'Olivia', text: 'Views of the lake are stunning at sunset.', timestamp: '3h ago' },
    ],
    'chi-3': [
      { id: 'c4', author: 'Noah', text: 'Brownstone charm is exactly what I was hoping for.', timestamp: '50m ago' },
      { id: 'c5', author: 'Ava', text: 'Close to great coffee spots too.', timestamp: '30m ago' },
    ],
  },
  'New York': {
    'nyc-1': [
      { id: 'c6', author: 'Emma', text: 'Williamsburg energy is perfect for us.', timestamp: '4h ago' },
    ],
    'nyc-3': [
      { id: 'c7', author: 'Isabella', text: 'Artist loft has incredible wall space.', timestamp: '1h ago' },
      { id: 'c8', author: 'James', text: 'Natural light for days.', timestamp: '45m ago' },
    ],
  },
  'Atlanta': {
    'atl-1': [
      { id: 'c9', author: 'Charlotte', text: 'Midtown location makes evening plans easy.', timestamp: '2h ago' },
    ],
    'atl-3': [
      { id: 'c10', author: 'Mia', text: 'Inman Park has the best walkable vibe.', timestamp: '90m ago' },
    ],
  },
};

const commentsStore: Record<string, Record<string, Comment[]>> = JSON.parse(JSON.stringify(seedComments)); // deep clone for runtime

const getCommentsKey = (city: string, propId: string) => `lumina:${city}:${propId}:comments`;

async function loadComments(city: string, propId: string): Promise<Comment[]> {
  try {
    const raw = await AsyncStorage.getItem(getCommentsKey(city, propId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fall back to seed
  }
  return commentsStore[city]?.[propId] || [];
}

async function saveComments(city: string, propId: string, list: Comment[]) {
  try {
    await AsyncStorage.setItem(getCommentsKey(city, propId), JSON.stringify(list));
  } catch {}
}

export const propertyService = {
  async getCurrentCity(): Promise<string> {
    return currentCity;
  },

  async getAvailableCities(): Promise<string[]> {
    return Object.keys(mockPropertiesByCity);
  },

  async setCurrentCity(city: string): Promise<void> {
    if (!mockPropertiesByCity[city]) {
      throw new Error('Unknown city: ' + city);
    }
    currentCity = city;
  },

  async getCurrentRound(): Promise<Round> {
    return { ...currentRound };
  },

  async getMembers(): Promise<Member[]> {
    return mockMembers;
  },

  async getProperties(): Promise<Property[]> {
    const list = mockPropertiesByCity[currentCity] || mockPropertiesByCity['Chicago'];
    const persisted = await Promise.all(list.map(p => loadPersisted({ ...p }, currentCity)));
    return persisted;
  },

  /** Returns number of active votes the current demo user has cast (for "2 votes" limit UI). */
  async getUserVoteCount(): Promise<number> {
    const props = await this.getProperties();
    return props.filter((p) => p.myVote != null).length;
  },

  async castVote(propertyId: string, vote: 'keep' | 'eliminate' | null): Promise<Property> {
    const list = mockPropertiesByCity[currentCity] || [];
    const prop = list.find((p) => p.id === propertyId);
    if (!prop) throw new Error('Property not found');

    // Enforce per-member 2-vote limit (matches "Everyone has 2 votes" notice).
    // Allow changing/clearing existing votes; block only *new* votes when at cap.
    if (vote !== null) {
      const activeCount = list.filter((p) => p.myVote != null).length;
      const alreadyVotedHere = prop.myVote != null;
      if (!alreadyVotedHere && activeCount >= 2) {
        // Limit reached — return unchanged so UI can show message/disable
        return { ...prop };
      }
    }

    // Revert previous vote counts
    if (prop.myVote === 'keep') prop.keepVotes--;
    if (prop.myVote === 'eliminate') prop.eliminateVotes--;

    prop.myVote = vote;

    if (vote === 'keep') prop.keepVotes++;
    if (vote === 'eliminate') prop.eliminateVotes++;

    await persistVote(currentCity, propertyId, vote);
    return { ...prop };
  },

  async toggleFavorite(propertyId: string): Promise<Property> {
    const list = mockPropertiesByCity[currentCity] || [];
    const prop = list.find((p) => p.id === propertyId);
    if (!prop) throw new Error('Property not found');

    prop.isFavorited = !prop.isFavorited;
    await persistFavorite(currentCity, propertyId, prop.isFavorited);
    return { ...prop };
  },

  // --- Comments (per-property discussion modal) ---
  async getComments(propertyId: string): Promise<Comment[]> {
    return loadComments(currentCity, propertyId);
  },

  async addComment(propertyId: string, text: string): Promise<Comment> {
    if (!text.trim()) throw new Error('Comment text cannot be empty');
    const list = mockPropertiesByCity[currentCity] || [];
    if (!list.find((p) => p.id === propertyId)) throw new Error('Property not found');
    const existing = await loadComments(currentCity, propertyId);
    const newComment: Comment = {
      id: 'c' + Date.now().toString(36),
      author: 'You',
      text: text.trim(),
      timestamp: 'just now',
    };
    const updated = [...existing, newComment];
    await saveComments(currentCity, propertyId, updated);

    // Keep the Property's commentCount in sync (used by cards)
    const p = list.find((pp) => pp.id === propertyId);
    if (p) {
      p.commentCount = (p.commentCount || 0) + 1;
    }

    return newComment;
  },

  // ── Feature 1: Group voting presence ──────────────────────────────────────
  async getGroupVotingStatus(): Promise<GroupVotingStatus> {
    const statuses = mockMembers.map((m, i) => ({
      id: m.id,
      name: m.name,
      hasVoted: i < _simulatedVotedCount,
    }));
    return { votedCount: _simulatedVotedCount, totalMembers: mockMembers.length, memberStatuses: statuses };
  },

  async simulateVoteProgress(): Promise<GroupVotingStatus> {
    if (_simulatedVotedCount < mockMembers.length) _simulatedVotedCount++;
    return this.getGroupVotingStatus();
  },

  // ── Feature 2: Smart recommendations + budget ─────────────────────────────
  getGroupBudget(): number {
    return _groupBudget;
  },

  setGroupBudget(budget: number): void {
    _groupBudget = Math.max(0, budget);
  },

  rankProperties(props: Property[], budget?: number): RankedProperty[] {
    const cap = budget !== undefined ? budget : _groupBudget;
    const scored = props.map(p => ({
      ...p,
      score: p.keepVotes - p.eliminateVotes + (p.isFavorited ? 5 : 0),
      isOverBudget: p.pricePerPerson > cap,
      recommendation: null as RankedProperty['recommendation'],
    }));
    scored.sort((a, b) => b.score - a.score);
    // Mark top pick (highest score, regardless of budget) then budget warnings
    if (scored.length > 0) scored[0].recommendation = 'top-pick';
    scored.forEach(r => { if (r.isOverBudget && r.recommendation !== 'top-pick') r.recommendation = 'budget-warning'; });
    return scored;
  },

  // --- Round / elimination helpers for results view ---
  async advanceRound(): Promise<Round> {
    currentRound.currentDay = Math.min(currentRound.totalDays, currentRound.currentDay + 1);
    // Give a fresh countdown for the demo
    currentRound.deadline = new Date(Date.now() + 1000 * 60 * 60 * 18 + 1000 * 60 * 30).toISOString();
    return { ...currentRound };
  },
};
