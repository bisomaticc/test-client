import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/storage";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, Shield } from "lucide-react";

const Index = () => {
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

  const featuredProducts = products.slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 pattern-overlay">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6">
              Authentic Sarees for
              <span className="text-primary block mt-2">Every Occasion</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in-up opacity-0 [animation-delay:150ms] [animation-fill-mode:forwards]">
              Discover the timeless elegance of handcrafted Indian sarees. From traditional 
              Kanchipuram silks to contemporary designs, find your perfect drape at Saree Sanskriti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                <Link to="/products">
                  Shop Sarees
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, bg: "bg-primary/10", iconColor: "text-primary", title: "Handcrafted Quality", desc: "Authentic artisan work" },
              { icon: Truck, bg: "bg-accent/10", iconColor: "text-accent", title: "Pan-India Delivery", desc: "Fast & secure shipping" },
              { icon: Shield, bg: "bg-secondary/30", iconColor: "text-secondary-foreground", title: "Quality Assured", desc: "100% genuine products" },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`flex items-center gap-4 justify-center md:justify-start animate-fade-in-up opacity-0 [animation-fill-mode:forwards]`}
                style={{ animationDelay: `${250 + i * 100}ms` }}
              >
                <div className={`p-3 ${item.bg} rounded-full transition-transform duration-300 hover:scale-110`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Collection
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated selection of exquisite sarees, each piece a celebration 
              of India's rich textile heritage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, i) => (
              <div
                key={product.id}
                className="animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${350 + i * 80}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12 animate-fade-in-up opacity-0 [animation-delay:700ms] [animation-fill-mode:forwards]">
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/products">
                View All Sarees
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground overflow-hidden">
        <div className="container mx-auto px-4 text-center animate-fade-in-up opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Elevate Your Ethnic Wardrobe
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of happy customers who have found their perfect saree with us. 
            Every purchase supports traditional Indian weavers and artisans.
          </p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link to="/products">
              Start Shopping
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
