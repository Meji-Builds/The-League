// Hand-authored types mirroring the Supabase schema.
// Run `supabase gen types typescript` to regenerate after schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ClubStatus = "pending" | "approved" | "suspended";
export type CompetitionType = "flagship" | "cup" | "other";
export type CompetitionCycle = "biennial" | "annual" | "one-off";
export type CompetitionFormat = "funnel_pyramid" | "knockout" | "group_stage" | "league";
export type CompetitionStatus = "upcoming" | "registration_open" | "in_progress" | "completed";
export type FixtureStage = "Department" | "Faculty" | "University" | "N/A";
export type FixtureStatus = "scheduled" | "reported" | "disputed" | "confirmed";
export type PaymentType = "owner_registration" | "competition_entry";
export type PaymentStatus = "pending" | "success" | "failed";
export type PaymentEntryStatus = "unpaid" | "paid";
export type AdminRole = "league_office";

export interface Club {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_status: string | null; // 'none' | 'pending' | 'approved' | 'rejected'
  badge_url: string | null;
  department: string;
  faculty: string;
  owner_id: string;
  bio: string | null;
  status: ClubStatus;
  merch: MerchItem[];
  sponsors: ClubSponsor[];
  created_at: string;
}

export interface MerchItem {
  name: string;
  description: string;
  price: number | null;
  image_url: string | null;
}

export interface ClubSponsor {
  name: string;
  logo_url: string;
  tier: string;
}

export interface ClubOwner {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  owner_registration_payment_status: PaymentEntryStatus;
  club_id: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  club_id: string;
  gamer_tag: string;
  full_name: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  position: string | null;
  stats: PlayerStats;
  created_at: string;
}

export interface PlayerStats {
  matches_played: number;
  wins: number;
  losses: number;
}

export interface Competition {
  id: string;
  name: string;
  slug: string;
  type: CompetitionType;
  cycle: CompetitionCycle;
  format: CompetitionFormat;
  edition: string;
  entry_fee: number;
  status: CompetitionStatus;
  description: string | null;
  created_at: string;
}

export interface CompetitionEntry {
  id: string;
  club_id: string;
  competition_id: string;
  payment_status: PaymentEntryStatus;
  entered_at: string;
}

export interface Fixture {
  id: string;
  competition_id: string;
  stage: FixtureStage;
  group_name: string;
  matchday: number;
  club_a_id: string;
  club_b_id: string;
  status: FixtureStatus;
  reported_by_a: FixtureReport | null;
  reported_by_b: FixtureReport | null;
  confirmed_score: FixtureScore | null;
  winner_club_id: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface FixtureReport {
  score_a: number;
  score_b: number;
  proof_image_url: string;
  submitted_at: string;
}

export interface FixtureScore {
  score_a: number;
  score_b: number;
}

export interface Payment {
  id: string;
  type: PaymentType;
  club_id: string;
  competition_id: string | null;
  amount: number;
  paystack_reference: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  body: string;
  image_url: string | null;
  published_at: string;
  author_admin_id: string;
}

export interface Highlight {
  id: string;
  title: string;
  video_url: string;
  competition_id: string | null;
  thumbnail_url: string | null;
  published_at: string;
}

export interface GlobalSponsor {
  id: string;
  name: string;
  logo_url: string;
  tier: "title" | "gold" | "silver" | "bronze";
  website_url: string | null;
  display_order: number;
}

export interface FeeSettings {
  owner_registration_fee: number;
  updated_at: string;
  updated_by: string;
}

// Supabase Database shape — used to type createClient<Database>()
// Each table needs Row, Insert, Update, and Relationships for the Supabase client
// to resolve types correctly on chained query calls.
type TableDef<R, I = Partial<R>, U = Partial<R>> = {
  Row: R;
  Insert: I;
  Update: U;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      clubs: TableDef<Club, Omit<Club, "id" | "created_at">, Partial<Omit<Club, "id">>>;
      club_owners: TableDef<ClubOwner, Omit<ClubOwner, "id" | "created_at">, Partial<Omit<ClubOwner, "id">>>;
      players: TableDef<Player, Omit<Player, "id" | "created_at">, Partial<Omit<Player, "id">>>;
      competitions: TableDef<Competition, Omit<Competition, "id" | "created_at">, Partial<Omit<Competition, "id">>>;
      competition_entries: TableDef<CompetitionEntry, Omit<CompetitionEntry, "id" | "entered_at">, Partial<Omit<CompetitionEntry, "id">>>;
      fixtures: TableDef<Fixture, Omit<Fixture, "id" | "created_at">, Partial<Omit<Fixture, "id">>>;
      payments: TableDef<Payment, Omit<Payment, "id" | "created_at">, Partial<Omit<Payment, "id">>>;
      announcements: TableDef<Announcement, Omit<Announcement, "id">, Partial<Omit<Announcement, "id">>>;
      highlights: TableDef<Highlight, Omit<Highlight, "id">, Partial<Omit<Highlight, "id">>>;
      global_sponsors: TableDef<GlobalSponsor, Omit<GlobalSponsor, "id">, Partial<Omit<GlobalSponsor, "id">>>;
      fee_settings: TableDef<FeeSettings, FeeSettings, Partial<FeeSettings>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
