import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property } from '../types/property';

export type ItineraryItem = {
  id: string;
  day: number;
  time: string;
  activity: string;
  location: string;
};

export type CostItem = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
};

export type CostSplit = {
  memberName: string;
  owes: number;
};

const seedItinerary: ItineraryItem[] = [
  { id: 'it-1', day: 1, time: '14:00', activity: 'Check-in & Welcome Drinks', location: 'Property' },
  { id: 'it-2', day: 1, time: '19:00', activity: 'Group Dinner', location: 'Local Restaurant' },
  { id: 'it-3', day: 2, time: '10:00', activity: 'Morning Exploring', location: 'City Center' },
  { id: 'it-4', day: 2, time: '20:00', activity: 'Night Out', location: 'Local Hotspot' },
  { id: 'it-5', day: 3, time: '11:00', activity: 'Brunch & Goodbyes', location: 'Property' },
];

const seedCosts: CostItem[] = [
  { id: 'cost-1', description: 'Property Rental (3 nights)', amount: 1050, paidBy: 'Emma' },
  { id: 'cost-2', description: 'Welcome Dinner', amount: 242, paidBy: 'Liam' },
  { id: 'cost-3', description: 'Group Activities', amount: 198, paidBy: 'Sophia' },
];

const itineraryKey = (city: string) => `lumina:trip:${city}:itinerary`;
const costsKey = (city: string) => `lumina:trip:${city}:costs`;

export const tripService = {
  // Returns the property with the most keep votes (the group's top pick).
  getWinningProperty(properties: Property[]): Property | null {
    if (!properties.length) return null;
    return properties.reduce((best, p) => (p.keepVotes > best.keepVotes ? p : best), properties[0]);
  },

  async getTripItinerary(city: string): Promise<ItineraryItem[]> {
    try {
      const raw = await AsyncStorage.getItem(itineraryKey(city));
      if (raw) return JSON.parse(raw);
    } catch {}
    return [...seedItinerary];
  },

  async addItineraryItem(city: string, item: Omit<ItineraryItem, 'id'>): Promise<ItineraryItem> {
    const existing = await this.getTripItinerary(city);
    const newItem: ItineraryItem = { ...item, id: 'it-' + Date.now().toString(36) };
    const updated = [...existing, newItem].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
    await AsyncStorage.setItem(itineraryKey(city), JSON.stringify(updated));
    return newItem;
  },

  async getTripCosts(city: string): Promise<CostItem[]> {
    try {
      const raw = await AsyncStorage.getItem(costsKey(city));
      if (raw) return JSON.parse(raw);
    } catch {}
    return [...seedCosts];
  },

  async addCostItem(city: string, item: Omit<CostItem, 'id'>): Promise<CostItem> {
    const existing = await this.getTripCosts(city);
    const newItem: CostItem = { ...item, id: 'cost-' + Date.now().toString(36) };
    await AsyncStorage.setItem(costsKey(city), JSON.stringify([...existing, newItem]));
    return newItem;
  },

  // Pure function: splits total cost evenly across memberCount members.
  computeCostSplits(costs: CostItem[], memberCount: number): CostSplit[] {
    if (!memberCount || !costs.length) return [];
    const total = costs.reduce((sum, c) => sum + c.amount, 0);
    return costs.map(c => ({
      memberName: c.paidBy,
      owes: Math.round(((total - c.amount) / memberCount) * 100) / 100,
    }));
  },

  // Returns total per-person share across all costs.
  getTotalPerPerson(costs: CostItem[], memberCount: number): number {
    if (!memberCount) return 0;
    const total = costs.reduce((sum, c) => sum + c.amount, 0);
    return Math.round((total / memberCount) * 100) / 100;
  },
};
