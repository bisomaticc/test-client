import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  DEFAULT_FABRICS,
  DEFAULT_CATEGORIES,
  sortProductsByLatest,
} from "@/lib/catalogConstants";
import { Product } from "@/types";

const API_BASE = "https://test-server-silk.vercel.app/api";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch products");

        const data: Product[] = await res.json();
        // Item 4: Last updated product sabse pehle show hona chahiye
        const sorted = sortProductsByLatest(data);
        if (mounted) setProducts(sorted);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fabricFilter, setFabricFilter] = useState("all");

  // Item 1 & Item 6: Expand category options like fabric (Cotton, Silk, Cotton-Silk, etc.)
  const categories = useMemo(() => {
    const fromProducts: string[] = [];
    products.forEach((p) => {
      if (p.category?.trim()) fromProducts.push(p.category.trim());
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c) => c?.trim() && fromProducts.push(c.trim()));
      }
    });
    const combined = Array.from(new Set([...fromProducts, ...DEFAULT_CATEGORIES]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const fabrics = useMemo(() => {
    const fromProducts = products.map((p) => p.fabric?.trim()).filter(Boolean);
    const combined = Array.from(new Set([...fromProducts, ...DEFAULT_FABRICS]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const allProductCategories = [
        product.category || "",
        ...(Array.isArray(product.categories) ? product.categories : []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.fabric?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allProductCategories.includes(searchQuery.toLowerCase());

      const targetCat = categoryFilter.toLowerCase();
      const matchesCategory =
        categoryFilter === "all" ||
        product.category?.toLowerCase() === targetCat ||
        product.category?.toLowerCase().includes(targetCat) ||
        (Array.isArray(product.categories) &&
          product.categories.some(
            (c) =>
              c.toLowerCase() === targetCat ||
              c.toLowerCase().includes(targetCat)
          ));

      const matchesFabric =
        fabricFilter === "all" ||
        product.fabric?.toLowerCase() === fabricFilter.toLowerCase() ||
        product.fabric?.toLowerCase().includes(fabricFilter.toLowerCase());

      return matchesSearch && matchesCategory && matchesFabric;
    });
  }, [products, searchQuery, categoryFilter, fabricFilter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Saree Collection
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our wide range of authentic Indian sarees, handpicked for quality and elegance.
          </p>
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Sarees
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by saree name, fabric, or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fabricFilter} onValueChange={setFabricFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Fabric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fabrics</SelectItem>
              {fabrics.map((fab) => (
                <SelectItem key={fab} value={fab}>
                  {fab}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Loading sarees...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <div
                key={product._id}
                className="animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No sarees found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setFabricFilter("all");
              }}
              className="mt-4 text-sm font-medium text-primary underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
