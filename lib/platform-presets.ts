export type Platform = "tiktok" | "instagram" | "facebook" | "youtube";

export type AspectRatio =
  | "9:16"
  | "1:1"
  | "4:5"
  | "16:9"
  | "3:4"
  | "21:9";

export const PLATFORMS: Record<
  Platform,
  {
    label: string;
    short: string;
    defaultAspect: AspectRatio;
    aspects: AspectRatio[];
    voice: string;
    notes: string;
  }
> = {
  tiktok: {
    label: "TikTok",
    short: "TT",
    defaultAspect: "9:16",
    aspects: ["9:16", "1:1"],
    voice: "casual, hook-first, native, fast-paced, conversational",
    notes:
      "Open with a 1-2 second hook. Use line breaks. Aim for 15-30s scripts.",
  },
  instagram: {
    label: "Instagram",
    short: "IG",
    defaultAspect: "9:16",
    aspects: ["9:16", "1:1", "4:5"],
    voice: "polished, aspirational, visual-first, on-brand",
    notes:
      "Reels-style hooks for 9:16; carousel/post copy for 1:1 and 4:5. Include 5-7 hashtags.",
  },
  facebook: {
    label: "Facebook",
    short: "FB",
    defaultAspect: "1:1",
    aspects: ["1:1", "4:5", "16:9"],
    voice: "clear, benefit-led, broad audience",
    notes: "Lead with a benefit and a CTA. Avoid jargon.",
  },
  youtube: {
    label: "YouTube",
    short: "YT",
    defaultAspect: "16:9",
    aspects: ["16:9", "9:16"],
    voice: "informative, attention-grabbing, structured",
    notes:
      "9:16 = Shorts (under 60s scripts). 16:9 = thumbnails + titles + descriptions.",
  },
};

export const ASPECT_TO_OPENAI_SIZE: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
  "4:5": "1024x1280",
  "3:4": "1024x1365",
  "21:9": "1536x659",
};

export const ASPECT_LABELS: Record<AspectRatio, string> = {
  "9:16": "Vertical · 9:16",
  "1:1": "Square · 1:1",
  "4:5": "Portrait · 4:5",
  "16:9": "Landscape · 16:9",
  "3:4": "Portrait · 3:4",
  "21:9": "Cinema · 21:9",
};
