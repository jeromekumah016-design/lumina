// Types for "Alumni Lumina Cycles" — the past-cycle gallery.
// A Cycle is one fully completed Lumina experience (matching → voting → trip)
// that alumni can browse for inspiration. All data is currently mock.

export type CycleGender = 'MALE' | 'FEMALE';

export interface CycleParticipant {
  id: string;
  name: string;
  gender: CycleGender;
  avatarUrl: string;
}

export interface CycleWinner {
  id: string;
  title: string;
  imageUrl: string;
  pricePerPerson: number;
  location: string; // display string e.g. "Wicker Park · Chicago, IL"
}

export interface Cycle {
  id: string;
  city: string;
  startDate: string; // display-friendly e.g. "Apr 12"
  endDate: string; // display-friendly e.g. "Apr 15, 2026"
  winner: CycleWinner;
  groupSize: number; // 10 for now (equal 5 men / 5 women)
  participants: CycleParticipant[];
  photos: string[]; // 3–6 high-quality image URLs
  highlights: string[]; // 3–5 short memorable moments
  itinerarySummary: string[]; // top 4–5 activities
  averageRating?: number; // 4.5–5.0
  completedAt: string; // ISO
}
