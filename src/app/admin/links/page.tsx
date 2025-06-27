
import LinkTracker from '@/components/link-tracker';

export default function LinksPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-2xl font-bold font-headline text-primary">Rakuten Link Locator</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Find text links, banners, and rich media links from advertisers.
        </p>
      </header>
      <LinkTracker />
    </div>
  );
}
