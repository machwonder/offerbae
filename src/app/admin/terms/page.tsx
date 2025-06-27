
import TermsViewer from '@/components/link-api-test';

export default function TermsPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-2xl font-bold font-headline text-primary">Partnership Terms</h1>
        <p className="text-lg text-muted-foreground mt-2">
          View advertiser commission terms and offer details.
        </p>
      </header>
      <TermsViewer />
    </div>
  );
}
