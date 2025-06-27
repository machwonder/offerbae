
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  ChevronLeft, ChevronRight, Link as LinkIcon, Loader2, Search, Eye, ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Coupon, CouponApiResponse, CouponSearchResult
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { searchCoupons } from "@/app/actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getCouponTitle, slugify } from "@/lib/utils";
import { useModal } from "@/hooks/use-modal";

const NETWORK_OPTIONS = ["1", "3", "5", "7", "8", "9", "41"];

const formSchema = z.object({
  category: z.string().optional(),
  promotiontype: z.string().optional(),
  network: z.string().optional(),
  mid: z.string().optional(),
  resultsperpage: z.coerce.number().int().min(1).max(1000).optional().default(50),
  pagenumber: z.coerce.number().int().min(1).optional().default(1),
});

type FormValues = z.infer<typeof formSchema>;


interface CouponRowProps {
    coupon: Coupon;
    onShopProducts: (coupon: Coupon) => void;
    onCouponClick: (coupon: Coupon) => void;
    renderOfferDescription: (description: string, code?: string) => React.ReactNode;
}

const CouponRow = ({ coupon, onShopProducts, onCouponClick, renderOfferDescription }: CouponRowProps) => {
    const [endDate, setEndDate] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (coupon.offerenddate) {
            setEndDate(format(new Date(coupon.offerenddate), 'PP'));
        }
    }, [coupon.offerenddate]);
    
    return (
      <TableRow>
        <TableCell className="font-medium">{coupon.advertisername}</TableCell>
        <TableCell>
          {coupon.couponcode ? <Badge variant="secondary">Code</Badge> : <Badge variant="outline">Deal</Badge>}
        </TableCell>
        <TableCell>
          {coupon.couponcode ? <span className="font-mono text-muted-foreground rounded-md px-2 py-1 text-xs border border-dashed">{coupon.couponcode}</span> : null}
        </TableCell>
        <TableCell className="font-medium text-destructive">{getCouponTitle(coupon.offerdescription)}</TableCell>
        <TableCell className="max-w-sm">
            {renderOfferDescription(coupon.offerdescription, coupon.couponcode)}
            {coupon.couponrestriction && <p className="text-xs text-muted-foreground mt-1">{coupon.couponrestriction}</p>}
        </TableCell>
        <TableCell>
            {coupon.offerenddate ? (endDate || '...') : 'N/A'}
        </TableCell>
        <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => onCouponClick(coupon)}>
                    <LinkIcon className="mr-2 h-3.5 w-3.5"/>
                    Get Deal
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onShopProducts(coupon)}>
                                <ShoppingCart className="h-4 w-4" />
                                <span className="sr-only">Shop products for {coupon.advertisername}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Shop Products</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </TableCell>
      </TableRow>
    );
};


