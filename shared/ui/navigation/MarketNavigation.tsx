'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MarketNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: '전체 보기',
      icon: '📊',
      description: '모든 매매 기록',
    },
    {
      href: '/ko-stock',
      label: '한국 주식',
      icon: '🇰🇷',
      description: '국내 증시 매매',
    },
    {
      href: '/us-stock',
      label: '미국 주식',
      icon: '🇺🇸',
      description: '해외 증시 매매',
    },
  ];

  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* 로고/제목 */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-gray-900">
              🧠 마인드 트레이더
            </h1>
            <Badge variant="secondary" className="text-xs">
              MVP
            </Badge>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`flex items-center space-x-2 h-fit py-1 ${
                      isActive
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    size="sm"
                  >
                    <span className="text-lg">{item.icon}</span>
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
    </div>
  );
}
