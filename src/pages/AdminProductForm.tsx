import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  isAdminAuthenticated,
  getProductById,
  addProduct,
  updateProduct,
} from "@/lib/storage";
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
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  price: z.number().min(1, "Price must be at least ₹1"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  fabric: z.string().min(2, "Fabric is required"),
  category: z.string().min(2, "Category is required"),
  imageUrls: z
    .array(z.object({ value: z.string() }))
    .min(1, "Add at least one image URL"),
});

type ProductFormData = z.infer<typeof productSchema>;

function convertDriveUrl(url: string): string {
  if (!url) return url;

  try {
    const parsedUrl = new URL(url);

    // Handle /file/d/FILE_ID/view format
    const match = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }

    // Handle open?id=FILE_ID format
    const idParam = parsedUrl.searchParams.get("id");
    if (idParam) {
      return `https://lh3.googleusercontent.com/d/${idParam}`;
    }

    return url;
  } catch {
    return url;
  }
}

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== "new";
  const fabrics = [
    "Silk",
    "Cotton",
    "Chiffon",
    "Georgette",
    "Banarasi",
    "Kanjivaram",
  ];
  const categories = [
    "Weddings",
    "Parties",
    "Casual",
    "Festive",
    "Bridal",
  ];

  // Initialize form with zod resolver and imageUrls as an array
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

  const [previewIndex, setPreviewIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }

    if (isEditing) {
      (async () => {
        const product = await getProductById(id!);
        if (product) {
          // Normalize product image urls whether backend returns imageUrl (string) or imageUrls (array)
          const imageUrls = Array.isArray((product as any).imageUrls)
            ? (product as any).imageUrls.map((u: string) => ({ value: String(u) }))
            : (product as any).imageUrl
            ? [{ value: String((product as any).imageUrl) }]
            : [{ value: "" }];

          form.reset({
            name: product.name || "",
            price: (product as any).price || 0,
            description: product.description || "",
            fabric: product.fabric || "",
            category: product.category || "",
            imageUrls,
          });

          // set preview to first valid url
          const firstUrl = imageUrls.find((i: any) => i.value && i.value.startsWith("http"));
          setImagePreview(firstUrl ? firstUrl.value : "");
        } else {
          navigate("/admin/dashboard");
        }
      })();
    }
  }, [id, isEditing, navigate, form]);

  const imageUrls = form.watch("imageUrls")?.map((item) => convertDriveUrl(item.value.trim())) ?? [];
  const previewUrl = imageUrls?.[previewIndex]?.startsWith("http")
    ? imageUrls[previewIndex]
    : imageUrls?.[0]?.startsWith("http")
    ? imageUrls[0]
    : "";

  const onSubmit = async (values: ProductFormData) => {
    const urls = values.imageUrls
      .map((i) => convertDriveUrl(i.value.trim()))
      .filter((u) => u.startsWith("http"));
    if (urls.length === 0) {
      toast.error("Add at least one valid image URL.");
      return;
    }

    const productData = {
      name: values.name,
      price: values.price,
      description: values.description,
      fabric: values.fabric,
      category: values.category,
      imageUrls: urls,
    };

    try {
      if (isEditing) {
        await updateProduct(id!, productData);
        toast("Product updated successfully!");
      } else {
        await addProduct(productData);
        toast("Product added successfully!");
      }
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast(err?.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isEditing ? "Edit Product" : "Add New Product"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the product details below"
                : "Fill in the details to add a new saree to your collection"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Kanchipuram Silk Saree"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 5999"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fabric"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabric</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fabric" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(() => {
                              const list = fabrics;
                              const current = field.value;
                              const options =
                                current && !list.includes(current)
                                  ? [current, ...list]
                                  : list;
                              return options.map((fab) => (
                                <SelectItem key={fab} value={fab}>
                                  {fab}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(() => {
                              const list = categories;
                              const current = field.value;
                              const options =
                                current && !list.includes(current)
                                  ? [current, ...list]
                                  : list;
                              return options.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the saree, its features, occasion suitability, etc."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Images (URLs)</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ value: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add image
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`imageUrls.${index}.value`}
                      render={({ field: f }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="https://example.com/saree-image.jpg"
                                {...f}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive shrink-0"
                              onClick={() => remove(index)}
                              disabled={fields.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  {previewUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Preview
                      </p>
                      <div className="flex gap-2 flex-wrap items-start">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-32 h-40 object-cover rounded border"
                          onError={() => {}}
                        />
                        {imageUrls.length > 1 && (
                          <div className="flex gap-1 flex-wrap">
                            {imageUrls.map((url, i) =>
                              url.startsWith("http") ? (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPreviewIndex(i)}
                                  className={`w-10 h-10 rounded border-2 object-cover overflow-hidden ${
                                    previewIndex === i
                                      ? "border-primary"
                                      : "border-border"
                                  }`}
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : null,
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Update Product" : "Add Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminProductForm;
