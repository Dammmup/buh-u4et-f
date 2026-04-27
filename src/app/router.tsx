import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";
import { AppLayout } from "../shared/components/AppLayout";
import { LandingPage } from "../modules/landing/LandingPage";
import { LoginPage } from "../modules/auth/LoginPage";
import { RegisterPage } from "../modules/auth/RegisterPage";
import { DashboardPage } from "../modules/dashboard/DashboardPage";
import { ServicesPage } from "../modules/services/ServicesPage";
import { ServiceCalculatorPage } from "../modules/services/ServiceCalculatorPage";
import { OrdersPage } from "../modules/orders/OrdersPage";
import { AdminPage } from "../modules/admin/AdminPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
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
          <ProtectedRoute roles={["admin"]}>
            <AdminPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
