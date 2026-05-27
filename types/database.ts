export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  credits: number;
  created_at: string;
  updated_at: string;
};

export type BrandKit = {
  id: string;
  user_id: string;
  name: string;
  primary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  brand_kit_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AssetType = "image" | "video" | "copy" | "flyer" | "audio";

export type Asset = {
  id: string;
  project_id: string | null;
  user_id: string;
  type: AssetType;
  title: string | null;
  content: Json | null;
  file_url: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  metadata: Json | null;
  generation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GenerationStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed";

export type GenerationKind =
  | "copy"
  | "image"
  | "video"
  | "voiceover"
  | "flyer";

export type Generation = {
  id: string;
  user_id: string;
  project_id: string | null;
  kind: GenerationKind;
  provider: string;
  model: string;
  prompt: Json;
  status: GenerationStatus;
  external_id: string | null;
  output: Json | null;
  error: string | null;
  credits_cost: number;
  latency_ms: number | null;
  created_at: string;
  completed_at: string | null;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "starter" | "pro" | "business";
  status: string;
  current_period_end: string | null;
  monthly_credits: number;
  created_at: string;
  updated_at: string;
};

export type UsageEvent = {
  id: string;
  user_id: string;
  generation_id: string | null;
  kind: GenerationKind;
  model: string;
  credits: number;
  cost_usd: number;
  metadata: Json | null;
  created_at: string;
};

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type Insert<T> = Omit<
  T,
  "id" | "created_at" | "updated_at" | NullableKeys<T>
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
} & {
  [K in NullableKeys<T>]?: T[K];
};

type Update<T> = Partial<T>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Insert<Profile>;
        Update: Update<Profile>;
        Relationships: [];
      };
      brand_kits: {
        Row: BrandKit;
        Insert: Insert<BrandKit>;
        Update: Update<BrandKit>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Insert<Project>;
        Update: Update<Project>;
        Relationships: [];
      };
      assets: {
        Row: Asset;
        Insert: Insert<Asset>;
        Update: Update<Asset>;
        Relationships: [];
      };
      generations: {
        Row: Generation;
        Insert: Insert<Generation>;
        Update: Update<Generation>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Insert<Subscription>;
        Update: Update<Subscription>;
        Relationships: [];
      };
      usage_events: {
        Row: UsageEvent;
        Insert: Insert<UsageEvent>;
        Update: Update<UsageEvent>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
