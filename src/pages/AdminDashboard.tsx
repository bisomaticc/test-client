import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAdminAuthenticated, logoutAdmin, getProducts, deleteProduct } from "@/lib/storage";
import { Product, Order } from "@/types";
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
      // read orders from localStorage as the storage module doesn't export getOrders
      setOrders(JSON.parse(localStorage.getItem("orders") || "[]") as Order[]);
      // storage module doesn't export getFabrics; read fabrics from localStorage directly
      setFabrics(JSON.parse(localStorage.getItem("fabrics") || "[]") as string[]);
      setCategories(JSON.parse(localStorage.getItem("categories") || "[]") as string[]);
    } catch (err) {
      setProducts([]);
      setOrders([]);
      setFabrics([]);
      setCategories([]);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  const handleDeleteProduct = async () => {
    if (deleteProductId) {
      try {
        await deleteProduct(deleteProductId);
        await loadData();
        setDeleteProductId(null);
      } catch (err) {
        // ignore for now
      }
    }
  };

  const handleAddFabric = () => {
    if (!newFabric.trim()) return;
    const name = newFabric.trim();
    try {
      const existing = JSON.parse(localStorage.getItem("fabrics") || "[]") as string[];
      if (existing.includes(name)) {
        toast.error("Fabric already exists or name is invalid.");
        return;
      }
      existing.push(name);
      localStorage.setItem("fabrics", JSON.stringify(existing));
      setNewFabric("");
      loadData();
      toast("Fabric added successfully!");
    } catch {
      toast.error("Failed to add fabric.");
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const name = newCategory.trim();
    try {
      const existing = JSON.parse(localStorage.getItem("categories") || "[]") as string[];
      if (existing.includes(name)) {
        toast.error("Category already exists or name is invalid.");
        return;
      }
      existing.push(name);
      localStorage.setItem("categories", JSON.stringify(existing));
      setNewCategory("");
      loadData();
      toast("Category added successfully!");
    } catch {
      toast.error("Failed to add category.");
    }
  };

  const deleteFabricLocal = async (name: string) => {
    const prods = await getProducts();
    if (prods.some((p) => p.fabric === name)) {
      return false;
    }
    const fabs = (JSON.parse(localStorage.getItem("fabrics") || "[]") as string[]).filter((f) => f !== name);
    try {
      localStorage.setItem("fabrics", JSON.stringify(fabs));
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteFabric = async () => {
    if (deleteFabricName) {
      const ok = await deleteFabricLocal(deleteFabricName);
      if (ok) {
        loadData();
        setDeleteFabricName(null);
        toast("Fabric removed.");
      } else {
        toast.error("Cannot delete: some products use this fabric. Remove or change those products first.");
      }
    }
  };

  // local fallback for deleting categories when storage module doesn't export deleteCategory
    const deleteCategoryLocal = async (name: string) => {
      const prods = await getProducts();
      if (prods.some((p) => p.category === name)) {
        return false;
      }
      const cats = (JSON.parse(localStorage.getItem("categories") || "[]") as string[]).filter((c) => c !== name);
      try {
        localStorage.setItem("categories", JSON.stringify(cats));
        return true;
      } catch {
        return false;
      }
    };

  const handleDeleteCategory = async () => {
    if (deleteCategoryName) {
      const ok = await deleteCategoryLocal(deleteCategoryName);
      if (ok) {
        loadData();
        setDeleteCategoryName(null);
        toast("Category removed.");
      } else {
        toast.error("Cannot delete: some products use this category. Remove or change those products first.");
      }
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
      {/* Header */}
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
        {/* Stats */}
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

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="fabrics-categories">Fabrics & Categories</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
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
                        <TableRow key={product.id}>
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
                                <Link to={`/admin/product/${product.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteProductId(product.id)}
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
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Fabrics</CardTitle>
                    <CardDescription>Add or remove fabric types for products</CardDescription>
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
                    <CardDescription>Add or remove categories for products</CardDescription>
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

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>View customer orders</CardDescription>
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
                                {order.address}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{order.productName}</TableCell>
                          <TableCell>₹{order.productPrice.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{order.email}</p>
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

      {/* Delete Confirmation Dialog */}
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
