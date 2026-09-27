import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  isAdminAuthenticated,
  logoutAdmin,
  getProducts,
  deleteProduct,
} from "@/lib/storage";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Product, Order, AdminOrderRow, ShopCatalog } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  Plus,
  LogOut,
  Pencil,
  Trash2,
  Home,
  Layers,
  Tag,
  Ban,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  sortProductsByLatest,
  DEFAULT_FABRICS,
  DEFAULT_CATEGORIES,
  COLOR_MAP,
} from "@/lib/catalogConstants";

function normalizeApiOrder(o: Record<string, unknown>): AdminOrderRow {
  const id = String((o._id as string | undefined) ?? (o.id as string | undefined) ?? "");
  const items = Array.isArray(o.items) ? (o.items as any[]) : [];
  const productSummary = items.length
    ? items.map((i) => `${i.name ?? "Item"} ×${i.qty ?? 1}`).join(", ")
    : "—";
  let totalPrice = typeof o.totalAmount === "number" ? o.totalAmount : 0;
  if (!totalPrice && items.length) {
    totalPrice = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  }
  const createdAt =
    typeof o.createdAt === "string"
      ? o.createdAt
      : o.createdAt instanceof Date
        ? o.createdAt.toISOString()
        : new Date().toISOString();

  // Item 2: Extract item photos
  const itemImages: string[] = [];
  items.forEach((i) => {
    const raw = i.imageUrls || i.imageUrl || (i.productId && i.productId.imageUrls?.[0]);
    if (raw) {
      if (Array.isArray(raw)) itemImages.push(...raw.map(String));
      else if (typeof raw === "string") {
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((u) => itemImages.push(u));
      }
    }
  });

  return {
    id,
    createdAt,
    customerName: String(o.customerName ?? ""),
    email: String(o.email ?? ""),
    phone: String(o.phone ?? ""),
    address: String(o.address ?? ""),
    productSummary,
    totalPrice,
    itemImages,
  };
}