export default function CouponTracker() {
  const [results, setResults] = React.useState<CouponSearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [requestUrl, setRequestUrl] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { onOpen } = useModal();

  const renderOfferDescription = (description: string, code?: string) => {
    if (!code || !description) {
      return <p className="font-medium">{description}</p>;
    }
    const parts = description.split(code);
    if (parts.length <= 1) {
      return <p className="font-medium">{description}</p>;
    }
    return (
      <p className="font-medium">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center align-middle mx-1">
                      <Eye className="h-4 w-4 text-primary" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{code}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      promotiontype: "",
      network: " ",
      mid: "",
      resultsperpage: 50,
      pagenumber: 1,
    },
  });

  React.useEffect(() => {
    const storedMids = sessionStorage.getItem('couponAdvertisers');
    if (storedMids) {
      form.setValue('mid', storedMids);
      sessionStorage.removeItem('couponAdvertisers');
    }
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setResults(null);

    const params = new URLSearchParams();
    // Per API docs, only send params that have a value
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.append(key, String(value));
      }
    });
    const apiUrl = new URL('https://api.linksynergy.com/coupon/1.0');
    apiUrl.search = params.toString();
    setRequestUrl(apiUrl.toString());
    
    try {
        const response = await searchCoupons(values);

        if (response && !('error' in response) && response.couponfeed?.link) {
          response.couponfeed.link.forEach((coupon) => {
            if (!coupon.couponcode) {
              const codeMatch = coupon.offerdescription.match(/\bcode\s+([A-Z0-9\-_]+)\b/i);
              if (codeMatch && codeMatch[1]) {
                coupon.couponcode = codeMatch[1];
              }
            }
          });
        }
        
        setResults(response);

        if (response && 'error' in response) {
            toast({
                variant: "destructive",
                title: "Error",
                description: response.error,
            });
        } else if (response) {
            const data: CouponApiResponse = response;
            if (data?.couponfeed?.link?.length === 0) {
                toast({
                    title: "No Results",
                    description: "Your search returned no coupons. Try adjusting your filters.",
                });
            }
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "An Unexpected Error Occurred",
            description: error.message || "Failed to fetch coupon data. Please try again.",
        });
        setResults({ error: error.message || "An unexpected error occurred." });
    } finally {
        setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    form.setValue('pagenumber', newPage);
    form.handleSubmit(onSubmit)();
  };

  const handleShopProducts = (coupon: Coupon) => {
    const brandSlug = slugify(coupon.advertisername);
    router.push(`/brand/${coupon.advertiserid}-${brandSlug}`);
  };

  const handleCouponClick = (coupon: Coupon) => {
    onOpen('redirect', {
      url: coupon.clickurl,
      coupon: coupon
    });
  };

  const couponsData = results && !('error' in results) ? results as CouponApiResponse : null;
  const coupons = couponsData?.couponfeed?.link || [];
  const TotalPages = couponsData?.couponfeed?.TotalPages ?? 1;
  const PageNumberRequested = couponsData?.couponfeed?.PageNumberRequested ?? 1;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Search Coupons</CardTitle>
          <CardDescription>
            Use the filters below to find available coupons from your favorite brands.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="mid" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand ID(s)</FormLabel>
                    <FormControl><Input placeholder="e.g., 1234|5678" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="network" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any Network" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Any Network</SelectItem>
                        {NETWORK_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category ID(s)</FormLabel>
                    <FormControl><Input placeholder="e.g., 100307" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="promotiontype" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotion Type ID(s)</FormLabel>
                    <FormControl><Input placeholder="e.g., 9010" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="resultsperpage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Results per Page</FormLabel>
                    <FormControl><Input type="number" placeholder="1-1000" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="pagenumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 1" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search Coupons
              </Button>
            </form>
          </Form>
          {requestUrl && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Request URL:</h4>
              <code className="text-xs text-foreground bg-background p-2 rounded-md block break-all">
                {requestUrl}
              </code>
            </div>
          )}
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
            Use the form above to retrieve your coupon data.
          </AlertDescription>
        </Alert>
      )}

      {!loading && results && 'error' in results && (
          <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{results.error}</AlertDescription>
          </Alert>
      )}

      {!loading && coupons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Coupon Results</CardTitle>
            <CardDescription>
              Showing {coupons.length} coupons on page {PageNumberRequested} of {TotalPages}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {coupons.map((c: Coupon, index: number) => (
                      <CouponRow
                        key={`${c.advertiserid}-${index}`}
                        coupon={c}
                        onShopProducts={handleShopProducts}
                        onCouponClick={handleCouponClick}
                        renderOfferDescription={renderOfferDescription}
                      />
                    ))}
                </TableBody>
                </Table>
            </div>
             {TotalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <Button variant="outline" onClick={() => handlePageChange(PageNumberRequested - 1)} disabled={PageNumberRequested <= 1}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {PageNumberRequested} of {TotalPages}
                    </span>
                    <Button variant="outline" onClick={() => handlePageChange(PageNumberRequested + 1)} disabled={PageNumberRequested >= TotalPages}>
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
