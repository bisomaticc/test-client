import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import CheckoutForm from "@/components/CheckoutForm";
import { useState } from "react";

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (itemCount === 0 && !isCheckoutOpen) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Add beautiful sarees from our collection to get started.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Shop Sarees
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
          Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <div
                key={item.productId}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border bg-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link
                  to={`/product/${item.productId}`}
                  className="shrink-0 w-full sm:w-28 aspect-[3/4] overflow-hidden rounded-md bg-muted"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-heading font-semibold text-foreground hover:text-primary line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-primary font-bold mt-1">
                      ₹{item.price.toLocaleString("en-IN")} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-input rounded-md">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-r-none"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-l-none"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remove from cart"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="sm:text-right font-semibold text-foreground">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1 animate-fade-in-up opacity-0 [animation-fill-mode:forwards] [animation-delay:200ms]">
            <div className="sticky top-24 p-6 rounded-lg border border-border bg-card space-y-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Order summary
              </h2>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Proceed to checkout
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/products">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutForm
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          clearCart();
          setIsCheckoutOpen(false);
        }}
      />
    </Layout>
  );
};

export default Cart;
