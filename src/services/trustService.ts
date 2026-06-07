import AsyncStorage from '@react-native-async-storage/async-storage';

const CONDUCT_KEY = 'lumina:trust:conduct_accepted';
const REPORTS_KEY = 'lumina:trust:reports';

export type VerificationBadge = {
  type: 'ID' | 'BACKGROUND' | 'PHOTO';
  verified: boolean;
  label: string;
};

export type SafetyReport = {
  propertyId?: string;
  reason: string;
  reportedAt: string;
};

export const trustService = {
  async isConductAccepted(): Promise<boolean> {
    const val = await AsyncStorage.getItem(CONDUCT_KEY);
    return val === 'true';
  },

  async acceptConductCode(): Promise<void> {
    await AsyncStorage.setItem(CONDUCT_KEY, 'true');
  },

  // Returns verification stubs based on member index (u1..u11).
  // First 6 members have ID verification; first 4 also have background checks.
  getVerificationBadges(memberId: string): VerificationBadge[] {
    const idx = parseInt(memberId.replace('u', ''), 10) || 0;
    const badges: VerificationBadge[] = [];
    if (idx >= 1 && idx <= 6) badges.push({ type: 'ID', verified: true, label: 'ID Verified' });
    if (idx >= 1 && idx <= 4) badges.push({ type: 'BACKGROUND', verified: true, label: 'Background Check' });
    return badges;
  },

  async reportSafety(report: { propertyId?: string; reason: string }): Promise<SafetyReport> {
    const entry: SafetyReport = { ...report, reportedAt: new Date().toISOString() };
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const existing: SafetyReport[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([...existing, entry]));
    return entry;
  },

  async getSafetyReports(): Promise<SafetyReport[]> {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },
};
