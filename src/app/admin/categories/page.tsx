
import MerchantsByCategory from '@/components/category-browser';

export default function CategoriesPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-2xl font-bold font-headline text-primary">Search Merchants by Category</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Find advertisers belonging to a specific category.
        </p>
      </header>
      <MerchantsByCategory />
    </div>
  );
}
