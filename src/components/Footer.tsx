import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-2xl font-bold mb-4">
              Saree Sanskriti
            </h3>
            <p className="text-primary-foreground/80 leading-relaxed">
              Celebrating the timeless elegance of Indian handloom sarees. Each
              piece tells a story of tradition, craftsmanship, and heritage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200"
                >
                  Shop Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/login"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200"
                >
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">
              Contact Us
            </h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>Email: contact@sareesanskriti.com</li>
              {/* <li>Phone: +91 98765 43210</li> */}
              <li>Location: Rajasthan,India</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60">
            © {new Date().getFullYear()} Saree Sanskriti. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
