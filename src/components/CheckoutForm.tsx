import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addOrder } from "@/lib/storage";
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
import { CheckCircle } from "lucide-react";

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

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = (values: CheckoutFormData) => {
  const phoneNumber = "919599819939";

  const orderLines = items
    .map(
      (item) =>
        `${item.name} x${item.quantity} - ₹${(
          item.price * item.quantity
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const message = `
New Saree Order

Name: ${values.customerName}
Email: ${values.email}
Phone: ${values.phone}

Address:
${values.address}

Items:
${orderLines}

Total: ₹${total.toLocaleString("en-IN")}
`;

  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  window.open(whatsappURL, "_blank");

  // optional local storage (your existing logic)
  items.forEach((item) => {
    addOrder({
      customerName: values.customerName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      productId: item.productId,
      productName: item.name,
      productPrice: item.price * item.quantity,
    });
  });

  clearCart();
  setIsSubmitted(true);
  form.reset();
};

  const handleClose = () => {
    if (isSubmitted) {
      onSuccess();
    }
    setIsSubmitted(false);
    onClose();
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500 mb-4" />
            <DialogTitle className="font-heading text-2xl mb-2">
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mb-4">
              Thank you for your order. We will contact you shortly with the details.
            </DialogDescription>
            <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
              Close
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
                Enter your details to place order for {items.length} item
                {items.length !== 1 ? "s" : ""} (₹{total.toLocaleString("en-IN")})
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-32 overflow-y-auto space-y-2 mb-4 rounded-lg border border-border p-3 bg-muted/50">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between text-sm"
                >
                  <span className="line-clamp-1">{item.name}</span>
                  <span className="shrink-0 font-medium">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your complete delivery address"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Place Order (₹{total.toLocaleString("en-IN")})
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutForm;