function ordersFromLocalStorage(): AdminOrderRow[] {
  try {
    const raw = JSON.parse(localStorage.getItem("orders") || "[]") as Order[];
    if (!Array.isArray(raw)) return [];
    return raw.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      customerName: o.customerName,
      email: o.email,
      phone: o.phone,
      address: o.address,
      productSummary: o.productName,
      totalPrice: o.productPrice,
      itemImages: o.productImage ? [o.productImage] : [],
    }));
  } catch {
    return [];
  }
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [fabrics, setFabrics] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newFabric, setNewFabric] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [deleteFabricName, setDeleteFabricName] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const prods = await getProducts();
      // Item 4: Last updated product sabse pehle show hona chahiye
      setProducts(sortProductsByLatest(prods));
    } catch {
      setProducts([]);
      toast.error("Failed to load products");
    }

    let orderRows: AdminOrderRow[] = [];
    try {
      const apiOrders = (await apiGet("/admin/orders")) as Record<string, unknown>[];
      if (Array.isArray(apiOrders) && apiOrders.length > 0) {
        orderRows = apiOrders.map(normalizeApiOrder);
      }
    } catch {
      // fall through to localStorage
    }
    if (orderRows.length === 0) {
      orderRows = ordersFromLocalStorage();
    }

    setOrders(orderRows);

    try {
      const catalog = (await apiGet("/admin/catalog")) as ShopCatalog;
      setFabrics(Array.isArray(catalog?.fabrics) ? catalog.fabrics : []);
      setCategories(Array.isArray(catalog?.categories) ? catalog.categories : []);
    } catch {
      setFabrics([]);
      setCategories([]);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    try {
      await deleteProduct(deleteProductId);
      await loadData();
      setDeleteProductId(null);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // Item 8: 1-click toggle stock availability from Admin Dashboard
  const handleToggleStock = async (product: Product) => {
    const nextStatus = !product.isOutOfStock;
    try {
      await apiPut(`/admin/products/${product._id}`, {
        isOutOfStock: nextStatus,
        stock: nextStatus ? 0 : 10,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? { ...p, isOutOfStock: nextStatus, stock: nextStatus ? 0 : 10 }
            : p
        )
      );
      toast.success(nextStatus ? "Marked as Out of Stock" : "Marked as In Stock");
    } catch {
      toast.error("Failed to update stock status");
    }
  };

  const handleAddFabric = async () => {
    if (!newFabric.trim()) return;
    const name = newFabric.trim();
    try {
      await apiPost("/admin/catalog/fabric", { name });
      setNewFabric("");
      await loadData();
      toast.success("Fabric added successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add fabric.";
      toast.error(msg);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const name = newCategory.trim();
    try {
      await apiPost("/admin/catalog/category", { name });
      setNewCategory("");
      await loadData();
      toast.success("Category added successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add category.";
      toast.error(msg);
    }
  };

  // Item 6: Quick add common presets
  const handleAddFabricPreset = async (fabricName: string) => {
    try {
      await apiPost("/admin/catalog/fabric", { name: fabricName });
      await loadData();
      toast.success(`Added ${fabricName}`);
    } catch (err) {
      toast.error(`Could not add ${fabricName}`);
    }
  };

  const handleAddCategoryPreset = async (catName: string) => {
    try {
      await apiPost("/admin/catalog/category", { name: catName });
      await loadData();
      toast.success(`Added ${catName}`);
    } catch (err) {
      toast.error(`Could not add ${catName}`);
    }
  };

  const handleDeleteFabric = async () => {
    if (!deleteFabricName) return;
    try {
      await apiDelete(
        `/admin/catalog/fabric?name=${encodeURIComponent(deleteFabricName)}`
      );
      setDeleteFabricName(null);
      await loadData();
      toast.success("Fabric removed.");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      let msg = "Failed to remove fabric.";
      try {
        const parsed = JSON.parse(raw) as { message?: string };
        if (parsed?.message) msg = parsed.message;
      } catch {
        if (raw) msg = raw;
      }
      toast.error(msg);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryName) return;
    try {
      await apiDelete(
        `/admin/catalog/category?name=${encodeURIComponent(deleteCategoryName)}`
      );
      setDeleteCategoryName(null);
      await loadData();
      toast.success("Category removed.");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      let msg = "Failed to remove category.";
      try {
        const parsed = JSON.parse(raw) as { message?: string };
        if (parsed?.message) msg = parsed.message;
      } catch {
        if (raw) msg = raw;
      }
      toast.error(msg);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-heading text-xl font-bold text-primary">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                View Store
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{orders.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="fabrics-categories">Fabrics & Categories</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Sorted by latest updated first. Toggle stock status or edit attributes.
                  </CardDescription>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/admin/product/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Fabric</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div className="w-12 h-16 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 border flex items-center justify-center p-0.5">
                              <img
                                src={product.imageUrls?.[0]}
                                alt={product.name}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() => setPreviewPhotoUrl(product.imageUrls?.[0] || null)}
                                title="Click to view full image"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[220px]">
                            <p className="truncate font-semibold">{product.name}</p>
                            {/* Colors tag */}
                            {Array.isArray(product.colors) && product.colors.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {product.colors.map((c) => (
                                  <span
                                    key={c}
                                    className="text-[10px] px-1.5 py-0.2 rounded border bg-muted/50 text-foreground"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">₹{product.price.toLocaleString("en-IN")}</span>
                            {product.mrp && product.mrp > product.price && (
                              <p className="text-xs text-muted-foreground line-through">
                                ₹{product.mrp.toLocaleString("en-IN")}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{product.fabric}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{product.category}</Badge>
                          </TableCell>

                          {/* Item 8: Stock Status Column & Quick Toggle */}
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStock(product)}
                              className={`h-7 px-2.5 text-xs font-semibold rounded-full border ${
                                product.isOutOfStock
                                  ? "text-destructive border-destructive/40 bg-destructive/10 hover:bg-destructive/20"
                                  : "text-green-700 border-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
                              }`}
                            >
                              {product.isOutOfStock ? (
                                <>
                                  <Ban className="w-3 h-3 mr-1" />
                                  Out of Stock
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  In Stock
                                </>
                              )}
                            </Button>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/admin/product/${product._id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteProductId(product._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No products yet. Add your first product!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fabrics & Categories Tab */}
          <TabsContent value="fabrics-categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fabrics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Fabrics</CardTitle>
                      <CardDescription>
                        Manage saree fabrics (Cotton, Silk, Cotton-Silk, etc.)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Cotton-Silk"
                      value={newFabric}
                      onChange={(e) => setNewFabric(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFabric())}
                    />
                    <Button onClick={handleAddFabric} className="bg-primary hover:bg-primary/90">
                      Add
                    </Button>
                  </div>

                  {/* Item 6: Quick Add Presets */}
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Quick Add Common Fabrics:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_FABRICS.filter((f) => !fabrics.includes(f))
                        .slice(0, 8)
                        .map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => handleAddFabricPreset(f)}
                            className="text-xs px-2 py-0.5 rounded border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-primary" />
                            + {f}
                          </button>
                        ))}
                    </div>
                  </div>

                  <ul className="space-y-1.5 max-h-64 overflow-y-auto divide-y divide-border">
                    {fabrics.map((f) => (
                      <li key={f} className="flex items-center justify-between py-2">
                        <span className="font-medium text-sm">{f}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-7 w-7"
                          onClick={() => setDeleteFabricName(f)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Categories</CardTitle>
                      <CardDescription>
                        Manage saree categories (Festive, Casual, Wedding, etc.)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Festive Wear"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                    />
                    <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90">
                      Add
                    </Button>
                  </div>

                  {/* Item 1 & Item 6: Quick Add Category Presets */}
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Quick Add Common Categories:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_CATEGORIES.filter((c) => !categories.includes(c))
                        .slice(0, 8)
                        .map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleAddCategoryPreset(c)}
                            className="text-xs px-2 py-0.5 rounded border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-primary" />
                            + {c}
                          </button>
                        ))}
                    </div>
                  </div>

                  <ul className="space-y-1.5 max-h-64 overflow-y-auto divide-y divide-border">
                    {categories.map((c) => (
                      <li key={c} className="flex items-center justify-between py-2">
                        <span className="font-medium text-sm">{c}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-7 w-7"
                          onClick={() => setDeleteCategoryName(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Item 2: Orders Tab with Product Photos */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Orders received with product photos, customer details, and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Ordered Saree</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          {/* Item 2: Order Photo Column */}
                          <TableCell>
                            {order.itemImages && order.itemImages.length > 0 ? (
                              <div className="flex gap-1 items-center">
                                {order.itemImages.slice(0, 2).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="w-12 h-16 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 border flex items-center justify-center p-0.5 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                                    onClick={() => setPreviewPhotoUrl(img)}
                                    title="Click to view full size photo"
                                  >
                                    <img
                                      src={img}
                                      alt="Ordered Saree"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-12 h-16 rounded bg-muted/60 border flex items-center justify-center text-[10px] text-muted-foreground text-center p-1">
                                No photo
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
                                {order.address || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2 text-sm font-medium">
                              {order.productSummary}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-primary whitespace-nowrap">
                            ₹{order.totalPrice.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <p className="font-medium text-foreground">{order.phone}</p>
                              <p className="text-muted-foreground truncate max-w-[150px]">{order.email || "—"}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No orders placed yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Image Preview Modal (Issue 2 & Issue 5) */}
      <Dialog open={!!previewPhotoUrl} onOpenChange={() => setPreviewPhotoUrl(null)}>
        <DialogContent className="max-w-xl p-4 flex flex-col items-center justify-center bg-background">
          <DialogTitle className="text-base font-semibold mb-2">Saree Photo</DialogTitle>
          <div className="max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900 p-2">
            {previewPhotoUrl && (
              <img
                src={previewPhotoUrl}
                alt="Product Preview"
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}
          </div>
          <Button onClick={() => setPreviewPhotoUrl(null)} className="mt-3 w-full" variant="outline">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saree</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saree? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Fabric Confirmation */}
      <AlertDialog open={!!deleteFabricName} onOpenChange={() => setDeleteFabricName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Fabric</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{deleteFabricName}&quot;? This will fail if any product uses this fabric.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFabric}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryName} onOpenChange={() => setDeleteCategoryName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{deleteCategoryName}&quot;? This will fail if any product uses this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
