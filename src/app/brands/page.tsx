
import { searchPartnerships } from '@/app/actions';
import BrandList from '@/components/brand-list';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, MousePointerClick } from "lucide-react";
import type { AdvertiserDetails } from '@/lib/types';

export default async function BrandsPage() {
    // Fetch a large number of active partnerships to get a good list of advertisers.
    const initialBrandsData = await searchPartnerships({ partner_status: 'active', limit: 100, page: 1 });

    if ('error' in initialBrandsData) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Brands</AlertTitle>
                    <AlertDescription>
                        {initialBrandsData.error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    // The advertisers list from the API can have duplicates if a brand has multiple partnership types.
    // We create a unique list of advertisers based on their ID, and filter out any with "Rakuten" in the name.
    const uniqueAdvertisers: AdvertiserDetails[] = Array.from(new Map(initialBrandsData.advertisers.map(item => [item.id, item])).values())
        .filter(advertiser => !advertiser.name.toLowerCase().includes('rakuten'));

    return (
        <div className="p-4 md:p-8">
            <header className="text-left mb-8">
                <h1 className="text-2xl font-bold font-headline text-primary">All Brands</h1>
                <p className="text-base text-muted-foreground mt-2 flex items-center gap-1.5">
                    Click <MousePointerClick className="inline-block h-5 w-5 text-primary" /> on a brand to shop their products and coupons.
                </p>
            </header>

            <BrandList initialData={{ ...initialBrandsData, advertisers: uniqueAdvertisers }} />
        </div>
    );
}
