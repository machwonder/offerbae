
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Search, AlertCircle } from "lucide-react";

import { MerchInfoResult, MerchDetails, MerchOfferDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getMerchInfoForTest } from "@/app/actions";

const formSchema = z.object({
  advertiserId: z.string().min(1, { message: "Advertiser ID is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function TermsViewer() {
  const [result, setResult] = React.useState<MerchInfoResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [requestUrl, setRequestUrl] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      advertiserId: "",
    },
  });
  
  React.useEffect(() => {
    const storedAid = sessionStorage.getItem('termsAdvertiserId');
    if (storedAid) {
      form.setValue('advertiserId', storedAid);
      sessionStorage.removeItem('termsAdvertiserId');
    }
  }, [form]);


  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setResult(null);
    setRequestUrl(`https://api.linksynergy.com/linklocator/1.0/getMerchByID/${values.advertiserId}`);
    
    try {
        const response = await getMerchInfoForTest(values.advertiserId);
        setResult(response);
        if (response.error && !response.data) {
            toast({
                variant: "destructive",
                title: "Error",
                description: response.error,
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "An Unexpected Error Occurred",
            description: error.message || "Failed to fetch data.",
        });
        setResult({ error: error.message || "An unexpected error occurred." });
    } finally {
        setLoading(false);
    }
  };

  const renderOffer = (offer: MerchDetails['offer']) => {
    const offers = Array.isArray(offer) ? offer : [offer];
    return offers.map((o: MerchOfferDetails, index: number) => (
      <Card key={index} className="mt-4">
        <CardHeader>
            <CardTitle className="text-base">{o.offerName}</CardTitle>
            <CardDescription>Offer ID: {o.offerId}</CardDescription>
        </CardHeader>
        <CardContent>
            <p><strong>Terms:</strong> {o.commissionTerms}</p>
            <p className="text-sm text-muted-foreground"><strong>Alt Name:</strong> {o.alsoName}</p>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Partnership Terms</CardTitle>
          <CardDescription>
            View the commission terms and offer details for a specific advertiser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="advertiserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advertiser ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 52780" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                View Terms
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

      {result && (
        <Card>
          <CardContent className="pt-6">
            {result.data ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{result.data.name}</CardTitle>
                        <CardDescription>MID: {result.data.mid}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Status:</strong> {result.data.applicationStatus}</p>
                        <p><strong>Categories:</strong> {result.data.categories}</p>
                        <div>
                            <h4 className="font-medium mt-4">Offers</h4>
                            {result.data.offer ? renderOffer(result.data.offer) : <p>No offers found.</p>}
                        </div>
                    </CardContent>
                </Card>
            ) : (
               result.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {result.error}
                    </AlertDescription>
                  </Alert>
                )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
