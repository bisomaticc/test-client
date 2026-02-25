import { useState, useMemo, useEffect } from "react";
import { getProducts } from "@/lib/storage";
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

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prods = await getProducts();
        if (mounted) setProducts(prods);
      } catch (err) {
        if (mounted) setProducts([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fabricFilter, setFabricFilter] = useState("all");

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return cats.sort();
  }, [products]);

  const fabrics = useMemo(() => {
    const fabs = [...new Set(products.map((p) => p.fabric))];
    return fabs.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      const matchesFabric =
        fabricFilter === "all" || product.fabric === fabricFilter;
      return matchesSearch && matchesCategory && matchesFabric;
    });
  }, [products, searchQuery, categoryFilter, fabricFilter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0ms]">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Saree Collection
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our wide range of authentic Indian sarees, handpicked for quality and elegance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sarees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
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
            <SelectTrigger className="w-full md:w-[180px]">
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
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <div
                key={product.id}
                className="animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
