
import ProductDetailPage from '@/components/product-detail-page';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Metadata, ResolvingMetadata } from 'next';
import { getProductByLinkId } from '@/app/actions';
import { getCurrencySymbol } from '@/lib/utils';
import type { Product } from '@/lib/types';
import ProductDetailLoader from '@/components/product-detail-loader';
import { Suspense } from 'react';

type Props = {
  params: { brand: string; product: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

function extractLinkId(slug: string): string | null {
    if (!slug) return null;
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    // A simple check to see if the last part is numeric, which linkids usually are.
    if (lastPart && /^\d+$/.test(lastPart)) {
        return lastPart;
    }
    return null;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const linkid = extractLinkId(params.product);
  
  if (!linkid) {
    return { title: 'Invalid Product URL' };
  }
  
  const { product, error } = await getProductByLinkId(linkid);

  if (error || !product) {
    return { title: 'Product Not Found' };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const currency = getCurrencySymbol(product.price?.['@_currency']);
  const price = product.saleprice?.['#text'] || product.price?.['#text'];

  return {
    title: product.productname,
    description: product.description.short,
    openGraph: {
      title: product.productname,
      description: `Buy ${product.productname} from ${product.merchantname} for ${currency}${price}.`,
      images: [
        {
          url: product.imageurl,
          width: 800,
          height: 600,
          alt: product.productname,
        },
        ...previousImages,
      ],
    },
  };
}


export default function Page({ params }: Props) {
    const linkid = extractLinkId(params.product);

    if (!linkid) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Product URL</AlertTitle>
                    <AlertDescription>
                        The product ID could not be found in the URL slug.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
  
    return (
      <Suspense fallback={<ProductDetailLoader />}>
        <ProductDetailPage linkid={linkid} />
      </Suspense>
    );
}
