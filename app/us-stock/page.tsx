import { UsStockDashboard } from '@/widgets/us-stock-dashboard/ui/UsStockDashboard';
import { AuthLayout } from '../layouts/auth/AuthLayout';

export default function UsStockPage() {
  return (
    <AuthLayout>
      <UsStockDashboard />
    </AuthLayout>
  );
}
