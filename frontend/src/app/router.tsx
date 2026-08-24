import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { ProtectedRoute } from '../components/protected-route';
import { RoleRoute } from '../components/role-route';

const HomePage = lazy(() => import('../pages/home-page').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('../pages/login-page').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../pages/register-page').then((module) => ({ default: module.RegisterPage })));
const ProfilePage = lazy(() => import('../pages/profile-page').then((module) => ({ default: module.ProfilePage })));
const EventDetailsPage = lazy(() => import('../pages/event-details-page').then((module) => ({ default: module.EventDetailsPage })));
const OrganizerDashboardPage = lazy(() => import('../pages/organizer-dashboard-page').then((module) => ({ default: module.OrganizerDashboardPage })));
const OrganizerSalesPage = lazy(() => import('../pages/organizer-sales-page').then((module) => ({ default: module.OrganizerSalesPage })));
const EventFormPage = lazy(() => import('../pages/event-form-page').then((module) => ({ default: module.EventFormPage })));
const TicketTypesPage = lazy(() => import('../pages/ticket-types-page').then((module) => ({ default: module.TicketTypesPage })));
const MyReservationsPage = lazy(() => import('../pages/my-reservations-page').then((module) => ({ default: module.MyReservationsPage })));
const CheckoutPage = lazy(() => import('../pages/checkout-page').then((module) => ({ default: module.CheckoutPage })));
const MyTicketsPage = lazy(() => import('../pages/my-tickets-page').then((module) => ({ default: module.MyTicketsPage })));
const TicketDetailsPage = lazy(() => import('../pages/ticket-details-page').then((module) => ({ default: module.TicketDetailsPage })));
const SharedTicketPage = lazy(() => import('../pages/shared-ticket-page').then((module) => ({ default: module.SharedTicketPage })));
const GatePage = lazy(() => import('../pages/gate-page').then((module) => ({ default: module.GatePage })));
const TicketTransfersPage = lazy(() => import('../pages/ticket-transfers-page').then((module) => ({ default: module.TicketTransfersPage })));
const ExternalEventsPage = lazy(() => import('../pages/external-events-page').then((module) => ({ default: module.ExternalEventsPage })));
const SeatMapPage = lazy(() => import('../pages/seat-map-page').then((module) => ({ default: module.SeatMapPage })));

function loadPage(page: ReactNode) {
  return (
    <Suspense fallback={<div role="status" className="mx-auto max-w-7xl px-6 py-20 text-sm font-semibold text-slate-500">Carregando página…</div>}>
      {page}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: loadPage(<HomePage />) },
      { path: 'eventos/:slug', element: loadPage(<EventDetailsPage />) },
      { path: 'entrar', element: loadPage(<LoginPage />) },
      { path: 'cadastro', element: loadPage(<RegisterPage />) },
      {
        path: 'ingresso/compartilhado/:shareToken',
        element: loadPage(<SharedTicketPage />),
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'perfil', element: loadPage(<ProfilePage />) },
          {
            element: <RoleRoute allowedRoles={['CUSTOMER']} />,
            children: [
              { path: 'minhas-reservas', element: loadPage(<MyReservationsPage />) },
              { path: 'checkout/:id', element: loadPage(<CheckoutPage />) },
              { path: 'meus-ingressos', element: loadPage(<MyTicketsPage />) },
              { path: 'transferencias', element: loadPage(<TicketTransfersPage />) },
              {
                path: 'meus-ingressos/:id',
                element: loadPage(<TicketDetailsPage />),
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={['ORGANIZER']} />,
            children: [
              { path: 'organizador', element: loadPage(<OrganizerDashboardPage />) },
              { path: 'organizador/vendas', element: loadPage(<OrganizerSalesPage />) },
              {
                path: 'organizador/importar-eventos',
                element: loadPage(<ExternalEventsPage />),
              },
              { path: 'organizador/eventos/novo', element: loadPage(<EventFormPage />) },
              {
                path: 'organizador/eventos/:id/editar',
                element: loadPage(<EventFormPage />),
              },
              {
                path: 'organizador/eventos/:id/ingressos',
                element: loadPage(<TicketTypesPage />),
              },
              {
                path: 'organizador/eventos/:id/assentos',
                element: loadPage(<SeatMapPage />),
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={['GATE']} />,
            children: [{ path: 'portaria', element: loadPage(<GatePage />) }],
          },
        ],
      },
    ],
  },
]);
