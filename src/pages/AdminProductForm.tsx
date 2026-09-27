import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { ShopCatalog } from "@/types";
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
import { ArrowLeft, Save, Plus, Trash2, Eye, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { DEFAULT_FABRICS, DEFAULT_CATEGORIES } from "@/lib/catalogConstants";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  price: z.coerce.number().min(1, "Selling price must be at least 1"),
  mrp: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(0, "MRP cannot be negative").optional()
  ),
  description: z.string().min(10, "Description must be at least 10 characters"),
  fabric: z.string().min(1, "Fabric is required"),
  category: z.string().min(1, "Category is required"),
  colorsInput: z.string().optional(),
  isOutOfStock: z.boolean().default(false),
  imageUrls: z
    .array(z.object({ value: z.string().url("Valid image URL required") }))
    .min(1, "At least one image URL is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

// changes Google Drive URLs to direct image links
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

  const [previewIndex, setPreviewIndex] = useState(0);
  const [fabrics, setFabrics] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      mrp: undefined as number | undefined,
      description: "",
      fabric: "",
      category: "",
      colorsInput: "",
      isOutOfStock: false,
      imageUrls: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "imageUrls",
  });

  // 🔐 Admin guard
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const catalog = (await apiGet("/admin/catalog")) as ShopCatalog;
        setFabrics(Array.isArray(catalog?.fabrics) ? catalog.fabrics : []);
        setCategories(Array.isArray(catalog?.categories) ? catalog.categories : []);
      } catch {
        // Fall back gracefully to built-in presets
      } finally {
        setCatalogLoaded(true);
      }
    })();
  }, []);

  // ✏️ Load product when editing
  useEffect(() => {
    if (!isEditing) return;

    (async () => {
      try {
        const product = await apiGet(`/products/${id}`);
        const initialCats = Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories
          : product.category
          ? [product.category]
          : [];
        setSelectedCategories(initialCats);

        form.reset({
          name: product.name,
          price: product.price,
          mrp:
            product.mrp != null && !Number.isNaN(Number(product.mrp))
              ? Number(product.mrp)
              : undefined,
          description: product.description ?? "",
          fabric: product.fabric || "",
          category: product.category || (initialCats[0] || ""),
          colorsInput: Array.isArray(product.colors)
            ? product.colors.join(", ")
            : "",
          isOutOfStock: Boolean(product.isOutOfStock),
          imageUrls: Array.isArray(product.imageUrls) && product.imageUrls.length > 0
            ? product.imageUrls.map((u: string) => ({ value: u }))
            : [{ value: "" }],
        });
      } catch {
        toast.error("Failed to load product");
        navigate("/admin/dashboard");
      }
    })();
  }, [id, isEditing, form, navigate]);

  const watchedImageUrls =
    form.watch("imageUrls")?.map((item) => convertDriveUrl(item.value.trim())) ?? [];
  const fabricValue = form.watch("fabric");
  const categoryValue = form.watch("category");

  // Item 1 & Item 6: Broad category and fabric options
  const fabricOptions = useMemo(() => {
    const set = new Set([...DEFAULT_FABRICS, ...fabrics]);
    if (fabricValue) set.add(fabricValue);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [fabrics, fabricValue]);

  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...categories]);
    if (categoryValue) set.add(categoryValue);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, categoryValue]);

  const previewUrl =
    watchedImageUrls?.[previewIndex]?.startsWith("http")
      ? watchedImageUrls[previewIndex]
      : watchedImageUrls?.[0]?.startsWith("http")
      ? watchedImageUrls[0]
      : "";

  const onSubmit = async (values: ProductFormData) => {
    const urls = values.imageUrls
      .map((i) => convertDriveUrl(i.value.trim()))
      .filter((u) => u.startsWith("http"));

    if (urls.length === 0) {
      toast.error("Add at least one valid image URL.");
      return;
    }

    // Item 7: Parse colors
    const colors = (values.colorsInput || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const finalCategories = selectedCategories.length > 0
      ? selectedCategories
      : values.category
      ? [values.category]
      : [];
    const primaryCategory = finalCategories[0] || values.category || "";

    const productData = {
      name: values.name,
      price: values.price,
      mrp: values.mrp == null || Number.isNaN(values.mrp) ? null : values.mrp,
      description: values.description,
      fabric: values.fabric,
      category: primaryCategory,
      categories: finalCategories,
      colors,
      isOutOfStock: Boolean(values.isOutOfStock),
      stock: values.isOutOfStock ? 0 : 10,
      imageUrls: urls,
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
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link
            to="/admin/dashboard"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Product" : "Add New Saree"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update saree details, colors, and stock status"
                : "Fill in saree attributes to publish on the storefront"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saree Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Red, Blue & White Elegance Saree" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selling Price + MRP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            value={field.value === 0 || field.value == null ? "" : String(field.value)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              field.onChange(raw === "" ? 0 : Number(raw));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MRP (₹, Optional - for discount)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            placeholder="Optional MRP"
                            value={
                              field.value == null || Number.isNaN(field.value)
                                ? ""
                                : String(field.value)
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                field.onChange(undefined);
                                return;
                              }
                              const n = Number(raw);
                              field.onChange(Number.isFinite(n) ? n : undefined);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Item 1 & Item 6: Fabric & Category options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fabric"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabric</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Fabric" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {fabricOptions.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
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
                        <div className="flex items-center justify-between">
                          <FormLabel>Category (Multiple Allowed)</FormLabel>
                          {selectedCategories.length > 0 && (
                            <span className="text-xs text-primary font-medium">
                              {selectedCategories.length} selected
                            </span>
                          )}
                        </div>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            if (!selectedCategories.includes(val)) {
                              setSelectedCategories([...selectedCategories, val]);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Add Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {categoryOptions.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Selected Categories Tags */}
                        {selectedCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {selectedCategories.map((cat) => (
                              <span
                                key={cat}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                              >
                                {cat}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = selectedCategories.filter((c) => c !== cat);
                                    setSelectedCategories(next);
                                    if (field.value === cat) {
                                      field.onChange(next[0] || "");
                                    }
                                  }}
                                  className="hover:text-destructive"
                                  aria-label={`Remove ${cat}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quick Add popular categories */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-xs text-muted-foreground mr-1">Quick Add:</span>
                          {[
                            "Cotton",
                            "Silk",
                            "Cotton-Silk",
                            "Festive Wear",
                            "Weddings",
                            "Parties",
                            "Bridal",
                            "Casual Wear",
                            "Daily Wear",
                            "Office Wear",
                          ].map((cat) => {
                            const isAdded = selectedCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (isAdded) {
                                    const next = selectedCategories.filter((c) => c !== cat);
                                    setSelectedCategories(next);
                                    if (field.value === cat) field.onChange(next[0] || "");
                                  } else {
                                    setSelectedCategories([...selectedCategories, cat]);
                                    if (!field.value) field.onChange(cat);
                                  }
                                }}
                                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                                  isAdded
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/60 text-muted-foreground hover:bg-muted border-border"
                                }`}
                              >
                                {isAdded ? `✓ ${cat}` : `+ ${cat}`}
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Item 7: Colors options */}
                <FormField
                  control={form.control}
                  name="colorsInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Options (For sarees with multiple color choices)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Red, Blue, Pink (comma-separated)"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs text-muted-foreground mr-1">Quick Add:</span>
                        {[
                          "Red",
                          "Blue",
                          "Green",
                          "Pink",
                          "Yellow",
                          "Gold",
                          "Maroon",
                          "White",
                          "Black",
                          "Wine",
                          "Peach",
                        ].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => {
                              const current = field.value || "";
                              const arr = current
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              if (!arr.includes(col)) {
                                arr.push(col);
                                field.onChange(arr.join(", "));
                              }
                            }}
                            className="text-xs px-2 py-0.5 rounded border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors"
                          >
                            + {col}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item 8: Out of Stock setting */}
                <FormField
                  control={form.control}
                  name="isOutOfStock"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                      <div>
                        <FormLabel className="text-base font-semibold">Stock Status</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {field.value
                            ? "Marked as Out of Stock (customers will see Out of Stock badge)"
                            : "Marked as In Stock (available for immediate purchase)"}
                        </p>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "destructive" : "default"}
                          onClick={() => field.onChange(!field.value)}
                        >
                          {field.value ? "Out of Stock" : "In Stock"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={6}
                          className="min-h-[120px] whitespace-pre-wrap"
                          placeholder="Describe the saree fabric, weaving technique, pallu design, and care instructions..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item 5: Photos & Preview */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <FormLabel>Images (Google Drive or Direct URLs)</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        First image is primary. Full photo is displayed on site without cropping.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => append({ value: "" })}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Image
                    </Button>
                  </div>

                  {fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2 mb-2">
                      <Input
                        placeholder="https://drive.google.com/file/d/... or direct image URL"
                        {...form.register(`imageUrls.${i}.value`)}
                      />
                      {watchedImageUrls[i] && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setPreviewIndex(i)}
                          title="Preview this image"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Image Preview */}
                  {previewUrl && (
                    <div className="mt-4 p-3 border rounded-lg bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-2">
                        Preview ({previewIndex + 1} of {watchedImageUrls.length}) - Full Photo:
                      </span>
                      <div className="h-60 aspect-[3/4] overflow-hidden rounded border bg-background flex items-center justify-center p-1">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-5 w-5" />
                  {isEditing ? "Update Saree" : "Publish Saree"}
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
