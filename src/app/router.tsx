import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";
import { AppLayout } from "../shared/components/AppLayout";
import { LoginPage } from "../modules/auth/LoginPage";
import { RegisterPage } from "../modules/auth/RegisterPage";
import { DashboardPage } from "../modules/dashboard/DashboardPage";
import { ServicesPage } from "../modules/services/ServicesPage";
import { ServiceCalculatorPage } from "../modules/services/ServiceCalculatorPage";
import { OrdersPage } from "../modules/orders/OrdersPage";

// The landing page and the admin panel are the two heaviest modules and are never
// needed together, so they are split out of the initial bundle.
const LandingPage = lazy(() =>
  import("../modules/landing/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const AdminPage = lazy(() =>
  import("../modules/admin/AdminPage").then((m) => ({ default: m.AdminPage }))
);

function withSuspense(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress />
        </Stack>
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: withSuspense(<LandingPage />) },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/services", element: <ServicesPage /> },
      { path: "/services/:id/calculate", element: <ServiceCalculatorPage /> },
      { path: "/orders", element: <OrdersPage /> },
      {
        path: "/admin",
        element: (
          <ProtectedRoute roles={["admin"]}>{withSuspense(<AdminPage />)}</ProtectedRoute>
        )
      }
    ]
  }
]);
