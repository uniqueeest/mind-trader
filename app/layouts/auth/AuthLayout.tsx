'use client';

import { useSession } from 'next-auth/react';
import { LoadingLayout } from '@/shared/ui/loading/LoadingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { status } = useSession();

  // 세션 로딩 중
  if (status === 'loading') {
    return (
      <LoadingLayout isLoading={true}>
        <div className="text-center">
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </LoadingLayout>
    );
  }

  // 인증되지 않은 경우
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              이 페이지를 보려면 먼저 로그인해주세요.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 인증된 경우
  return children;
}
