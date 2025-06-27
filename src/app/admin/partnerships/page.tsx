
import PartnershipTracker from '@/components/partnership-tracker';

export default function AdminPartnershipsPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-2xl font-bold font-headline text-primary">Rakuten Partnership Tracker</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Search and view your advertiser partnership data.
        </p>
      </header>
      <PartnershipTracker />
    </div>
  );
}
