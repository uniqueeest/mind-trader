import { OverviewDashboard } from '@/widgets/overview-dashboard/ui/OverviewDashboard';
import { AuthLayout } from '@/app/layouts/auth/AuthLayout';

export default function Home() {
  return (
    <AuthLayout>
      <OverviewDashboard />
    </AuthLayout>
  );
}
