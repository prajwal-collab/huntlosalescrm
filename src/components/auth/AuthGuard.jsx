// ============================================
// HUNTLO SALES OS — AUTH GUARD (Production)
// ============================================
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

export default function AuthGuard() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div className="huntlo-spinner" />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500 }}>
          Loading Huntlo OS…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}
