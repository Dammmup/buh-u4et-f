import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalculateIcon from "@mui/icons-material/Calculate";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../app/store/AuthContext";
import type { Order } from "../../entities/order/model";
import type { Subscription, SubscriptionAccess, SubscriptionPlanPolicy } from "../../entities/user/model";
import { api, formatDateTime, formatMoney } from "../../shared/api/client";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatusChip } from "../../shared/components/StatusChip";

interface CurrentSubscriptionResponse {
  subscription: Subscription | null;
  access: SubscriptionAccess | null;
}

function usagePercent(used: number, limit: number) {
  return Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
}

export function DashboardPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanPolicy[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subscriptionResponse, ordersResponse, plansResponse] = await Promise.all([
        api.get<CurrentSubscriptionResponse>("/subscriptions/current"),
        api.get<{ orders: Order[] }>("/orders"),
        api.get<{ plans: SubscriptionPlanPolicy[] }>("/subscriptions/plans")
      ]);
      setSubscription(subscriptionResponse.data.subscription);
      setAccess(subscriptionResponse.data.access);
      setOrders(ordersResponse.data.orders);
      setPlans(plansResponse.data.plans);
    } catch {
      setError("Не удалось обновить данные кабинета.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeOrders = orders.filter((order) => order.status !== "done").length;
  const doneOrders = orders.filter((order) => order.status === "done").length;
  const totalAmount = orders.reduce((sum, order) => sum + order.calculation.total, 0);
  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);
  const expiresAt = subscription ? formatDateTime(subscription.expiresAt) : null;

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow={user?.role === "admin" ? "Администратор" : "Клиент"}
        title={`Здравствуйте, ${user?.name ?? "клиент"}`}
        description="Ваши заказы, подписка, лимиты и бухгалтерские задачи собраны в одном рабочем пространстве."
        actions={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={RouterLink} to="/services" variant="contained" startIcon={<CalculateIcon />}>
              Рассчитать услугу
            </Button>
            {user?.role === "admin" && (
              <Button component={RouterLink} to="/admin" variant="outlined" startIcon={<AdminPanelSettingsIcon />}>
                Админ панель
              </Button>
            )}
          </Stack>
        }
        metrics={[
          { label: "активных", value: activeOrders },
          { label: "готовых", value: doneOrders },
          { label: "сумма", value: formatMoney(totalAmount) }
        ]}
      />

      {loading && <LinearProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1.15fr 0.85fr" }} gap={3} alignItems="start">
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
                    <Stack spacing={1}>
                      <Typography variant="h6">Подписка</Typography>
                      {subscription && access ? (
                        <Typography color="text.secondary">
                          {access.plan.title} активен до {expiresAt}. Сумма: {formatMoney(subscription.amount)}.
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">
                          Тариф назначает администратор. После выдачи доступа откроются расчёты, заказы и загрузка
                          документов.
                        </Typography>
                      )}
                    </Stack>
                    <Stack spacing={1.5} alignItems={{ xs: "stretch", md: "flex-end" }}>
                      <Typography variant="h4" color={subscription ? "success.main" : "warning.main"}>
                        {subscription ? "Active" : "Нет тарифа"}
                      </Typography>
                      {subscription && access && <Chip label={access.plan.plan} color="primary" />}
                    </Stack>
                  </Stack>

                  {!subscription && (
                    <Alert severity="info">
                      Напишите нам или дождитесь, пока администратор подключит подходящий тариф. Самостоятельная
                      активация отключена.
                    </Alert>
                  )}

                  {access && (
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        Лимиты обновятся {formatDateTime(access.usage.periodEnd)}
                      </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
                      {[
                        ["Расчеты", access.usage.calculations.used, access.usage.calculations.limit],
                        ["Заказы", access.usage.orders.used, access.usage.orders.limit],
                        ["Документы", access.usage.uploadFiles.used, access.usage.uploadFiles.limit]
                      ].map(([label, used, limit]) => (
                        <Paper key={String(label)} elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                          <Typography fontWeight={900}>{label}</Typography>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {used} из {limit}
                          </Typography>
                          <LinearProgress variant="determinate" value={usagePercent(Number(used), Number(limit))} />
                        </Paper>
                      ))}
                    </Box>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {plans.length > 0 && (
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
                {plans.map((plan) => (
                  <Card key={plan.plan} sx={{ borderColor: plan.plan === "business" ? "primary.main" : "divider" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack spacing={0.5}>
                          <Typography variant="h6">{plan.title}</Typography>
                          <Typography color="text.secondary">{plan.description}</Typography>
                        </Stack>
                        <Typography variant="h4" color="secondary.dark">
                          {formatMoney(plan.amount)}
                        </Typography>
                        <Stack spacing={1}>
                          {plan.features.slice(0, 4).map((feature) => (
                            <Typography key={feature} variant="body2" color="text.secondary">
                              {feature}
                            </Typography>
                          ))}
                        </Stack>
                        {subscription?.plan === plan.plan ? (
                          <Chip label="Ваш текущий тариф" color="success" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Назначается администратором
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            <Card>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                    <Typography variant="h6">Последние заказы</Typography>
                    <Button component={RouterLink} to="/orders" variant="text" startIcon={<AssignmentIcon />}>
                      Все заказы
                    </Button>
                  </Stack>

                  {recentOrders.length === 0 ? (
                    <EmptyState
                      icon={<ReceiptLongIcon />}
                      title="Заказов пока нет"
                      description="Выберите услугу, заполните параметры и создайте первый заказ."
                      actionLabel="Открыть услуги"
                      actionTo="/services"
                    />
                  ) : (
                    <Stack spacing={1.5}>
                      {recentOrders.map((order) => (
                        <Paper
                          key={order._id}
                          elevation={0}
                          sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                        >
                          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
                            <Stack spacing={0.5}>
                              <Typography fontWeight={800}>{order.serviceSnapshot.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDateTime(order.createdAt)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <StatusChip status={order.status} />
                              <Typography fontWeight={900} color="secondary.dark">
                                {formatMoney(order.calculation.total)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={3}>
            {[
              {
                icon: <CalculateIcon />,
                title: "Калькулятор услуг",
                text: "Доступ к услугам зависит от тарифа, который выдал администратор.",
                to: "/services",
                action: "Рассчитать"
              },
              {
                icon: <AssignmentIcon />,
                title: "Документы и статусы",
                text: "Лимиты загрузки документов и создания заказов применяются автоматически.",
                to: "/orders",
                action: "Открыть"
              }
            ].map((item) => (
              <Card key={item.title}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        bgcolor: "primary.light",
                        color: "primary.main"
                      }}
                    >
                      {item.icon}
                    </Stack>
                    <Stack spacing={1}>
                      <Typography variant="h6">{item.title}</Typography>
                      <Typography color="text.secondary">{item.text}</Typography>
                    </Stack>
                    <Button component={RouterLink} to={item.to} variant="outlined" startIcon={<TrendingUpIcon />}>
                      {item.action}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
