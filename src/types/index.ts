export interface Product {
  _id: string;
  name: string;
  price: number;
  /** Optional MRP; may be shown struck-through vs selling price. */
  mrp?: number | null;
  description: string;
  fabric: string;
  category: string;
  /** At least one image URL. First image is used as primary (e.g. cart thumbnail). */
  imageUrls: string[];
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  productId: string;
  productName: string;
  productPrice: number;
  createdAt: string;
}

/** Normalized row for admin orders table (API Mongo orders or legacy localStorage). */
export interface AdminOrderRow {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  productSummary: string;
  totalPrice: number;
}

/** Fabrics and categories stored in MongoDB (`ShopCatalog`). */
export interface ShopCatalog {
  fabrics: string[];
  categories: string[];
}

export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

