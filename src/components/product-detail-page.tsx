
"use client";

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProductByLinkId, searchCoupons, getMoreProductsFromMerchant } from '@/app/actions';
import type { Product, Coupon } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Ticket, MousePointerClick, ExternalLink, AlertCircle } from 'lucide-react';
import { slugify, getCurrencySymbol } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import BrandCouponCard from './brand-coupon-card';
import { useModal } from '@/hooks/use-modal';
import BrandProductCard from './brand-product-card';
import ProductDetailLoader from './product-detail-loader';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function CouponSidebarSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
    );
}

export default function ProductDetailPage({ linkid }: { linkid: string }) {
  const [product, setProduct] = React.useState<Product | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);
  const [moreProducts, setMoreProducts] = React.useState<Product[]>([]);
  const [loadingMoreProducts, setLoadingMoreProducts] = React.useState(true);
  const { onOpen } = useModal();
  const [formattedCreatedOn, setFormattedCreatedOn] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProductData() {
        setLoading(true);
        setError(null);

        // First, try to get from session storage
        const cachedProductJson = sessionStorage.getItem(`product-${linkid}`);
        if (cachedProductJson) {
            try {
                const cachedProduct = JSON.parse(cachedProductJson);
                setProduct(cachedProduct);
                setLoading(false);
                return; // Exit if we found it in cache
            } catch (e) {
                console.error("Failed to parse cached product", e);
                // If parsing fails, proceed to fetch from API
            }
        }

        // If not in cache, fetch from API
        const { product: fetchedProduct, error: fetchError } = await getProductByLinkId(linkid);

        if (fetchedProduct) {
            setProduct(fetchedProduct);
            sessionStorage.setItem(`product-${linkid}`, JSON.stringify(fetchedProduct));
        } else {
            setError(fetchError || `Product with linkid ${linkid} not found.`);
        }
        setLoading(false);
    }
    fetchProductData();
  }, [linkid]);

  React.useEffect(() => {
    if (!product) return;

    const fetchRelatedData = async () => {
      // Fetch Coupons
      if (product.mid) {
        setLoadingCoupons(true);
        try {
          const couponResult = await searchCoupons({ mid: product.mid.toString() });
          if (couponResult && !('error' in couponResult) && couponResult.couponfeed?.link) {
            setCoupons(couponResult.couponfeed.link);
          }
        } catch (error) {
          console.error("Failed to fetch coupon data:", error);
        } finally {
          setLoadingCoupons(false);
        }
      } else {
        setLoadingCoupons(false);
      }

      // Fetch More Products
      if (product.mid && product.linkid) {
        setLoadingMoreProducts(true);
        try {
          const result = await getMoreProductsFromMerchant(product.mid, product.linkid);
          if (result.products) {
            setMoreProducts(result.products);
          }
        } catch (error) {
          console.error("Failed to fetch more products:", error);
        } finally {
          setLoadingMoreProducts(false);
        }
      } else {
        setLoadingMoreProducts(false);
      }
    };
    
    fetchRelatedData();

    if (product.createdon) {
        setFormattedCreatedOn(format(new Date(product.createdon), 'PP'));
    }
  }, [product]);

  const sortedCoupons = React.useMemo(() => {
    if (!coupons) return [];
    return [...coupons].sort((a, b) => {
        const aHasCode = !!a.couponcode;
        const bHasCode = !!b.couponcode;

        if (aHasCode && !bHasCode) return -1;
        if (!aHasCode && bHasCode) return 1;

        const dateA = a.offerenddate ? new Date(a.offerenddate).getTime() : Infinity;
        const dateB = b.offerenddate ? new Date(b.offerenddate).getTime() : Infinity;

        if (dateA !== dateB) {
            return dateA - dateB;
        }

        return a.offerdescription.localeCompare(b.offerdescription);
    });
  }, [coupons]);


  if (loading) {
      return <ProductDetailLoader />;
  }

  if (error || !product) {
      return (
          <div className="p-4 md:p-8">
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Product</AlertTitle>
                  <AlertDescription>
                      {error || 'The product could not be found.'}
                  </AlertDescription>
              </Alert>
          </div>
      );
  }

  const regularPrice = product.price?.['#text'];
  const salePrice = product.saleprice?.['#text'];
  const currency = getCurrencySymbol(product.price?.['@_currency']);

  const isActuallyOnSale = typeof salePrice === 'number' && salePrice > 0 && typeof regularPrice === 'number' && salePrice < regularPrice;

  const handleAffiliateRedirect = (e: React.MouseEvent<HTMLElement>, affiliateUrl: string) => {
    e.preventDefault();
    onOpen('redirect', { url: affiliateUrl });
  };
  
  const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.productname,
      image: product.imageurl,
      description: product.description.short,
      sku: product.sku,
      brand: {
          '@type': 'Brand',
          name: product.merchantname,
      },
      offers: {
          '@type': 'Offer',
          url: product.linkurl,
          priceCurrency: product.price?.['@_currency'],
          price: product.saleprice?.['#text'] || product.price?.['#text'],
          availability: 'https://schema.org/InStock',
      },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex lg:h-full">
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] px-8 py-0 lg:gap-8">
          <main className="w-full lg:w-2/3 xl:w-3/4 lg:overflow-y-auto lg:h-full pr-4 space-y-8 pt-8 pb-8 mb-8 lg:mb-0">
            <header>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span>/</span>
                <Link href={`/brand/${product.mid}-${slugify(product.merchantname)}`} className="hover:text-primary">{product.merchantname}</Link>
                <span>/</span>
                <a href={product.linkurl} onClick={(e) => handleAffiliateRedirect(e, product.linkurl)} className="truncate hover:text-primary">{product.productname}</a>
              </div>
              <a href={product.linkurl} onClick={(e) => handleAffiliateRedirect(e, product.linkurl)} className="block text-2xl md:text-3xl font-bold text-foreground hover:text-primary">
                {product.productname}
              </a>
              <p className="mt-2 text-base text-muted-foreground">
                from <Link href={`/brand/${product.mid}-${slugify(product.merchantname)}`} className="font-semibold text-primary hover:underline">{product.merchantname}</Link>
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <div className="aspect-square relative bg-card rounded-xl border">
                  {product.imageurl ? (
                    <Image
                        src={product.imageurl}
                        alt={product.productname}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain rounded-xl p-4"
                        data-ai-hint={`${product.category.primary} ${product.category.secondary}`}
                      />
                  ) : (
                    <div className="h-full w-full bg-muted rounded-xl"/>
                  )}
                </div>
                <a
                  href={product.linkurl}
                  onClick={(e) => handleAffiliateRedirect(e, product.linkurl)}
                  className="mt-2 text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5"
                >
                  See more images <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="space-y-6">
                  <div className="flex items-baseline space-x-2">
                      {isActuallyOnSale ? (
                          <>
                              <span className="text-4xl font-bold text-destructive">{currency}{salePrice.toFixed(2)}</span>
                              <span className="text-2xl font-medium text-muted-foreground line-through">{currency}{regularPrice.toFixed(2)}</span>
                          </>
                      ) : (
                        regularPrice && <span className="text-4xl font-bold text-foreground">{currency}{regularPrice.toFixed(2)}</span>
                      )}
                  </div>

                  {isActuallyOnSale && regularPrice && salePrice > 0 && (
                      <Badge variant="destructive" className="text-base">
                          SAVE {Math.round(((regularPrice - salePrice) / regularPrice) * 100)}%
                      </Badge>
                  )}

                  <div>
                      <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                          <Button onClick={(e) => handleAffiliateRedirect(e, product.linkurl)} size="lg" className="relative w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600">
                              SELECT OPTIONS <MousePointerClick className="ml-2 h-4 w-4"/>
                          </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-1.5">
                        at {product.merchantname}
                      </p>
                  </div>

              </div>
            </div>
            
            <div className="px-0">
              <CardHeader className="px-0">
                <CardTitle className="text-xl">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-0">
                  <p className="text-sm text-muted-foreground">{product.description.short}</p>
              </CardContent>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                          <dt className="font-medium text-muted-foreground">Brand</dt>
                          <dd className="text-foreground">{product.merchantname}</dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <dt className="font-medium text-muted-foreground">Primary Category</dt>
                          <dd className="text-foreground">{product.category.primary}</dd>
                      </div>
                      {product.category.secondary && <div className="grid grid-cols-2 gap-2">
                          <dt className="font-medium text-muted-foreground">Secondary Category</dt>
                          <dd className="text-foreground">{product.category.secondary}</dd>
                      </div>}
                      {product.sku && <div className="grid grid-cols-2 gap-2">
                          <dt className="font-medium text-muted-foreground">SKU</dt>
                          <dd className="text-foreground font-mono">{product.sku}</dd>
                      </div>}
                      {product.upccode && <div className="grid grid-cols-2 gap-2">
                          <dt className="font-medium text-muted-foreground">UPC</dt>
                          <dd className="text-foreground font-mono">{product.upccode}</dd>
                      </div>}
                      {product.createdon && <div className="grid grid-cols-2 gap-2">
                          <dt className="font-medium text-muted-foreground">Date Added</dt>
                          <dd className="text-foreground">{formattedCreatedOn || '...'}</dd>
                      </div>}
                  </dl>
                  {product.description.long && (
                      <>
                          <Separator className="my-6" />
                          <div>
                              <h4 className="font-medium mb-2">Full Description</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description.long}</p>
                          </div>
                      </>
                  )}
              </CardContent>
            </Card>

            {(loadingMoreProducts || moreProducts.length > 0) && (
              <section className="space-y-6 pt-8">
                  <h2 className="text-xl font-bold">More from {product.merchantname}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {loadingMoreProducts ? (
                      [...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                          <Skeleton className="aspect-square w-full rounded-xl" />
                          <Skeleton className="h-5 w-5/6" />
                          <Skeleton className="h-6 w-1/4" />
                      </div>
                      ))
                  ) : (
                      moreProducts.map(p => (
                          <BrandProductCard key={p.linkid} product={p} />
                      ))
                  )}
                  </div>
              </section>
            )}
          </main>

          <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-6 lg:overflow-y-auto lg:h-full pt-8 pb-8 mb-8 lg:mb-0">
              {loadingCoupons ? (
                  <CouponSidebarSkeleton />
              ) : (
                sortedCoupons.length > 0 && (
                  <section className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Ticket className="h-6 w-6 text-primary" />
                        Available Coupons
                      </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {sortedCoupons.map((coupon, index) => (
                        <BrandCouponCard key={index} coupon={coupon} />
                      ))}
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/admin/coupons">View All Coupons</Link>
                    </Button>
                  </section>
                )
              )}
          </aside>
        </div>
      </div>
    </>
  );
}
