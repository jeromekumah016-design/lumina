export type Property = {
  id: string;
  rank: number;
  imageUrl: string;
  title: string; // short name for the home/listing (e.g. "Cozy Wicker Park Loft")
  pricePerPerson: number;
  location: { city: string; country: string };
  keepVotes: number;
  eliminateVotes: number;
  commentCount: number;
  myVote: 'keep' | 'eliminate' | null;
  isFavorited: boolean;
};

export type Round = {
  currentDay: number;
  totalDays: number;
  deadline: string; // ISO
};

export type Member = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Comment = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
};
