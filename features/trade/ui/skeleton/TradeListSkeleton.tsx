import { Card, CardContent } from '@/components/ui/card';

export function TradeListSkeleton() {
  return (
    <section className="w-full max-w-4xl mx-auto space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
