import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById } from "@/lib/storage";
import Layout from "@/components/Layout";
import OrderForm from "@/components/OrderForm";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = id ? getProductById(id) : null;
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [addQty, setAddQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const { addItem } = useCart();
  const images = product?.imageUrls?.length ? product.imageUrls : [];
  const currentImage = images[imageIndex] ?? images[0];

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]">
          <Link
            to="/products"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-fade-in-up opacity-0 [animation-fill-mode:forwards] [animation-delay:80ms]">
          {/* Product Images */}
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
                    type="button"
                    onClick={() => setImageIndex((i) => (i <= 0 ? images.length - 1 : i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i >= images.length - 1 ? 0 : i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    className={`shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      i === imageIndex ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              {product.name}
            </h1>

            <p className="text-3xl font-bold text-primary mb-6">
              ₹{product.price.toLocaleString("en-IN")}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Fabric:</span>
                <span className="text-foreground">{product.fabric}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Category:</span>
                <span className="text-foreground">{product.category}</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                Description
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="qty" className="text-sm font-medium text-muted-foreground">
                  Quantity
                </label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  max={99}
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                  className="w-20"
                />
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg"
                onClick={() => {
                  addItem(
                    {
                      productId: product.id,
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
                className="text-lg"
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
