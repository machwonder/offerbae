
"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Award, Ban, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Link as LinkIcon, Loader2, Search, ShieldOff, ShoppingCart, Ticket, Trash2, UserX, XCircle
} from "lucide-react";

import { RakutenApiResponse, Partnership, AdvertiserDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form, FormControl, FormField, FormItem, FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { searchPartnerships } from "@/app/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PARTNER_STATUS_OPTIONS = ["active", "pending", "self-removed", "permanent-decline", "permanent-remove", "temp-decline", "temp-remove", "extended"];
const NETWORK_OPTIONS = ["1", "3", "5", "7", "8", "9", "41"];
const ADVERTISER_STATUS_OPTIONS = ["active", "inactive"];
const DATE_RANGE_OPTIONS = ["1d", "7d", "30d"];
const SORT_BY_OPTIONS = ["apply_datetime", "approve_datetime", "status_update_datetime"];
const ORDER_BY_OPTIONS = ["dsc", "asc"];

const formSchema = z.object({
  partner_status: z.string().optional(),
  network: z.string().optional(),
  advertiser_status: z.string().optional(),
  category: z.string().optional(),
  status_update_range: z.string().optional(),
  approve_date_range: z.string().optional(),
  apply_date_range: z.string().optional(),
  sort_by: z.string().optional(),
  order_by: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
  page: z.coerce.number().int().min(1).optional().default(1),
});

type FormValues = z.infer<typeof formSchema>;

const statusClassNameMap: { [key: string]: string } = {
  active: "text-success",
  pending: "text-primary",
  extended: "text-warning",
  "temp-decline": "text-orange",
  "temp-remove": "text-orange",
  "permanent-decline": "text-destructive",
  "permanent-remove": "text-destructive",
  "self-removed": "text-destructive",
};

const statusIcons: { [key: string]: React.ElementType } = {
    active: CheckCircle2,
    pending: Clock,
    extended: Award,
    'temp-decline': XCircle,
    'temp-remove': ShieldOff,
    'permanent-decline': Ban,
    'permanent-remove': Trash2,
    'self-removed': UserX,
};

const StatusDisplay = ({ status }: { status: string }) => {
  const Icon = statusIcons[status] || AlertCircle;
  const className = statusClassNameMap[status] || "text-foreground";
  return (
    <div className={cn("flex items-center capitalize font-medium", className)}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {status.replace(/-/g, ' ').replace('permanent', 'Perm')}
    </div>
  );
};

const PartnershipRow = ({ partnership }: { partnership: Partnership }) => {
    const router = useRouter();
    const [statusUpdateDate, setStatusUpdateDate] = React.useState<string | null>(null);
    const [applyDate, setApplyDate] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (partnership.status_update_datetime) {
            setStatusUpdateDate(format(new Date(partnership.status_update_datetime), 'PP'));
        }
        if (partnership.apply_datetime) {
            setApplyDate(format(new Date(partnership.apply_datetime), 'PP'));
        }
    }, [partnership.status_update_datetime, partnership.apply_datetime]);

    const handleViewLinks = (advertiserId: number) => {
        sessionStorage.setItem('linkAdvertiser', String(advertiserId));
        router.push('/admin/links');
    };

    const handleViewTerms = (advertiserId: number) => {
        sessionStorage.setItem('termsAdvertiserId', String(advertiserId));
        router.push('/admin/terms');
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{partnership.advertiser.id}</TableCell>
            <TableCell>{partnership.advertiser.name}</TableCell>
            <TableCell>
                <StatusDisplay status={partnership.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
                {partnership.advertiser.categories.join(', ')}
            </TableCell>
            <TableCell>{statusUpdateDate || '...'}</TableCell>
            <TableCell>{applyDate || '...'}</TableCell>
            <TableCell className="text-right">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleViewTerms(partnership.advertiser.id)}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">View terms for {partnership.advertiser.name}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>View Terms</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleViewLinks(partnership.advertiser.id)}>
                                <LinkIcon className="h-4 w-4" />
                                <span className="sr-only">View links for {partnership.advertiser.name}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>View Links</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
        </TableRow>
    );
};


