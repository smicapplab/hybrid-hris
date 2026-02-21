import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBackgroundColor(firstName?: string | null): string {
  if (firstName && firstName === "Unassigned") return "#374151"; // dark gray

  const letter = firstName?.charAt(0).toUpperCase() || "";
  if (!letter) return "#374151"; // fallback dark gray

  const colors = [
    { range: "A-B", class: "#7f1d1d" }, // dark red
    { range: "C-D", class: "#78350f" }, // dark amber
    { range: "E-F", class: "#064e3b" }, // dark green
    { range: "G-H", class: "#1e3a8a" }, // dark blue
    { range: "I-J", class: "#4c1d95" }, // dark purple
    { range: "K-L", class: "#0f766e" }, // teal
    { range: "M-N", class: "#7c2d12" }, // brownish red
    { range: "O-P", class: "#1e293b" }, // slate
    { range: "Q-R", class: "#4338ca" }, // indigo
    { range: "S-T", class: "#701a75" }, // fuchsia
    { range: "U-V", class: "#365314" }, // olive green
    { range: "W-X", class: "#14532d" }, // forest green
    { range: "Y-Z", class: "#312e81" }, // dark indigo
  ];

  for (const color of colors) {
    const [start, end] = color.range.split("-");
    if (letter >= start && letter <= end) {
      return color.class;
    }
  }

  return "#374151"; // fallback dark gray
}

export function getFallbackText(firstName?: string, lastName?: string): string {
  const firstInitial = firstName?.charAt(0).toUpperCase();
  const lastInitial = lastName?.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

// Normalize label
export const formatLabel = (field: string) => {
  if (field === "ssc") return "Special Science Curriculum?";
  if (field === "fourPs") return "Pantawid Pamilya Recipient?";

  // Convert camelCase to spaced words
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
};