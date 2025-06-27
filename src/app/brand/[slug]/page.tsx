
import { getBrandPageData } from '@/app/actions';
import BrandPage from '@/components/brand-page';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { BrandPageData } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next'
import { getLogoUrl, slugify } from '@/lib/utils';


type Props = {
  params: { slug: string },
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const brandIdString = params.slug.split('-')[0];
  const brandId = parseInt(brandIdString, 10);

  if (isNaN(brandId)) {
    return {
      title: 'Invalid Brand',
    }
  }

  const data: BrandPageData | {error: string} = await getBrandPageData(brandId, 1);
  
  if ('error' in data || !data.advertiserDetails) {
    return {
      title: 'Brand Not Found'
    }
  }
  
  const { advertiserDetails } = data;
  const previousImages = (await parent).openGraph?.images || []
  const logoUrl = getLogoUrl(advertiserDetails.url);

  return {
    title: `${advertiserDetails.name} Coupons & Products`,
    description: `Shop the latest products and find the best coupon codes from ${advertiserDetails.name}. ${advertiserDetails.description}`,
    openGraph: {
      title: `${advertiserDetails.name} Coupons & Products`,
      description: `Shop the latest products from ${advertiserDetails.name}.`,
      images: logoUrl ? [
        {
          url: logoUrl,
          width: 800,
          height: 600,
          alt: `${advertiserDetails.name} Logo`,
        },
        ...previousImages,
      ] : previousImages,
    },
  }
}


export default async function Page({ params, searchParams }: Props) {
  const brandIdString = params.slug.split('-')[0];
  const brandId = parseInt(brandIdString, 10);
  const page = parseInt(String(searchParams?.page || '1'), 10);

  if (isNaN(brandId)) {
    return (
        <div className="p-4 md:p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Brand URL</AlertTitle>
                <AlertDescription>
                  The brand ID could not be found in the URL.
                </AlertDescription>
            </Alert>
        </div>
    );
  }
  
  const data: BrandPageData | {error: string} = await getBrandPageData(brandId, page);
  
  if ('error' in data) {
    return (
        <div className="p-4 md:p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Brand</AlertTitle>
                <AlertDescription>
                  {data.error}
                </AlertDescription>
            </Alert>
        </div>
    );
  }
  
  if (!data.advertiserDetails) {
     return (
        <div className="p-4 md:p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Brand Not Found</AlertTitle>
                <AlertDescription>
                The details for this brand could not be found.
                </AlertDescription>
            </Alert>
        </div>
    );
  }
  
  return <BrandPage data={data} brandId={brandId} initialPage={page} />;
}
