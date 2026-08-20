import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { HomePage } from '../pages/home-page';
import { LoginPage } from '../pages/login-page';
import { RegisterPage } from '../pages/register-page';
import { ProfilePage } from '../pages/profile-page';
import { ProtectedRoute } from '../components/protected-route';
import { RoleRoute } from '../components/role-route';
import { EventDetailsPage } from '../pages/event-details-page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard-page';
import { EventFormPage } from '../pages/event-form-page';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'eventos/:slug', element: <EventDetailsPage /> },
      { path: 'entrar', element: <LoginPage /> },
      { path: 'cadastro', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'perfil', element: <ProfilePage /> },
          {
            element: <RoleRoute allowedRoles={['ORGANIZER']} />,
            children: [
              { path: 'organizador', element: <OrganizerDashboardPage /> },
              { path: 'organizador/eventos/novo', element: <EventFormPage /> },
              {
                path: 'organizador/eventos/:id/editar',
                element: <EventFormPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
