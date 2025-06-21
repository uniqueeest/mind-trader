'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { prefetchTrades } from '@/features/trade/model/prefetch';

const NAV_ITEMS = [
  {
    href: '/',
    label: '전체 보기',
    description: '모든 매매 기록',
  },
  {
    href: '/ko-stock',
    label: '한국 주식',
    description: '국내 증시 매매',
  },
  {
    href: '/us-stock',
    label: '미국 주식',
    description: '해외 증시 매매',
  },
];

export function MarketNavigation() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'flex flex-col lg:flex-row items-start lg:items-center lg:justify-between gap-4',
            'py-4'
          )}
        >
          <h1 className="text-xl font-bold text-gray-900">마인드 트레이더</h1>
          <nav className="flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const market =
                item.href === '/ko-stock'
                  ? 'KR'
                  : item.href === '/us-stock'
                  ? 'US'
                  : undefined;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => market && prefetchTrades(market)}
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'flex items-center space-x-2 h-fit py-1',
                      isActive
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'hover:bg-gray-100'
                    )}
                    size="sm"
                  >
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs opacity-75">
                        {item.description}
                      </span>
                    </div>
                    <span className="md:hidden font-medium text-sm">
                      {item.label}
                    </span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
