import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createReviewCompositeKey(review: {
  rating: number;
  comments: string | null;
  created_at: string;
}): string {
  const normalizedComments = (review.comments || '').trim().toLowerCase();
  const dateToSecond = new Date(review.created_at).toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  return `${review.rating}|${normalizedComments}|${dateToSecond}`;
}
