
import PartnershipTracker from '@/components/partnership-tracker';
import AnalyticsStatus from '@/components/analytics-status';

export default function AdminDashboardPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-2xl font-bold font-headline text-primary">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Review your site status and manage partnerships.
        </p>
      </header>
      <div className="space-y-8">
        <AnalyticsStatus />
        <PartnershipTracker />
      </div>
    </div>
  );
}
