import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items, itemCount } = useCart();
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-90">
            <span className="font-heading text-2xl md:text-3xl font-bold text-primary">
              Saree Sanskriti
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-foreground/80 hover:text-primary transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-foreground/80 hover:text-primary transition-colors duration-200 font-medium"
            >
              Shop Sarees
            </Link>
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Link
                  to="/cart"
                  className="text-foreground/80 hover:text-primary transition-colors duration-200 font-medium flex items-center gap-1"
                >
                  <span className="relative inline-flex">
                    <ShoppingCart className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold animate-scale-in">
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </span>
                  Cart
                </Link>
              </HoverCardTrigger>
              <HoverCardContent side="bottom" align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border">
                  <h3 className="font-heading font-semibold text-foreground">
                    Your cart ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      Your cart is empty
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {items.map((item) => (
                        <li key={item.productId} className="flex gap-3 p-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-14 w-11 shrink-0 rounded object-cover bg-muted"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground shrink-0">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="p-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">
                        ₹{cartTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Link to="/cart">View cart & checkout</Link>
                    </Button>
                  </div>
                )}
                {items.length === 0 && (
                  <div className="p-3 border-t border-border">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/products">Shop sarees</Link>
                    </Button>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
            <Link
              to="/admin/login"
              className="text-foreground/60 hover:text-primary transition-colors text-sm"
            >
              Admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop Sarees
              </Link>
              <Link
                to="/cart"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
              <Link
                to="/admin/login"
                className="text-foreground/60 hover:text-primary transition-colors text-sm py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
