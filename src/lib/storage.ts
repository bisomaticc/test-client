import { Product, CartItem } from "@/types";

const AUTH_STORAGE_KEY = "adminToken";


const API_BASE = import.meta.env.VITE_API_BASE;

const CART_KEY = "saree_cart";
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

export const loginAdmin = async (email: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch(`$(API_BASE)/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (!data.token) return false;

    localStorage.setItem(AUTH_STORAGE_KEY, data.token);
    return true;
  } catch {
    return false;
  }
};

export const logoutAdmin = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isAdminAuthenticated = (): boolean => {
  return !!localStorage.getItem(AUTH_STORAGE_KEY);
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

export async function addProduct(form) {
  const payload = {
    name: form.name,
    price: Number(form.price),
    description: form.description,
    category: form.category,
    fabric: form.fabric,
    stock: Number(form.stock ?? 0),
    imageUrls: Array.isArray(form.imageUrls)
      ? form.imageUrls
      : (form.imageUrls ? [form.imageUrls] : []),
  };

  const response = await fetch($(API_URL)/admin/product, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export const updateProduct = async (
  id: string,
  updates: Partial<Product>,
  file?: File
): Promise<Product | null> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  let body: BodyInit;

  if (file) {
    const form = new FormData();
    if (updates.name) form.append("name", updates.name);
    if (updates.price !== undefined)
      form.append("price", String(updates.price));
    if (updates.description) form.append("description", updates.description);
    if (updates.fabric) form.append("fabric", updates.fabric);
    if (updates.category) form.append("category", updates.category);
    body = form;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(updates);
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: "PUT",
    headers,
    body,
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update product: ${res.status} ${text}`);
  }

  return (await res.json()) as Product;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: "DELETE",
    headers,
  });

  if (res.status === 404) return false;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete product: ${res.status} ${text}`);
  }

  return true;
};

/* =========================
   ORDERS
========================= */

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
    email: order.email || "",
    address: order.address || "",
    items: [
      {
        id: order.productId,
        name: order.productName,
        price: order.productPrice,
        qty: 1,
      },
    ],
  };

  const res = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to place order: ${res.status} ${text}`);
  }

  return res.json();
};

/* =========================
   CART (LOCAL STORAGE)
========================= */

export const getCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const addToCart = (
  item: Omit<CartItem, "quantity">,
  quantity = 1
): CartItem[] => {
  const items = getCart();
  const existing = items.find((i) => i.productId === item.productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }

  saveCart(items);
  return items;
};

export const updateCartItemQuantity = (
  productId: string,
  quantity: number
): CartItem[] => {
  const items = getCart().filter((i) =>
    i.productId === productId ? quantity > 0 : true
  );

  items.forEach((i) => {
    if (i.productId === productId) i.quantity = quantity;
  });

  saveCart(items);
  return items;
};

export const removeFromCart = (productId: string): CartItem[] => {
  const items = getCart().filter((i) => i.productId !== productId);
  saveCart(items);
  return items;
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};



