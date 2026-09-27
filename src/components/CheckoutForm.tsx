import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addOrder } from "@/lib/storage";
import { apiPost } from "@/lib/api";
import { useCart } from "@/context/CartContext";
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

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  address: z.string().min(10, "Address must be at least 10 characters").max(500),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CheckoutForm = ({ isOpen, onClose, onSuccess }: CheckoutFormProps) => {
  const { items, clearCart } = useCart();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [orderMethod, setOrderMethod] = useState<"both" | "email">("both");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (values: CheckoutFormData) => {
    setSubmitting(true);
    const phoneNumber = "919079707132";

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const formattedItems = items.map((item) => ({
      productId: item.productId,
      name: item.selectedColor
        ? `${item.name} (Color: ${item.selectedColor})`
        : item.name,
      price: item.price,
      qty: item.quantity,
      imageUrls: item.imageUrl || "",
    }));

    // Item 2: Build detailed WhatsApp message including item photo links
    const waLines: string[] = [
      "New Saree Order",
      "",
      `Name: ${values.customerName}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone}`,
      `Address: ${values.address}`,
      "",
      "Items Ordered:",
    ];

    formattedItems.forEach((item) => {
      waLines.push(`• ${item.name} x${item.qty} - ₹${(item.price * item.qty).toLocaleString("en-IN")}`);
      if (item.imageUrls) {
        waLines.push(`  Photo: ${item.imageUrls}`);
      }
    });

    waLines.push("");
    waLines.push(`Total Amount: ₹${total.toLocaleString("en-IN")}`);

    const fallbackWaUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      waLines.join("\n")
    )}`;

    let generatedWaUrl = fallbackWaUrl;

    try {
      const payload = {
        customerName: values.customerName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        items: formattedItems,
      };

      const response = await apiPost("/checkout", payload);
      if (response?.whatsappURL) {
        generatedWaUrl = response.whatsappURL;
      }

      setWhatsappLink(generatedWaUrl);

      // Item 3: Order options - open WhatsApp if user selected WhatsApp or Both
      if (orderMethod === "both" && generatedWaUrl) {
        window.open(generatedWaUrl, "_blank");
      }
    } catch (error) {
      console.error("Checkout API failed:", error);
    } finally {
      // Save local storage backup
      items.forEach((item) => {
        addOrder({
          customerName: values.customerName,
          email: values.email,
          phone: values.phone,
          address: values.address,
          productId: item.productId,
          productName: item.selectedColor
            ? `${item.name} (Color: ${item.selectedColor})`
            : item.name,
          productPrice: item.price * item.quantity,
          productImage: item.imageUrl,
          selectedColor: item.selectedColor,
        });
      });

      setSubmitting(false);
      setIsSubmitted(true);
      form.reset();
    }
  };

  const handleClose = () => {
    if (isSubmitted) {
      clearCart();
      onSuccess();
    }
    setIsSubmitted(false);
    onClose();
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500 mb-3" />
            <DialogTitle className="font-heading text-2xl mb-2">
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mb-4">
              Thank you for shopping with Saree Sanskriti. We have sent a confirmation email with your order summary.
            </DialogDescription>

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
              Close & Clear Cart
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Your cart is empty. Add items to checkout.
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Checkout</DialogTitle>
              <DialogDescription>
                Confirm your details for {items.length} item
                {items.length !== 1 ? "s" : ""} (Total: ₹{total.toLocaleString("en-IN")})
              </DialogDescription>
            </DialogHeader>

            {/* Item 2: Item list with photos */}
            <div className="max-h-40 overflow-y-auto space-y-2 mb-3 rounded-lg border border-border p-2.5 bg-muted/40">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor || ""}`}
                  className="flex items-center gap-3 text-sm py-1 border-b last:border-0 border-border/50"
                >
                  {item.imageUrl && (
                    <div className="w-10 h-12 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                      {item.selectedColor && ` • Color: ${item.selectedColor}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-primary">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                          placeholder="House/flat no, street, landmark, city, pincode"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item 3: Order on WhatsApp or Email */}
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

export default CheckoutForm;
