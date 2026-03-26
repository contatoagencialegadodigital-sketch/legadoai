import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Autenticação desativada - acesso livre a todas as rotas
  return <>{children}</>;
}
