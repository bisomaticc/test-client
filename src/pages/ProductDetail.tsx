import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import OrderForm from "@/components/OrderForm";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE = "https://test-server-silk.vercel.app/api";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [addQty, setAddQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error("Product not found");

        const data = await res.json();
        if (mounted) setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground text-lg">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
            Product Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            The saree you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = product.imageUrls?.length ? product.imageUrls : [];
  const currentImage = images[imageIndex] ?? images[0];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
              {currentImage && (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}

              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                {product.category}
              </Badge>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setImageIndex((i) =>
                        i <= 0 ? images.length - 1 : i - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() =>
                      setImageIndex((i) =>
                        i >= images.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {product.name}
            </h1>

            <p className="text-3xl font-bold text-primary mb-6">
              ₹{product.price.toLocaleString("en-IN")}
            </p>

            <div className="space-y-4 mb-8">
              <p><strong>Fabric:</strong> {product.fabric}</p>
              <p><strong>Category:</strong> {product.category}</p>
            </div>

            <p className="text-muted-foreground mb-8">
              {product.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="number"
                min={1}
                max={99}
                value={addQty}
                onChange={(e) =>
                  setAddQty(Math.max(1, Math.min(99, Number(e.target.value))))
                }
                className="w-20"
              />

              <Button
                size="lg"
                onClick={() => {
                  addItem(
                    {
                      productId: product._id,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrls?.[0] ?? "",
                    },
                    addQty
                  );
                  setAddQty(1);
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsOrderFormOpen(true)}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Order Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <OrderForm
        product={product}
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
      />
    </Layout>
  );
};

export default ProductDetail;