export default function PartnershipTracker() {
  const [results, setResults] = React.useState<RakutenApiResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [requestUrl, setRequestUrl] = React.useState<string | null>(null);
  const [merchRequestUrl, setMerchRequestUrl] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        partner_status: "active",
        network: " ",
        advertiser_status: " ",
        category: "",
        status_update_range: " ",
        approve_date_range: " ",
        apply_date_range: " ",
        sort_by: " ",
        order_by: " ",
        limit: 100,
        page: 1,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setRequestUrl(null);
    setMerchRequestUrl(null);
    
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.append(key, String(value));
      }
    });
    const apiUrl = new URL('https://api.linksynergy.com/v1/partnerships');
    apiUrl.search = params.toString();
    setRequestUrl(apiUrl.toString());
    
    try {
      const response = await searchPartnerships(values);

      if ('error' in response) {
          toast({
              variant: "destructive",
              title: "Error",
              description: response.error,
          });
          setResults(null);
          return;
      }
      
      const data: RakutenApiResponse = response;
      form.setValue('page', data._metadata.page);
      setResults(data);
      if (data.merchRequestUrl) {
        setMerchRequestUrl(data.merchRequestUrl);
      }

      if (data.advertisers && data.advertisers.length > 0) {
        const advertiserIds = data.advertisers.map(ad => ad.id).join('|');
        sessionStorage.setItem('couponAdvertisers', advertiserIds);
      } else {
        sessionStorage.removeItem('couponAdvertisers');
      }
      
      if(data.partnerships.length === 0){
          toast({
              title: "No Results",
              description: "Your search returned no partnerships. Try adjusting your filters.",
          });
      }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "An Unexpected Error Occurred",
            description: error.message || "Failed to fetch partnership data. Please try again.",
        });
        setResults(null);
    } finally {
        setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    form.setValue('page', newPage);
    form.handleSubmit(onSubmit)();
  }

  const { page = 1, total = 0, limit: responseLimit = 100 } = results?._metadata || {};
  const totalPages = Math.ceil(total / responseLimit);

  const getLogoUrl = (advertiserUrl: string | undefined): string | null => {
    if (!advertiserUrl) return null;
    try {
      // Ensure protocol is present for URL constructor, as it might be missing.
      const fullUrl = advertiserUrl.startsWith('http') ? advertiserUrl : `https://${advertiserUrl}`;
      const url = new URL(fullUrl);
      let hostname = url.hostname;
      // Remove 'www.' prefix if it exists.
      hostname = hostname.replace(/^www\./, '');
      if (hostname) {
        return `https://img.logo.dev/${hostname}?token=pk_c-0vMnb4Q7-kr6zNd5ttBA`;
      }
      return null;
    } catch (error) {
      // Log error for debugging but don't crash the UI.
      console.error("Invalid URL for logo generation:", advertiserUrl, error);
      return null;
    }
  };

  const BooleanDisplay = ({ value }: { value: boolean | undefined }) => {
    if (value === undefined || value === null) return <span className="text-muted-foreground">N/A</span>;
    return value ? <span className="text-success">Yes</span> : <span className="text-destructive">No</span>;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Search Partnerships</CardTitle>
          <CardDescription>
            Use the filters below to find specific partnership data. Your API key is configured securely on the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField control={form.control} name="partner_status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partnership Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any Status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PARTNER_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/-/g, ' ').replace('permanent', 'Perm')}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                <FormField control={form.control} name="advertiser_status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advertiser Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any Status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Any Status</SelectItem>
                        {ADVERTISER_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl><Input placeholder="e.g., Clothing" {...field} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="status_update_range" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Update Range</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any Time" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Any Time</SelectItem>
                        {DATE_RANGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="approve_date_range" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Date Range</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any Time" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Any Time</SelectItem>
                        {DATE_RANGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="apply_date_range" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Date Range</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any Time" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Any Time</SelectItem>
                        {DATE_RANGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="sort_by" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort By</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Default</SelectItem>
                        {SORT_BY_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="order_by" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order By</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value=" ">Default</SelectItem>
                        {ORDER_BY_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === 'asc' ? 'Ascending' : 'Descending'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="limit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Results per Page</FormLabel>
                    <FormControl><Input type="number" placeholder="1-100" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="page" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 1" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search Partnerships
              </Button>
            </form>
          </Form>
           {(requestUrl || merchRequestUrl) && (
            <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
              {requestUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Partnerships Request URL:</h4>
                  <code className="text-xs text-foreground bg-background p-2 rounded-md block break-all">
                    {requestUrl}
                  </code>
                </div>
              )}
              {merchRequestUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">First Merch Info Request URL:</h4>
                  <code className="text-xs text-foreground bg-background p-2 rounded-md block break-all">
                    {merchRequestUrl}
                  </code>
                </div>
              )}
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
            Use the form above to retrieve your partnership data.
          </AlertDescription>
        </Alert>
      )}

      {!loading && results && results.partnerships.length > 0 && (
        <Tabs defaultValue="partnerships" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="partnerships">Partnership Results</TabsTrigger>
            <TabsTrigger value="advertisers" disabled={!results.advertisers || results.advertisers.length === 0}>
              Advertiser Details
            </TabsTrigger>
          </TabsList>
          <TabsContent value="partnerships">
            <Card>
              <CardHeader>
                <CardTitle>Partnership Results</CardTitle>
                <CardDescription>
                  Showing {results.partnerships.length} of {results._metadata.total} total partnerships.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Advertiser ID</TableHead>
                        <TableHead>Advertiser</TableHead>
                        <TableHead>Partnership Status</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.partnerships.map((p: Partnership) => (
                           <PartnershipRow key={p.advertiser.id} partnership={p} />
                        ))}
                    </TableBody>
                    </Table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="advertisers">
            {results.advertisers && results.advertisers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Advertiser Details</CardTitle>
                  <CardDescription>
                    Showing details for {results.advertisers.length} unique advertisers found in the partnership search.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                          <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Ships To</TableHead>
                            <TableHead>DSA</TableHead>
                            <TableHead>DSA Specs</TableHead>
                            <TableHead>Premium</TableHead>
                            <TableHead>Product Feed</TableHead>
                            <TableHead>Media Opt Report</TableHead>
                            <TableHead>Cross-Device</TableHead>
                            <TableHead>Deep Links</TableHead>
                            <TableHead>ITP Compliant</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Country</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {results.advertisers.filter(ad => !!ad).map((ad: AdvertiserDetails) => {
                            const logoUrl = getLogoUrl(ad.url);
                            return (
                            <TableRow key={ad.id}>
                                <TableCell>
                                  {logoUrl ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-sm border bg-white p-1">
                                      <Image
                                        src={logoUrl}
                                        alt={`Logo for ${ad.name}`}
                                        width={64}
                                        height={64}
                                        className="object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-sm border bg-muted">
                                      <span className="text-xs text-muted-foreground">N/A</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{ad.id}</TableCell>
                                <TableCell>{ad.name}</TableCell>
                                <TableCell>
                                  {ad.url ? (
                                    <a href={ad.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                      {ad.url}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="w-[500px] whitespace-pre-wrap">{ad.description ?? 'N/A'}</div>
                                </TableCell>
                                <TableCell>
                                  {ad.policies?.international_capabilities?.ships_to && ad.policies.international_capabilities.ships_to.length > 0 ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">View ({ad.policies.international_capabilities.ships_to.length})</Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="max-h-60 overflow-y-auto">
                                        {ad.policies.international_capabilities.ships_to.map((country, index) => (
                                          <DropdownMenuItem key={index}>{country}</DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell><BooleanDisplay value={ad.policies?.software?.dsa} /></TableCell>
                                <TableCell>{ad.policies?.software?.dsa_specs ?? 'N/A'}</TableCell>
                                <TableCell><BooleanDisplay value={ad.features?.premium_advertiser} /></TableCell>
                                <TableCell><BooleanDisplay value={ad.features?.product_feed} /></TableCell>
                                <TableCell><BooleanDisplay value={ad.features?.media_opt_report} /></TableCell>
                                <TableCell><BooleanDisplay value={ad.features?.cross_device_tracking} /></TableCell>
                                <TableCell><BooleanDisplay value={ad.features?.deep_links} /></TableCell>
                                <TableCell><BooleanDisplay value={ad.features?.itp_compliant} /></TableCell>
                                <TableCell>{ad.contact?.name ?? 'N/A'}</TableCell>
                                <TableCell>{ad.contact?.job_title ?? 'N/A'}</TableCell>
                                <TableCell>{ad.contact?.email ?? 'N/A'}</TableCell>
                                <TableCell>{ad.contact?.phone ?? 'N/A'}</TableCell>
                                <TableCell>{ad.contact?.country ?? 'N/A'}</TableCell>
                            </TableRow>
                          )})}
                      </TableBody>
                      </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
