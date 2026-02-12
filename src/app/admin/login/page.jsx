import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/admin';

  useEffect(() => {
    // Редиректим на общую страницу логина с returnUrl
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
  }, [navigate, returnUrl]);

  return null;
}
