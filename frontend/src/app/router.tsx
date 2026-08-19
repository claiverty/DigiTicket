import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { HomePage } from '../pages/home-page';
import { LoginPage } from '../pages/login-page';
import { RegisterPage } from '../pages/register-page';
import { ProfilePage } from '../pages/profile-page';
import { ProtectedRoute } from '../components/protected-route';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'entrar', element: <LoginPage /> },
      { path: 'cadastro', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'perfil', element: <ProfilePage /> }],
      },
    ],
  },
]);
