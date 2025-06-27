
"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Search,
  ShoppingCart,
  Ticket,
} from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Coupon,
  Product,
  ProductSearchApiResponse,
  ProductSearchResult,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { searchProducts } from "@/app/actions";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./ui/badge";
import { getCurrencySymbol, slugify } from "@/lib/utils";

const LANGUAGE_OPTIONS = ["en_US", "fr_FR", "de_DE", "pt_BR"];
const SORT_OPTIONS = [
  { value: "retailprice", label: "Retail Price" },
  { value: "productname", label: "Product Name" },
];
const SORT_TYPE_OPTIONS = ["asc", "dsc"];

const formSchema = z.object({
  keyword: z.string().optional(),
  exact: z.string().optional(),
  one: z.string().optional(),
  none: z.string().optional(),
  cat: z.string().optional(),
  language: z.string().optional(),
  max: z.coerce.number().int().min(1).max(100).optional().default(20),
  pagenumber: z.coerce.number().int().min(1).optional().default(1),
  mid: z.string().optional(),
  sort: z.string().optional(),
  sorttype: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const chartConfig = {
  avgPrice: {
    label: "Avg. Price",
    color: "hsl(var(--chart-1))",
  },
  avgSavings: {
    label: "Avg. Savings",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function ProductTracker() {
  const [results, setResults] = React.useState<ProductSearchResult | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = React.useState<
    Set<string>
  >(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [chartData, setChartData] = React.useState<{
    avgPriceByMerchant: { name: string; avgPrice: number }[];
    avgSavingsByMerchant: { name: string; avgSavings: number }[];
  }>({ avgPriceByMerchant: [], avgSavingsByMerchant: [] });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
      exact: "",
      one: "",
      none: "",
      cat: "",
      language: " ",
      max: 20,
      pagenumber: 1,
      mid: "",
      sort: " ",
      sorttype: " ",
    },
  });

  const toggleDescription = (linkid: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(linkid)) {
        newSet.delete(linkid);
      } else {
        newSet.add(linkid);
      }
      return newSet;
    });
  };

  const productsData =
    results && !("error" in results)
      ? (results as ProductSearchApiResponse)
      : null;

  const products = React.useMemo(
    () => productsData?.productSearchResponse?.item || [],
    [productsData]
  );

  const TotalPages = productsData?.productSearchResponse?.TotalPages ?? 1;
  const TotalMatches = productsData?.productSearchResponse?.TotalMatches ?? 0;
  const PageNumber = productsData?.productSearchResponse?.PageNumber ?? 1;

  React.useEffect(() => {
    if (products && products.length > 0) {
      const merchantStats: {
        [key: string]: {
          totalPrice: number;
          totalSavings: number;
          productCount: number;
          savingsCount: number;
        };
      } = {};

      products.forEach((p) => {
        if (!merchantStats[p.merchantname]) {
          merchantStats[p.merchantname] = {
            totalPrice: 0,
            totalSavings: 0,
            productCount: 0,
            savingsCount: 0,
          };
        }
        const price = p.saleprice?.["#text"] || p.price?.["#text"];
        if (price) {
          merchantStats[p.merchantname].totalPrice += price;
          merchantStats[p.merchantname].productCount++;
        }

        const regularPrice = p.price?.["#text"];
        const salePrice = p.saleprice?.["#text"];
        if (regularPrice && salePrice && salePrice < regularPrice) {
          merchantStats[p.merchantname].totalSavings +=
            regularPrice - salePrice;
          merchantStats[p.merchantname].savingsCount++;
        }
      });

      const avgPriceByMerchant = Object.entries(merchantStats)
        .map(([name, stats]) => ({
          name: name.split(" ")[0],
          avgPrice:
            stats.productCount > 0
              ? parseFloat((stats.totalPrice / stats.productCount).toFixed(2))
              : 0,
        }))
        .filter((d) => d.avgPrice > 0)
        .sort((a, b) => a.avgPrice - b.avgPrice)
        .slice(0, 10);

      const avgSavingsByMerchant = Object.entries(merchantStats)
        .map(([name, stats]) => ({
          name: name.split(" ")[0],
          avgSavings:
            stats.savingsCount > 0
              ? parseFloat((stats.totalSavings / stats.savingsCount).toFixed(2))
              : 0,
        }))
        .filter((d) => d.avgSavings > 0)
        .sort((a, b) => b.avgSavings - a.avgSavings)
        .slice(0, 10);

      setChartData({ avgPriceByMerchant, avgSavingsByMerchant });
    } else {
      setChartData({ avgPriceByMerchant: [], avgSavingsByMerchant: [] });
    }
  }, [products]);
  
  // This effect is the single source of truth for fetching data.
  // It runs when searchParams change.
  React.useEffect(() => {
    const urlValues: Record<string, string> = {};
    let hasParams = false;
    searchParams.forEach((value, key) => {
        urlValues[key] = value;
        hasParams = true;
    });

    // Sync form state with the URL values
    const newFormValues: Partial<FormValues> = {};
    const defaultFormValues = form.getValues();
    Object.keys(defaultFormValues).forEach(keyStr => {
        const key = keyStr as keyof FormValues;
        if (urlValues[key] !== undefined) {
             const isNumber = typeof defaultFormValues[key] === 'number';
             newFormValues[key] = isNumber ? Number(urlValues[key]) : urlValues[key] as any;
        }
    });
    form.reset({ ...defaultFormValues, ...newFormValues });


    if (hasParams) {
        setLoading(true);
        setResults(null);
        searchProducts(urlValues)
            .then(response => {
                setResults(response);
                if (response && 'error' in response) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: response.error,
                    });
                } else if (response) {
                    const data = response as ProductSearchApiResponse;
                    if (data?.productSearchResponse?.item?.length === 0) {
                        toast({
                            title: "No Results",
                            description: "Your search returned no products. Try adjusting your filters.",
                        });
                    }
                }
            })
            .catch((error: any) => {
                toast({
                    variant: "destructive",
                    title: "An Unexpected Error Occurred",
                    description: error.message || "Failed to fetch product data. Please try again.",
                });
                setResults({ error: error.message || "An unexpected error occurred." });
            })
            .finally(() => {
                setLoading(false);
            });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // This function is called when the user submits the form.
  // Its only job is to update the URL's search params, which then triggers the useEffect above.
  const onSubmit = (values: FormValues) => {
    const currentParams = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== ' ') {
        currentParams.set(key, String(value));
      }
    });
    router.push(`/admin/products?${currentParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('pagenumber', newPage.toString());
    router.push(`/admin/products?${currentParams.toString()}`);
  };


  const getAiHint = (productName: string) => {
    return productName.split(" ").slice(0, 2).join(" ");
  };

  const handleProductClick = (product: Product) => {
    sessionStorage.setItem(`product-${product.linkid}`, JSON.stringify(product));
    const brandSlug = slugify(product.merchantname);
    const productSlug = slugify(product.productname);
    const relativeUrl = `/item/${brandSlug}/${productSlug}-${product.linkid}`;
    router.push(relativeUrl);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Search Products</CardTitle>
          <CardDescription>
            Use the filters below to find products from your favorite brands.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="keyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword (All)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., blue dog leash" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword (Exact)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 'dog leash'" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="one"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword (At least one)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., leash collar" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="none"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword (None)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., cat" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand ID (MID)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 12345" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pet Accessories" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Any Language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=" ">Any Language</SelectItem>
                          {LANGUAGE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort By</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=" ">Default</SelectItem>
                          {SORT_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sorttype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=" ">Default</SelectItem>
                          {SORT_TYPE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s === "asc" ? "Ascending" : "Descending"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Results per Page</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1-100" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pagenumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search Products
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center p-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {!loading && !results && (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>Ready to Search</AlertTitle>
          <AlertDescription>
            Use the form above to retrieve product data.
          </AlertDescription>
        </Alert>
      )}

      {!loading &&
        products.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {chartData.avgPriceByMerchant.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Average Product Price by Merchant</CardTitle>
                  <CardDescription>
                    Shows the average price for products found in your search
                    (top 10 cheapest).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="min-h-[200px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={chartData.avgPriceByMerchant}
                      margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${value}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              typeof value === "number"
                                ? `$${value.toFixed(2)}`
                                : ""
                            }
                            indicator="dot"
                          />
                        }
                      />
                      <Bar
                        dataKey="avgPrice"
                        fill="var(--color-avgPrice)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            {chartData.avgSavingsByMerchant.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Average Savings by Merchant</CardTitle>
                  <CardDescription>
                    Shows the average discount for products on sale (top 10 best
                    deals).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="min-h-[200px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={chartData.avgSavingsByMerchant}
                      margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${value}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              typeof value === "number"
                                ? `$${value.toFixed(2)}`
                                : ""
                            }
                            indicator="dot"
                          />
                        }
                      />
                      <Bar
                        dataKey="avgSavings"
                        fill="var(--color-avgSavings)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {!loading && results && "error" in results && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{results.error}</AlertDescription>
        </Alert>
      )}

      {!loading && products.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Product Results</CardTitle>
              <CardDescription>
                Showing {products.length} of{" "}
                {new Intl.NumberFormat().format(TotalMatches)} products on page{" "}
                {PageNumber} of {TotalPages}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Deals</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: Product, index: number) => (
                    <TableRow
                      key={`${p.linkid}-${index}`}
                      className="cursor-pointer"
                      onClick={() => handleProductClick(p)}
                    >
                      <TableCell>
                        {p.imageurl ? (
                          <div className="w-24 h-24 relative">
                            <Image
                              src={p.imageurl}
                              alt={`Image for ${p.productname}`}
                              fill
                              sizes="96px"
                              className="rounded-md object-cover"
                              data-ai-hint={getAiHint(p.productname)}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center bg-muted rounded-md">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-[300px] font-semibold">
                          {p.productname}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.merchantname}
                      </TableCell>
                      <TableCell>
                        {p.availableCoupons &&
                          p.availableCoupons.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Ticket className="mr-2 h-4 w-4 text-primary" />
                                  {p.availableCoupons.length} Available
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">
                                      Available Coupons
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      Active coupons for {p.merchantname}.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    {p.availableCoupons.map(
                                      (coupon: Coupon) => (
                                        <div
                                          key={
                                            coupon.couponcode ||
                                            coupon.offerdescription
                                          }
                                          className="text-sm p-2 bg-secondary rounded-md"
                                        >
                                          <p className="font-semibold">
                                            {coupon.offerdescription}
                                          </p>
                                          {coupon.couponcode && (
                                            <p className="font-mono text-xs mt-1">
                                              Code:{" "}
                                              <span className="font-bold">
                                                {coupon.couponcode}
                                              </span>
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                      </TableCell>
                      <TableCell>
                        <p
                          className={`font-bold ${
                            p.saleprice?.["#text"]
                              ? "line-through text-muted-foreground text-sm"
                              : ""
                          }`}
                        >
                          {p.price?.["#text"] && p.price?.["@_currency"]
                            ? `${getCurrencySymbol(
                                p.price["@_currency"]
                              )}${p.price["#text"].toFixed(2)}`
                            : "N/A"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {p.saleprice?.["#text"] &&
                        p.saleprice?.["@_currency"] ? (
                          <p className="font-bold text-destructive">
                            {`${getCurrencySymbol(
                              p.saleprice["@_currency"]
                            )}${p.saleprice["#text"].toFixed(2)}`}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const regularPrice = p.price?.["#text"];
                          const salePrice = p.saleprice?.["#text"];
                          const currencyCode = p.price?.["@_currency"];

                          if (
                            regularPrice &&
                            salePrice &&
                            currencyCode &&
                            salePrice < regularPrice
                          ) {
                            const savingsAmount = regularPrice - salePrice;
                            const savingsPercentage = Math.round(
                              (savingsAmount / regularPrice) * 100
                            );
                            const currencySymbol =
                              getCurrencySymbol(currencyCode);
                            return (
                              <span className="font-medium text-success whitespace-nowrap">
                                {`${currencySymbol}${savingsAmount.toFixed(
                                  2
                                )} | ${savingsPercentage}% Off`}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="w-[500px] text-sm text-muted-foreground">
                          {p.description.short &&
                          p.description.short.length > 500 ? (
                            <>
                              {expandedDescriptions.has(p.linkid)
                                ? p.description.short
                                : `${p.description.short.substring(
                                    0,
                                    500
                                  )}...`}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-auto w-auto p-0 ml-1 align-middle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescription(p.linkid);
                                }}
                              >
                                {expandedDescriptions.has(p.linkid) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {expandedDescriptions.has(p.linkid)
                                    ? "Collapse"
                                    : "Expand"}
                                </span>
                              </Button>
                            </>
                          ) : (
                            p.description.short
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {TotalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(PageNumber - 1)}
                  disabled={PageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {PageNumber} of {TotalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(PageNumber + 1)}
                  disabled={PageNumber >= TotalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
