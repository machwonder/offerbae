
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function AnalyticsStatus() {
    const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Check if the variables are set and are not the default placeholder values
    const isGaConfigured = gaTrackingId && gaTrackingId !== 'G-XXXXXXXXXX' && gaTrackingId.trim() !== '';
    const isSiteUrlConfigured = siteUrl && siteUrl !== 'https://offerbae.com' && siteUrl.trim() !== '';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analytics & SEO Status</CardTitle>
                <CardDescription>
                    Check if your environment variables for Google Analytics and sitemap generation are configured correctly.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isGaConfigured ? (
                    <Alert className="border-success text-success [&>svg]:text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Google Analytics is Configured</AlertTitle>
                        <AlertDescription>
                            Tracking ID is set to: <strong>{gaTrackingId}</strong>.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Google Analytics is Not Configured</AlertTitle>
                        <AlertDescription>
                            To enable analytics, create a <code>.env.local</code> file in your project root and add:
                            <code className="block bg-muted p-2 rounded-md mt-2 font-mono text-xs text-foreground">
                                NEXT_PUBLIC_GA_TRACKING_ID='G-XXXXXXXXXX'
                            </code>
                        </AlertDescription>
                    </Alert>
                )}

                {isSiteUrlConfigured ? (
                     <Alert className="border-success text-success [&>svg]:text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Site URL is Configured</AlertTitle>
                        <AlertDescription>
                            Your sitemap will be generated for: <strong>{siteUrl}</strong>.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Site URL is Not Configured</AlertTitle>
                        <AlertDescription>
                            To generate a correct sitemap, add the following to your <code>.env.local</code> file:
                             <code className="block bg-muted p-2 rounded-md mt-2 font-mono text-xs text-foreground">
                                NEXT_PUBLIC_SITE_URL='https://offerbae.com'
                            </code>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
