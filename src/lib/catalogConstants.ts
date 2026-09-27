import { Product } from "@/types";

export const DEFAULT_FABRICS = [
  "Cotton",
  "Silk",
  "Cotton-Silk",
  "Cotton Silk",
  "Banarasi Silk",
  "Kanchipuram Silk",
  "Chanderi Silk",
  "Georgette",
  "Chiffon",
  "Organza",
  "Linen",
  "Bandhani",
  "Dola Silk",
  "Tussar Silk",
  "Satin Silk",
  "Crepe",
  "Net",
  "Jacquard",
  "Mal Cotton",
  "Kota Doria",
  "Maheshwari Silk",
  "Art Silk",
];

export const DEFAULT_CATEGORIES = [
  "Cotton",
  "Silk",
  "Cotton-Silk",
  "Cotton Silk",
  "Banarasi",
  "Kanjivaram",
  "Chanderi",
  "Organza",
  "Bandhani",
  "Weddings",
  "Parties",
  "Festive Wear",
  "Bridal",
  "Casual Wear",
  "Office Wear",
  "Summer Wear",
  "Day Party Wear",
  "Night Party Wear",
  "Traditional",
  "Designer",
];

export const COLOR_MAP: Record<string, string> = {
  Red: "#DC2626",
  Maroon: "#800000",
  Pink: "#EC4899",
  Magenta: "#D946EF",
  Blue: "#2563EB",
  "Navy Blue": "#1E3A8A",
  "Royal Blue": "#1D4ED8",
  "Sky Blue": "#0EA5E9",
  Green: "#16A34A",
  "Bottle Green": "#064E3B",
  "Olive Green": "#65A30D",
  Yellow: "#EAB308",
  Mustard: "#CA8A04",
  Orange: "#F97316",
  Purple: "#9333EA",
  Lavender: "#C084FC",
  Gold: "#EAB308",
  Silver: "#94A3B8",
  White: "#FFFFFF",
  "Off-White": "#FEF9C3",
  Cream: "#FEF3C7",
  Beige: "#D4D4D8",
  Grey: "#6B7280",
  Black: "#18181B",
  Brown: "#78350F",
  Peach: "#FDBA74",
  Teal: "#0D9488",
  Turquoise: "#06B6D4",
  Wine: "#831843",
};

/**
 * Extracts available colors for a product.
 * Returns explicit colors array if defined, or intelligently extracts colors
 * mentioned in the product name or description.
 */
export function getProductColors(product: Product): string[] {
  if (Array.isArray(product.colors) && product.colors.length > 0) {
    return product.colors.filter(Boolean);
  }

  // Auto-detect colors from product name
  const textToScan = `${product.name || ""} ${product.description || ""}`;
  const detected: string[] = [];

  const candidateColors = Object.keys(COLOR_MAP);

  // Check multi-word colors first (e.g. "Navy Blue", "Bottle Green")
  candidateColors
    .sort((a, b) => b.length - a.length)
    .forEach((colorName) => {
      const regex = new RegExp(`\\b${colorName}\\b`, "i");
      if (regex.test(textToScan) && !detected.some((d) => d.toLowerCase() === colorName.toLowerCase())) {
        detected.push(colorName);
      }
    });

  return detected;
}

/**
 * Returns true if the product is explicitly marked as out of stock.
 * Default is false (available).
 */
export function isProductOutOfStock(product: Product): boolean {
  if (product.isOutOfStock === true) return true;
  // If stock is specifically tracked and explicitly set to negative
  return false;
}

/**
 * Sorts products so that the most recently updated or created products show first.
 */
export function sortProductsByLatest(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return timeB - timeA;
  });
}
