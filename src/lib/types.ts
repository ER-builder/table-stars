export interface Child {
  id: string;
  name: string;
  avatar_emoji: string;
  created_at: string;
}

export interface Star {
  id: string;
  child_id: string;
  date: string;
  awarded_by: string;
  created_at: string;
}

export interface Prize {
  id: string;
  child_id: string;
  stars_redeemed: number;
  prize_name: string | null;
  redeemed_at: string;
  delivered_at: string | null;
}
