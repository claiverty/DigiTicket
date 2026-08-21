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
import { TicketTypesPage } from '../pages/ticket-types-page';
import { MyReservationsPage } from '../pages/my-reservations-page';
import { CheckoutPage } from '../pages/checkout-page';
import { MyTicketsPage } from '../pages/my-tickets-page';
import { TicketDetailsPage } from '../pages/ticket-details-page';
import { SharedTicketPage } from '../pages/shared-ticket-page';
import { GatePage } from '../pages/gate-page';
import { TicketTransfersPage } from '../pages/ticket-transfers-page';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'eventos/:slug', element: <EventDetailsPage /> },
      { path: 'entrar', element: <LoginPage /> },
      { path: 'cadastro', element: <RegisterPage /> },
      {
        path: 'ingresso/compartilhado/:shareToken',
        element: <SharedTicketPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'perfil', element: <ProfilePage /> },
          {
            element: <RoleRoute allowedRoles={['CUSTOMER']} />,
            children: [
              { path: 'minhas-reservas', element: <MyReservationsPage /> },
              { path: 'checkout/:id', element: <CheckoutPage /> },
              { path: 'meus-ingressos', element: <MyTicketsPage /> },
              { path: 'transferencias', element: <TicketTransfersPage /> },
              {
                path: 'meus-ingressos/:id',
                element: <TicketDetailsPage />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={['ORGANIZER']} />,
            children: [
              { path: 'organizador', element: <OrganizerDashboardPage /> },
              { path: 'organizador/eventos/novo', element: <EventFormPage /> },
              {
                path: 'organizador/eventos/:id/editar',
                element: <EventFormPage />,
              },
              {
                path: 'organizador/eventos/:id/ingressos',
                element: <TicketTypesPage />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={['GATE']} />,
            children: [{ path: 'portaria', element: <GatePage /> }],
          },
        ],
      },
    ],
  },
]);
