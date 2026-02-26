import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const productSchema = z.object({
  name: z.string().min(2),
  price: z.number().min(1),
  description: z.string().min(10),
  fabric: z.string(),
  category: z.string(),
  imageUrls: z.array(z.object({ value: z.string() })).min(1),
});

type ProductFormData = z.infer<typeof productSchema>;

const fabrics = ["Silk", "Cotton", "Chiffon", "Georgette", "Banarasi", "Kanjivaram"];
const categories = ["Weddings", "Parties", "Casual", "Festive", "Bridal"];

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== "new";

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      fabric: "",
      category: "",
      imageUrls: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "imageUrls",
  });

  // 🔐 simple admin guard
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");
  }, [navigate]);

  // ✏️ load product when editing
  useEffect(() => {
    if (!isEditing) return;

    (async () => {
      try {
        const product = await apiGet(`/products/${id}`);
        form.reset({
          name: product.name,
          price: product.price,
          description: product.description,
          fabric: product.fabric,
          category: product.category,
          imageUrls: product.imageUrls.map((u: string) => ({ value: u })),
        });
      } catch {
        toast.error("Failed to load product");
        navigate("/admin/dashboard");
      }
    })();
  }, [id, isEditing, form, navigate]);

  const onSubmit = async (values: ProductFormData) => {
    const productData = {
      ...values,
      imageUrls: values.imageUrls.map((i) => i.value),
    };

    try {
      if (isEditing) {
        await apiPut(`/admin/products/${id}`, productData);
        toast.success("Product updated successfully");
      } else {
        await apiPost("/admin/products", productData);
        toast.success("Product added successfully");
      }
      navigate("/admin/dashboard");
    } catch {
      toast.error("Failed to save product");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/admin/dashboard" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Product" : "Add Product"}</CardTitle>
            <CardDescription>
              {isEditing ? "Update product details" : "Add a new saree"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* fabric & category */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "fabric", list: fabrics },
                    { name: "category", list: categories },
                  ].map(({ name, list }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{name}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${name}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {list.map((v) => (
                                <SelectItem key={v} value={v}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea rows={4} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* images */}
                <div>
                  <div className="flex justify-between mb-2">
                    <FormLabel>Images</FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ value: "" })}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>

                  {fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2 mb-2">
                      <Input {...form.register(`imageUrls.${i}.value`)} />
                      <Button type="button" variant="ghost" onClick={() => remove(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="bg-primary">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Update" : "Add"} Product
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminProductForm;
