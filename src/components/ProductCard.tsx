import { useState } from "react";
import { Link } from "react-router-dom";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronLeft, ChevronRight, Ban } from "lucide-react";
import {
  getProductColors,
  isProductOutOfStock,
  COLOR_MAP,
} from "@/lib/catalogConstants";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const images = product.imageUrls?.length ? product.imageUrls : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex] ?? images[0];

  const colors = getProductColors(product);
  const outOfStock = isProductOutOfStock(product);

  if (!currentImage) return null;

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  };
  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in flex flex-col h-full bg-card">
      <Link to={`/product/${product._id}`} className="block">
        {/* Item 5: Full photo display without top or bottom cut off using object-contain & neutral background */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100/90 dark:bg-neutral-900/90 flex items-center justify-center p-1">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Category Badge */}
          {product.category && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs shadow-xs">
              {product.category}
            </Badge>
          )}

          {/* Item 8: Out of stock badge */}
          {outOfStock && (
            <Badge
              variant="destructive"
              className="absolute top-3 right-3 uppercase font-semibold text-[11px] shadow-sm tracking-wide"
            >
              Out of Stock
            </Badge>
          )}

          {/* Image carousel arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentIndex ? "bg-primary" : "bg-black/40 hover:bg-black/70"
                    }`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Link>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/product/${product._id}`}>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1 line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">{product.fabric}</p>

          {/* Item 7: Show color options if saree has 2 or more colors */}
          {colors.length >= 2 && (
            <div className="flex items-center gap-1.5 my-2">
              <span className="text-xs text-muted-foreground font-medium">
                {colors.length} Colors:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {colors.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs inline-block"
                    style={{ backgroundColor: COLOR_MAP[c] || "#888888" }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-2 mt-2">
          {product.mrp != null &&
            product.mrp > 0 &&
            product.mrp > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{Number(product.mrp).toLocaleString("en-IN")}
              </span>
            )}
          <p className="text-xl font-bold text-primary">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
        {/* Item 8: Out of stock near Add to Cart */}
        {outOfStock ? (
          <Button
            variant="outline"
            className="flex-1 text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10 cursor-not-allowed"
            disabled
          >
            <Ban className="mr-2 h-4 w-4" />
            Out of Stock
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              addItem({
                productId: product._id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrls?.[0] ?? "",
                selectedColor: colors.length > 0 ? colors[0] : undefined,
              })
            }
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
        <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
          <Link to={`/product/${product._id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
