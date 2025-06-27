
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Search, FileText, AlertCircle, CheckCircle2, Clock, Award, XCircle, ShieldOff, Ban, Trash2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";

import { MerchByCategoryResult, MerchDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getMerchantsByCategory } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const formSchema = z.object({
  categoryId: z.string().min(1, { message: "Category ID is required." }),
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


export default function MerchantsByCategory() {
  const [results, setResults] = React.useState<MerchByCategoryResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [requestUrl, setRequestUrl] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setResults(null);
    setRequestUrl(`https://api.linksynergy.com/linklocator/1.0/getMerchByCategory/${values.categoryId}`);
    try {
      const response = await getMerchantsByCategory(values.categoryId);
      setResults(response);

      if (response && 'error' in response) {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error,
        });
      } else if (response) {
        if (response?.merchants?.length === 0) {
          toast({
            title: "No Results",
            description: "Your search returned no merchants for this category.",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An Unexpected Error Occurred",
        description: error.message || "Failed to fetch merchant data.",
      });
      setResults({ error: error.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTerms = (advertiserId: number) => {
    sessionStorage.setItem('termsAdvertiserId', String(advertiserId));
    router.push('/admin/terms');
  };

  const merchants = results?.merchants || [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Search Merchants by Category</CardTitle>
          <CardDescription>
            Enter a Category ID to find all merchants associated with it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category ID</FormLabel>
                  <FormControl><Input placeholder="e.g., 5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search Merchants
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
            Use the form above to find merchants by category.
          </AlertDescription>
        </Alert>
      )}

      {!loading && results && 'error' in results && (
          <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{results.error}</AlertDescription>
          </Alert>
      )}

      {!loading && merchants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Merchant Results</CardTitle>
            <CardDescription>
              Showing {merchants.length} merchants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>MID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Application Status</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {merchants.map((m: MerchDetails) => (
                    <TableRow key={m.mid}>
                        <TableCell className="font-medium">{m.mid}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell><StatusDisplay status={m.applicationStatus} /></TableCell>
                        <TableCell>{m.categories}</TableCell>
                        <TableCell className="text-right">
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleViewTerms(m.mid)}>
                                        <FileText className="h-4 w-4" />
                                        <span className="sr-only">View terms for {m.name}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View Terms</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
