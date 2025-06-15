import { cn } from '@/lib/utils';

export const LoadingSpinner = () => {
  return (
    <div>
      <div
        className={cn(
          'mx-auto',
          'h-12 w-12',
          'border-b-2 border-blue-600',
          'animate-spin rounded-full'
        )}
      />
    </div>
  );
};
