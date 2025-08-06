import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pattern generator for categories (Splitwise-style)
export function generateCategoryPattern(categoryId: string): string {
  // Create a hash from the category ID
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    const char = categoryId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to generate consistent patterns
  const patternType = Math.abs(hash) % 8; // 8 different pattern types
  
  const patterns = {
    0: `radial-gradient(circle at 30% 30%, white 0%, white 25%, transparent 25%)`, // Top-left circle
    1: `radial-gradient(circle at 70% 70%, white 0%, white 25%, transparent 25%)`, // Bottom-right circle
    2: `radial-gradient(circle at 50% 50%, white 0%, white 35%, transparent 35%)`, // Center circle
    3: `radial-gradient(circle at 30% 30%, white 0%, white 20%, transparent 20%), 
        radial-gradient(circle at 70% 70%, white 0%, white 20%, transparent 20%)`, // Two circles
    4: `linear-gradient(45deg, white 0%, white 25%, transparent 25%, transparent 50%, white 50%, white 75%, transparent 75%)`, // Diagonal stripes
    5: `radial-gradient(circle at 25% 25%, white 0%, white 15%, transparent 15%), 
        radial-gradient(circle at 75% 75%, white 0%, white 15%, transparent 15%),
        radial-gradient(circle at 50% 50%, white 0%, white 20%, transparent 20%)`, // Three circles
    6: `linear-gradient(90deg, white 0%, white 20%, transparent 20%, transparent 40%, white 40%, white 60%, transparent 60%, transparent 80%, white 80%)`, // Vertical stripes
    7: `radial-gradient(circle at 50% 30%, white 0%, white 30%, transparent 30%), 
        radial-gradient(circle at 50% 70%, white 0%, white 30%, transparent 30%)` // Two vertical circles
  };
  
  return patterns[patternType as keyof typeof patterns];
}

// Generate a unique color based on category ID
export function generateCategoryColor(categoryId: string): string {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    const char = categoryId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Generate HSL color with good saturation and lightness
  const hue = Math.abs(hash) % 360;
  const saturation = 70 + (Math.abs(hash) % 20); // 70-90%
  const lightness = 50 + (Math.abs(hash) % 20); // 50-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
