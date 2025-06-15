import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

export const LoadingLayout = ({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) => {
  if (isLoading) {
    return (
      <section
        className={cn('flex items-center justify-center', 'w-full h-screen')}
      >
        <LoadingSpinner />
      </section>
    );
  }

  return children;
};
