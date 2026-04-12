import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  isAdminAuthenticated,
  logoutAdmin,
  getProducts,
  deleteProduct,
} from "@/lib/storage";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
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
import { Package, ShoppingCart, Plus, LogOut, Pencil, Trash2, Home, Layers, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

function normalizeApiOrder(o: Record<string, unknown>): AdminOrderRow {
  const id = String((o._id as string | undefined) ?? (o.id as string | undefined) ?? "");
  const items = Array.isArray(o.items) ? (o.items as { name?: string; qty?: number; price?: number }[]) : [];
  const productSummary = items.length
    ? items.map((i) => `${i.name ?? "Item"} ×${i.qty ?? 1}`).join(", ")
    : "—";
  let totalPrice = typeof o.totalAmount === "number" ? o.totalAmount : 0;
  if (!totalPrice && items.length) {
    totalPrice = items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  }
  const createdAt =
    typeof o.createdAt === "string"
      ? o.createdAt
      : o.createdAt instanceof Date
        ? o.createdAt.toISOString()
        : new Date().toISOString();

  return {
    id,
    createdAt,
    customerName: String(o.customerName ?? ""),
    email: String(o.email ?? ""),
    phone: String(o.phone ?? ""),
    address: String(o.address ?? ""),
    productSummary,
    totalPrice,
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
      setProducts(prods);
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
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="fabrics-categories">Fabrics & Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage your saree inventory</CardDescription>
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
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Fabric</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <img
                              src={product.imageUrls?.[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>₹{product.price.toLocaleString("en-IN")}</TableCell>
                          <TableCell>{product.fabric}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{product.category}</Badge>
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

          <TabsContent value="fabrics-categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Fabrics</CardTitle>
                    <CardDescription>
                      Add or remove fabric types (stored in MongoDB Atlas)
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New fabric name"
                      value={newFabric}
                      onChange={(e) => setNewFabric(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFabric())}
                    />
                    <Button onClick={handleAddFabric} className="bg-primary hover:bg-primary/90">
                      Add
                    </Button>
                  </div>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {fabrics.map((f) => (
                      <li key={f} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="font-medium">{f}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => setDeleteFabricName(f)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                      Add or remove categories (stored in MongoDB Atlas)
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                    />
                    <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90">
                      Add
                    </Button>
                  </div>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((c) => (
                      <li key={c} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="font-medium">{c}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => setDeleteCategoryName(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>View customer orders (from server when available)</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="text-sm">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {order.address || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2 text-sm">{order.productSummary}</span>
                          </TableCell>
                          <TableCell>₹{order.totalPrice.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{order.email || "—"}</p>
                              <p className="text-muted-foreground">{order.phone}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No orders yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
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
