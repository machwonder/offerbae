"use client";

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { getCurrencySymbol, slugify, getDomainFromName, getLogoUrl } from '@/lib/utils';
import { Store, ShoppingCart } from 'lucide-react';

interface HomepageProductCardProps {
    product: Product;
}

export default function HomepageProductCard({ product }: HomepageProductCardProps) {
    const router = useRouter();
    const [logoError, setLogoError] = React.useState(false);

    const handleNavigation = () => {
        sessionStorage.setItem(`product-${product.linkid}`, JSON.stringify(product));
        const brandSlug = slugify(product.merchantname);
        const productSlug = slugify(product.productname);
        router.push(`/item/${brandSlug}/${productSlug}-${product.linkid}`);
    };

    const regularPrice = product.price?.['#text'];
    const salePrice = product.saleprice?.['#text'];
    const currency = getCurrencySymbol(product.price?.['@_currency']);
    const isOnSale = !!(regularPrice && salePrice && salePrice > 0 && salePrice < regularPrice);
    
    const urlForLogo = product.advertiserUrl;
    const logoUrl = getLogoUrl(urlForLogo);

    return (
        <Card onClick={handleNavigation} className="cursor-pointer group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
            <div className="aspect-square relative w-full">
                {product.imageurl ? (
                    <Image 
                      src={product.imageurl} 
                      alt={product.productname} 
                      fill 
                      sizes="15vw" 
                      className="object-cover transition-transform group-hover:scale-105" 
                      data-ai-hint={`${product.category.primary}`} 
                    />
                ) : (
                     <div className="h-full w-full bg-muted flex items-center justify-center">
                         <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
                 <div className="absolute bottom-1 right-1 bg-card/70 backdrop-blur-sm p-1 rounded-full border border-border/50 shadow-md">
                    {logoUrl && !logoError ? (
                        <div className="relative w-6 h-6">
                            <Image 
                                src={logoUrl} 
                                alt={`${product.merchantname} Logo`} 
                                fill sizes="24px" 
                                className="object-contain rounded-full"
                                onError={() => setLogoError(true)}
                            />
                        </div>
                    ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>
            <div className="p-2 space-y-2 flex flex-col flex-grow">
                 <p className="text-xs font-medium text-foreground leading-tight">{product.productname}</p>
                 <div className="flex flex-col mt-auto">
                    {isOnSale && salePrice && regularPrice ? (
                        <>
                            <span className="font-bold text-destructive text-sm">{currency}{salePrice.toFixed(2)}</span>
                            <span className="font-medium text-muted-foreground line-through text-xs">{currency}{regularPrice.toFixed(2)}</span>
                        </>
                    ) : (
                        regularPrice && <span className="font-bold text-foreground text-sm">{currency}{regularPrice.toFixed(2)}</span>
                    )}
                </div>
            </div>
        </Card>
    );
}
