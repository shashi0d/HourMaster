import { generateCategoryPattern, generateCategoryColor } from "@/lib/utils";

interface CategoryIconProps {
  categoryId: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ categoryId, size = 40, className = "" }: CategoryIconProps) {
  const pattern = generateCategoryPattern(categoryId);
  const color = generateCategoryColor(categoryId);
  
  return (
    <div 
      className={`rounded-lg flex items-center justify-center ${className}`}
      style={{ 
        width: size,
        height: size,
        backgroundColor: color,
        backgroundImage: pattern,
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    />
  );
} 