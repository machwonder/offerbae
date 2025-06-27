
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  Search,
  Link as LinkIcon,
  Copy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  LinkItem,
  LinkSearchResult,
  LinkApiResponse,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { searchLinks } from "@/app/actions";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type LinkType = "text" | "banner" | "rich-media";

const formSchema = z.object({
  advertiser_id: z.string().optional(),
  category_id: z.string().optional(),
  link_start_date: z.date().optional(),
  link_end_date: z.date().optional(),
  campaign_id: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  banner_size_code: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LinkTracker() {
  const [linkType, setLinkType] = React.useState<LinkType>("text");
  const [results, setResults] = React.useState<LinkSearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [requestUrl, setRequestUrl] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      advertiser_id: "-1",
      category_id: "-1",
      link_start_date: new Date(2020, 0, 1),
      link_end_date: new Date(2027, 0, 1),
      campaign_id: "-1",
      page: 1,
      banner_size_code: "",
    },
  });

  React.useEffect(() => {
    const storedLinkType = localStorage.getItem("linkType") as LinkType | null;
    if (storedLinkType) {
      setLinkType(storedLinkType);
    }
  }, []);

  React.useEffect(() => {
    const storedAid = sessionStorage.getItem("linkAdvertiser");
    if (storedAid) {
      form.setValue("advertiser_id", storedAid);
      sessionStorage.removeItem("linkAdvertiser");
    }
  }, [form]);

  const handleLinkTypeChange = (value: LinkType) => {
    setLinkType(value);
    localStorage.setItem("linkType", value);
    setResults(null); // Clear results when changing type
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setResults(null);
    setRequestUrl(null);

    const apiValues = {
      ...values,
      link_start_date: values.link_start_date
        ? format(values.link_start_date, "MMddyyyy")
        : "",
      link_end_date: values.link_end_date
        ? format(values.link_end_date, "MMddyyyy")
        : "",
    };

    try {
      const response = await searchLinks(apiValues, linkType);

      setRequestUrl(response.requestUrl || null);
      setResults(response);

      if (response && "error" in response) {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error,
        });
      } else if (response) {
        const data: LinkApiResponse = response;
        if (data?.links.length === 0) {
          toast({
            title: "No Results",
            description:
              "Your search returned no links. Try adjusting your parameters.",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An Unexpected Error Occurred",
        description:
          error.message || "Failed to fetch link data. Please try again.",
      });
      setResults({ error: error.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "The link code has been copied to your clipboard.",
    });
  };

  const linksData =
    results && !("error" in results) ? (results as LinkApiResponse) : null;
  const links = linksData?.links || [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Search Links</CardTitle>
          <CardDescription>
            Select a link type and use the filters below to find links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-3">
                <Label id="linkTypeRadioGroupLabel">Link Type</Label>
                <RadioGroup
                  aria-labelledby="linkTypeRadioGroupLabel"
                  onValueChange={handleLinkTypeChange}
                  value={linkType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="text" id="linkTypeText" />
                    <Label htmlFor="linkTypeText" className="font-normal">
                      Text
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="banner" id="linkTypeBanner" />
                    <Label htmlFor="linkTypeBanner" className="font-normal">
                      Banner
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="rich-media" id="linkTypeRichMedia" />
                    <Label htmlFor="linkTypeRichMedia" className="font-normal">
                      Rich Media
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="advertiser_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advertiser ID (MID)</FormLabel>
                      <FormControl>
                        <Input placeholder="-1 for all" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category ID</FormLabel>
                      <FormControl>
                        <Input placeholder="-1 for all" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="link_start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="link_end_date"
                  render={({ field }) => (
                     <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="campaign_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign ID</FormLabel>
                      <FormControl>
                        <Input placeholder="-1 (deprecated)" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is a deprecated feature. Use -1.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {linkType === "banner" && (
                  <FormField
                    control={form.control}
                    name="banner_size_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner Size Code</FormLabel>
                        <FormControl>
                          <Input placeholder="-1 for all" {...field} />
                        </FormControl>
                        <FormDescription>
                          e.g., 1 for 468x60, 2 for 120x600. Use -1 for all
                          sizes.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
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
                Search Links
              </Button>
            </form>
          </Form>
          {requestUrl && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Request URL:
              </h4>
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
            Use the form above to retrieve link data.
          </AlertDescription>
        </Alert>
      )}

      {!loading && results && "error" in results && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{results.error}</AlertDescription>
        </Alert>
      )}

      {!loading && links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {linkType.charAt(0).toUpperCase() + linkType.slice(1)} Link
              Results
            </CardTitle>
            <CardDescription>Showing {links.length} links.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link ID</TableHead>
                    <TableHead>MID</TableHead>
                    <TableHead>Link Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Campaign ID</TableHead>
                    <TableHead>NID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Dimensions (WxH)</TableHead>
                    <TableHead>Size Code</TableHead>
                    <TableHead>Server Type</TableHead>
                    <TableHead>Text Display</TableHead>
                    <TableHead>Code / URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link: LinkItem, index: number) => (
                    <TableRow key={`${link.linkID}-${index}`}>
                      <TableCell>{link.linkID}</TableCell>
                      <TableCell>{link.mid}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{link.linkName}</TableCell>
                      <TableCell className="max-w-xs truncate">{link.categoryName} ({link.categoryID})</TableCell>
                      <TableCell>{link.campaignID ?? 'N/A'}</TableCell>
                      <TableCell>{link.nid ?? 'N/A'}</TableCell>
                      <TableCell>{link.startDate ?? 'N/A'}</TableCell>
                      <TableCell>{link.endDate ?? 'N/A'}</TableCell>
                      <TableCell>
                        {link.imgURL || link.showURL ? (
                          <img
                            src={link.imgURL || link.showURL}
                            alt={link.linkName}
                            style={{
                              width: link.width,
                              height: link.height,
                              maxWidth: '200px',
                              maxHeight: '100px'
                            }}
                          />
                        ) : (
                          <Badge variant="outline">No Preview</Badge>
                        )}
                      </TableCell>
                      <TableCell>{link.width && link.height ? `${link.width}x${link.height}` : 'N/A'}</TableCell>
                      <TableCell>{link.size ?? 'N/A'}</TableCell>
                      <TableCell>{link.serverType ?? 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{link.textDisplay ?? 'N/A'}</TableCell>
                      <TableCell>
                        {link.code || link.clickURL ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(link.code || link.clickURL!)
                            }
                          >
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Copy
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* The Links API does not provide pagination metadata, so we can't build a pager easily */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
