import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product } from "@/types";
import { addOrder } from "@/lib/storage";
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

const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  address: z.string().min(10, "Address must be at least 10 characters").max(500),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const OrderForm = ({ product, isOpen, onClose }: OrderFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = (values: OrderFormData) => {
    const data = {
      customerName: values.customerName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
    };
    addOrder(data);
    setIsSubmitted(true);
    form.reset();
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <DialogTitle className="font-heading text-2xl mb-2">Order Placed Successfully!</DialogTitle>
            <DialogDescription className="text-muted-foreground mb-4">
              Thank you for your order. We will contact you shortly with the details.
            </DialogDescription>
            <div className="bg-muted p-4 rounded-lg w-full mb-4">
              <p className="font-semibold">{product.name}</p>
              <p className="text-primary text-lg">₹{product.price.toLocaleString("en-IN")}</p>
            </div>
            <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Order Now</DialogTitle>
              <DialogDescription>
                Fill in your details to order <span className="font-semibold">{product.name}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex gap-4">
                <img
                  src={product.imageUrls?.[0]}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.fabric}</p>
                  <p className="text-primary font-bold">₹{product.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
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
                  Place Order
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
