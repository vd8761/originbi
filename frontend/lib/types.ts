export interface RoadmapItem {
  title: string;
  description: string;
}

export type MoodTag = "Feeling Happy" | "Need Motivation" | "Morning Boost";

export interface MoodItem {
  title: string;
  description: string;
  tag: MoodTag;
  duration: string;
  imageUrl: string;
}

export interface SessionItem {
  title: string;
  duration: string;
  date: string;
  time: string;
}

export interface TestimonialData {
  quote: string;
  name: string;
  title: string;
  image: string;
}
