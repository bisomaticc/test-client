import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product } from "@/types";
import { addOrder } from "@/lib/storage";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle, MessageCircle, Mail } from "lucide-react";

const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  address: z.string().min(10, "Address must be at least 10 characters").max(500),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  product: Product;
  selectedColor?: string;
  isOpen: boolean;
  onClose: () => void;
}

const OrderForm = ({ product, selectedColor, isOpen, onClose }: OrderFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [orderMethod, setOrderMethod] = useState<"both" | "email">("both");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (values: OrderFormData) => {
    setSubmitting(true);
    const phoneNumber = "919079707132";
    const productNameWithColor = selectedColor
      ? `${product.name} (Color: ${selectedColor})`
      : product.name;

    const primaryImage = product.imageUrls?.[0] || "";

    const orderPayload = {
      customerName: values.customerName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      items: [
        {
          productId: product._id,
          name: productNameWithColor,
          price: product.price,
          qty: 1,
          imageUrls: primaryImage,
        },
      ],
    };

    let waUrl = "";

    try {
      // 1. Submit to API backend (sends email & records in MongoDB)
      const response = await apiPost("/checkout", orderPayload);

      if (response?.whatsappURL) {
        waUrl = response.whatsappURL;
      } else {
        waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          `New Saree Order\n\nName: ${values.customerName}\nEmail: ${values.email}\nPhone: ${values.phone}\nAddress:\n${values.address}\n\nItem: ${productNameWithColor}\nPrice: ₹${product.price.toLocaleString(
            "en-IN"
          )}\nPhoto: ${primaryImage}\n\nTotal: ₹${product.price.toLocaleString("en-IN")}`
        )}`;
      }

      setWhatsappLink(waUrl);

      // Save locally as fallback
      addOrder({
        customerName: values.customerName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        productId: product._id,
        productName: productNameWithColor,
        productPrice: product.price,
        productImage: primaryImage,
        selectedColor,
      });

      // Item 3: Order on WhatsApp or Email or both
      if (orderMethod === "both" && waUrl) {
        window.open(waUrl, "_blank");
      }

      setIsSubmitted(true);
      form.reset();
    } catch (error) {
      console.error("Single-product checkout API failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  const primaryImage = product.imageUrls?.[0] || "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mb-3" />
            <DialogTitle className="font-heading text-2xl mb-2">Order Received!</DialogTitle>
            <DialogDescription className="text-muted-foreground mb-4">
              Thank you for ordering with Saree Sanskriti. An email confirmation has been dispatched.
            </DialogDescription>

            {/* Item 2: Order summary with product photo */}
            <div className="bg-muted/70 p-4 rounded-lg w-full mb-5 flex items-center gap-4 text-left border">
              {primaryImage && (
                <div className="w-16 h-20 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border">
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground line-clamp-1">{product.name}</p>
                {selectedColor && (
                  <p className="text-xs text-muted-foreground">Color: <strong className="text-foreground">{selectedColor}</strong></p>
                )}
                <p className="text-primary font-bold text-lg mt-0.5">₹{product.price.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Item 3: WhatsApp option */}
            {whatsappLink && (
              <Button
                onClick={() => window.open(whatsappLink, "_blank")}
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium mb-2"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Open WhatsApp Chat
              </Button>
            )}

            <Button onClick={handleClose} variant="outline" className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Order Now</DialogTitle>
              <DialogDescription>
                Fill in your delivery details to order this handcrafted saree.
              </DialogDescription>
            </DialogHeader>

            {/* Item 2: Product preview with photo */}
            <div className="bg-muted/60 p-3 rounded-lg mb-4 border flex items-center gap-3">
              {primaryImage && (
                <div className="w-14 h-18 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border">
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground line-clamp-1 text-sm">{product.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{product.fabric}</span>
                  {selectedColor && (
                    <span className="font-medium text-foreground bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Color: {selectedColor}
                    </span>
                  )}
                </div>
                <p className="text-primary font-bold text-base mt-1">₹{product.price.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit mobile" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complete Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="House/flat, street, landmark, city, pincode"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item 3: Order options (WhatsApp or Email) */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    onClick={() => setOrderMethod("both")}
                    className="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Order via WhatsApp
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    onClick={() => setOrderMethod("email")}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Order via Email
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
