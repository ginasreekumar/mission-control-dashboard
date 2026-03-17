import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-pulse" />
          <div className="h-6 bg-muted rounded w-32 mx-auto" />
          <div className="h-4 bg-muted rounded w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}
