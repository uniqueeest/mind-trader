import { KoStockDashboard } from '@/widgets/ko-stock-dashboard/ui/KoStockDashboard';
import { AuthLayout } from '../layouts/auth/AuthLayout';

export default function KoStockPage() {
  return (
    <AuthLayout>
      <KoStockDashboard />
    </AuthLayout>
  );
}
