
import ProductTracker from '@/components/product-tracker';

export default function ProductsPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-xl font-bold font-headline text-primary">Find The Best Deals</h1>
        <p className="text-base text-muted-foreground mt-2">
          Search for products across your favorite brands and instantly find matching coupons.
        </p>
      </header>
      <ProductTracker />
    </div>
  );
}
