import { Product, CartItem } from "@/types";

const ADMIN_AUTH_KEY = "saree_sanskriti_admin_auth";


const API_BASE = import.meta.env.VITE_API_BASE;

// Auth helpers
const AUTH_STORAGE_KEY = ADMIN_AUTH_KEY;

export const getAuthToken = (): string | null => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    const obj = JSON.parse(stored);
    return obj?.token || null;
  } catch {
    return null;
  }
};

export const loginAdmin = async (username: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const token = data.token;
    if (!token) return false;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username, token, isAuthenticated: true }));
    return true;
  } catch (e) {
    return false;
  }
};

export const logoutAdmin = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isAdminAuthenticated = (): boolean => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return false;
  try {
    const auth = JSON.parse(stored);
    return auth?.isAuthenticated === true && typeof auth?.token === "string";
  } catch {
    return false;
  }
};

// Products - operate exclusively with backend (MongoDB). No localStorage fallback.
export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText || "Unknown error");
    throw new Error(`Failed to fetch products: ${res.status} ${text}`);
  }
  return (await res.json()) as Product[];
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText || "Unknown error");
    throw new Error(`Failed to fetch product ${id}: ${res.status} ${text}`);
  }
  return (await res.json()) as Product;
};

export const addProduct = async (product: Omit<Product, "id" | "createdAt">, file?: File): Promise<Product> => {
  const token = getAuthToken();

  let options: RequestInit = { method: "POST", headers: {} };

  if (file) {
    const form = new FormData();
    form.append("image", file);
    form.append("name", product.name);
    form.append("price", String(product.price));
    form.append("description", product.description || "");
    form.append("fabric", product.fabric || "");
    form.append("category", product.category || "");
    form.append("imageUrl", product.imageUrls?.[0] || "");
    options.body = form;
  } else {
    const headers: Record<string,string> = { "Content-Type": "application/json" };
    options.body = JSON.stringify(product);
    options.headers = headers;
  }

  if (token) {
    options.headers = { ...(options.headers as Record<string,string>), Authorization: `Bearer ${token}` };
  }

  const res = await fetch(`${API_BASE}/admin/products`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText || "Unknown error");
    throw new Error(`Failed to add product: ${res.status} ${text}`);
  }
  return (await res.json()) as Product;
};

export const updateProduct = async (id: string, updates: Partial<Product>, file?: File): Promise<Product | null> => {
  const token = getAuthToken();

  let options: RequestInit = { method: "PUT", headers: {} };

  if (file) {
    const form = new FormData();
    form.append("image", file);
    if (updates.name) form.append("name", updates.name as string);
    if (updates.price !== undefined) form.append("price", String(updates.price));
    if (updates.description) form.append("description", updates.description as string);
    if (updates.fabric) form.append("fabric", updates.fabric as string);
    if (updates.category) form.append("category", updates.category as string);
    if (updates.imageUrls && updates.imageUrls.length > 0) form.append("imageUrl", updates.imageUrls[0] as string);
    options.body = form;
  } else {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(updates);
  }

  if (token) {
    options.headers = { ...(options.headers as Record<string,string>), Authorization: `Bearer ${token}` };
  }

  const res = await fetch(`${API_BASE}/admin/products/${id}`, options);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText || "Unknown error");
    throw new Error(`Failed to update product ${id}: ${res.status} ${text}`);
  }
  return (await res.json()) as Product;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const token = getAuthToken();
  const headers: Record<string,string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: "DELETE", headers });
  if (res.status === 404) return false;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText || "Unknown error");
    throw new Error(`Failed to delete product ${id}: ${res.status} ${text}`);
  }
  return true;
};

// Add order support - sends order to backend /checkout
export const addOrder = async (order: {
  customerName: string;
  email?: string;
  phone: string;
  address?: string;
  productId: string;
  productName: string;
  productPrice: number;
}) => {
  const payload = {
    customerName: order.customerName,
    phone: order.phone,
    city: order.address || "",
    items: [
      {
        id: order.productId,
        name: order.productName,
        price: order.productPrice,
        qty: 1,
      },
    ],
    // include optional fields for backend/emailing if needed
    email: order.email || "",
    address: order.address || "",
  };

  const res = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText || "Unknown error");
    throw new Error(`Failed to place order: ${res.status} ${text}`);
  }

  return await res.json();
};

// Cart helpers (localStorage)
const CART_KEY = "saree_cart";

export const getCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

export const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1): CartItem[] => {
  const items = getCart();
  const idx = items.findIndex((i) => i.productId === item.productId);
  if (idx >= 0) {
    items[idx].quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }
  saveCart(items);
  return items;
};

export const updateCartItemQuantity = (productId: string, quantity: number): CartItem[] => {
  const items = getCart();
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx >= 0) {
    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = quantity;
    }
  }
  saveCart(items);
  return items;
};

export const removeFromCart = (productId: string): CartItem[] => {
  const items = getCart().filter((i) => i.productId !== productId);
  saveCart(items);
  return items;
};

export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    // ignore
  }
};

