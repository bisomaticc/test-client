import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import OrderForm from "@/components/OrderForm";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Check,
  Ban,
  MessageCircle,
} from "lucide-react";
import {
  getProductColors,
  isProductOutOfStock,
  COLOR_MAP,
} from "@/lib/catalogConstants";
import { Product } from "@/types";

const API_BASE = "https://test-server-silk.vercel.app/api";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [addQty, setAddQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Product not found");

        const data: Product = await res.json();
        if (mounted) {
          setProduct(data);
          const colors = getProductColors(data);
          if (colors.length > 0) {
            setSelectedColor(colors[0]);
          }
        }
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
          <p className="text-muted-foreground text-lg">Loading product details...</p>
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

  const images: string[] =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : [];
  const currentImage = images[imageIndex] ?? "";

  const colors = getProductColors(product);
  const outOfStock = isProductOutOfStock(product);

  const handleEnquireWhatsApp = () => {
    const phoneNumber = "919079707132";
    const text = `Hi, I am interested in *${product.name}* (Price: ₹${product.price.toLocaleString(
      "en-IN"
    )}).\nIt currently shows as Out of Stock. Could you please let me know when this saree will be available?\nProduct Link: ${
      window.location.href
    }`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Item 5: Saree photos full view without top and bottom cutting off */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100/90 dark:bg-neutral-900/90 border border-border flex items-center justify-center p-2 group">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setIsZoomOpen(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No image available
                </div>
              )}

              {/* Category Badge */}
              {product.category && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground shadow-sm">
                  {product.category}
                </Badge>
              )}

              {/* Item 8: Out of Stock Badge */}
              {outOfStock && (
                <Badge
                  variant="destructive"
                  className="absolute top-4 right-4 uppercase tracking-wider text-xs font-bold shadow-md"
                >
                  Out of Stock
                </Badge>
              )}

              {/* Zoom Button */}
              {currentImage && (
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
                  aria-label="View full resolution image"
                  title="View full resolution image"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) =>
                        i >= images.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    className={`relative w-20 aspect-[3/4] rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-2 transition-all p-0.5 ${
                      i === imageIndex
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {product.name}
            </h1>

            {/* Price & MRP */}
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              {product.mrp != null &&
                product.mrp > 0 &&
                product.mrp > product.price && (
                  <p className="text-xl text-muted-foreground line-through decoration-foreground/50">
                    ₹{Number(product.mrp).toLocaleString("en-IN")}
                  </p>
                )}
              <p className="text-3xl font-bold text-primary">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              {product.mrp != null &&
                product.mrp > 0 &&
                product.mrp > product.price && (
                  <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200">
                    Save ₹{(product.mrp - product.price).toLocaleString("en-IN")}
                  </Badge>
                )}
            </div>

            {/* Fabric & Category */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border border-border mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Fabric
                </span>
                <p className="font-medium text-foreground text-base mt-0.5">
                  {product.fabric || "Authentic Handloom"}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Category
                </span>
                <p className="font-medium text-foreground text-base mt-0.5">
                  {product.category || "Traditional"}
                </p>
              </div>
            </div>

            {/* Item 7: Color options show when saree has 2 or more colors */}
            {colors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    Available Colors:
                  </span>
                  {selectedColor && (
                    <span className="text-sm text-primary font-medium">
                      Selected: <strong className="font-semibold">{selectedColor}</strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/25 shadow-xs"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shadow-2xs shrink-0"
                          style={{ backgroundColor: COLOR_MAP[color] || "#888888" }}
                        />
                        <span>{color}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Product Details
              </h3>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {product.description}
              </p>
            </div>

            {/* Item 8: Out of stock indicator NEAR Add to Cart */}
            <div className="p-4 rounded-lg border border-border bg-card shadow-xs mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Availability</span>
                {outOfStock ? (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1.5 px-3 py-1 font-semibold"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Out of Stock
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 text-green-700 bg-green-50 border-green-200 px-3 py-1 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    In Stock (Ready to Dispatch)
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              {outOfStock ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      disabled
                      className="flex-1 text-destructive border-destructive/30 bg-destructive/5 cursor-not-allowed opacity-75"
                    >
                      <Ban className="mr-2 h-5 w-5" />
                      Add to Cart (Out of Stock)
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium"
                    onClick={handleEnquireWhatsApp}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Enquire on WhatsApp for Restock
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center border border-input rounded-md bg-background">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={addQty}
                      onChange={(e) =>
                        setAddQty(Math.max(1, Math.min(99, Number(e.target.value))))
                      }
                      className="w-16 border-0 text-center font-medium focus-visible:ring-0"
                    />
                  </div>

                  <Button
                    size="lg"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      addItem(
                        {
                          productId: product._id,
                          name: product.name,
                          price: product.price,
                          imageUrl: product.imageUrls?.[0] ?? "",
                          selectedColor: selectedColor || undefined,
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
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-6"
                    onClick={() => setIsOrderFormOpen(true)}
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Order Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal (Issue 5: Inspect full photo without cuts) */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-3 flex flex-col items-center justify-center bg-black/95 border-0">
          <DialogTitle className="sr-only">Full Photo Preview</DialogTitle>
          <div className="relative w-full h-[85vh] flex items-center justify-center">
            {currentImage && (
              <img
                src={currentImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Single-product Order Now modal with WhatsApp & Email (Item 2 & Item 3) */}
      <OrderForm
        product={product}
        selectedColor={selectedColor}
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
      />
    </Layout>
  );
};

export default ProductDetail;
