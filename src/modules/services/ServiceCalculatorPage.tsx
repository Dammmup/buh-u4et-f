import AddCardIcon from "@mui/icons-material/AddCard";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CalculateIcon from "@mui/icons-material/Calculate";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import type { CalculationBreakdownItem, OrderCalculation } from "../../entities/order/model";
import type { AccountingService, ServiceParameter } from "../../entities/service/model";
import { api, formatMoney, getApiErrorStatus } from "../../shared/api/client";
import { PageHeader } from "../../shared/components/PageHeader";

type CalculatorParams = Record<string, number | string>;

function makeInitialParams(service: AccountingService): CalculatorParams {
  return service.parameters.reduce<CalculatorParams>((acc, parameter) => {
    acc[parameter.key] = parameter.defaultValue ?? (parameter.inputType === "number" ? parameter.min ?? 0 : "");
    return acc;
  }, {});
}

function parseParamValue(parameter: ServiceParameter, value: string): number | string {
  if (parameter.inputType !== "number") {
    return value;
  }

  if (value === "") {
    return "";
  }

  return Number(value);
}

export function ServiceCalculatorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<AccountingService | null>(null);
  const [params, setParams] = useState<CalculatorParams>({});
  const [calculation, setCalculation] = useState<OrderCalculation | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMessage("");
    api
      .get<{ service: AccountingService }>(`/services/${id}`)
      .then((response) => {
        const nextService = response.data.service;
        setService(nextService);
        setParams(makeInitialParams(nextService));
        setCalculation(null);
      })
      .catch(() => setMessage("Услуга не найдена или временно недоступна."))
      .finally(() => setLoading(false));
  }, [id]);

  const baseBreakdown = useMemo<CalculationBreakdownItem[]>(
    () =>
      service
        ? [
            {
              key: "base",
              type: "base",
              label: "Базовая стоимость",
              amount: service.pricing.basePrice,
              quantity: 1,
              unitPrice: service.pricing.basePrice
            }
          ]
        : [],
    [service]
  );

  const activateSubscription = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      await api.post("/subscriptions", { plan: "starter", paymentReference: `web-starter-${Date.now()}` });
      setNeedsSubscription(false);
      setMessage("Подписка активирована. Можно продолжить оформление заказа.");
    } catch {
      setMessage("Не удалось подключить подписку.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculate = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await api.post<{ calculation: OrderCalculation; normalizedParams: CalculatorParams }>(
        "/orders/calculate",
        { serviceId: id, params }
      );
      setCalculation(response.data.calculation);
      setParams(response.data.normalizedParams);
      setNeedsSubscription(false);
    } catch (error) {
      if (getApiErrorStatus(error) === 402) {
        setNeedsSubscription(true);
      } else if (getApiErrorStatus(error) === 403) {
        setMessage("Ваш тариф не позволяет выполнить это действие или лимит на месяц исчерпан.");
      } else {
        setMessage("Не удалось рассчитать услугу. Проверьте параметры.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const createOrder = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await api.post<{ order: { _id: string } }>("/orders", { serviceId: id, params, comment });
      setMessage("Заказ создан.");
      window.setTimeout(() => navigate("/orders", { state: { orderId: response.data.order._id } }), 450);
    } catch (error) {
      if (getApiErrorStatus(error) === 402) {
        setNeedsSubscription(true);
      } else if (getApiErrorStatus(error) === 403) {
        setMessage("Ваш тариф не позволяет создать этот заказ или лимит на месяц исчерпан.");
      } else {
        setMessage("Не удалось создать заказ.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <LinearProgress />
        <Typography color="text.secondary">Загрузка калькулятора...</Typography>
      </Stack>
    );
  }

  if (!service) {
    return <Alert severity="error">{message || "Услуга не найдена."}</Alert>;
  }

  const visibleBreakdown = calculation?.breakdown ?? baseBreakdown;
  const total = calculation?.total ?? service.pricing.basePrice;

  return (
    <Stack spacing={3} component="form" onSubmit={createOrder}>
      <PageHeader
        eyebrow={service.category}
        title={service.name}
        description={service.description}
        actions={
          <Button component={RouterLink} to="/services" variant="outlined" startIcon={<KeyboardBackspaceIcon />}>
            К услугам
          </Button>
        }
        metrics={[
          { label: "база", value: formatMoney(service.pricing.basePrice) },
          { label: "правил", value: service.pricing.rules.length },
          { label: "параметров", value: service.parameters.length }
        ]}
      />

      {needsSubscription && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddCardIcon />}
              onClick={activateSubscription}
              disabled={submitting}
            >
              Подключить
            </Button>
          }
        >
          Для расчета и создания заказа нужна активная подписка.
        </Alert>
      )}

      {message && !needsSubscription && (
        <Alert severity={message.includes("Не удалось") ? "error" : "success"}>{message}</Alert>
      )}

      <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "minmax(0, 1fr) 420px" }} gap={3} alignItems="start">
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h6">Параметры</Typography>
                <Typography color="text.secondary">
                  Итог обновляется после расчета и сохраняется в заказе вместе с детализацией.
                </Typography>
              </Stack>

              {service.parameters.length === 0 && (
                <Alert severity="info">У этой услуги фиксированная базовая стоимость.</Alert>
              )}

              <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }} gap={2}>
                {service.parameters.map((parameter) => (
                  <TextField
                    key={parameter.key}
                    label={parameter.label}
                    select={parameter.inputType === "select"}
                    type={parameter.inputType === "number" ? "number" : "text"}
                    value={params[parameter.key] ?? ""}
                    inputProps={{
                      min: parameter.min,
                      max: parameter.max,
                      step: parameter.step ?? (parameter.inputType === "number" ? 1 : undefined)
                    }}
                    helperText={parameter.helpText ?? (parameter.unit ? `Единица: ${parameter.unit}` : " ")}
                    onChange={(event) =>
                      setParams((current) => ({
                        ...current,
                        [parameter.key]: parseParamValue(parameter, event.target.value)
                      }))
                    }
                    required={parameter.required}
                    fullWidth
                  >
                    {(parameter.options ?? []).map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
              </Box>

              <TextField
                label="Комментарий к заказу"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                multiline
                minRows={3}
                fullWidth
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={submitting ? <CircularProgress size={18} /> : <CalculateIcon />}
                  onClick={calculate}
                  disabled={submitting}
                >
                  Рассчитать
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AssignmentTurnedInIcon />}
                  disabled={submitting}
                >
                  Создать заказ
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Итог
                </Typography>
                <Typography variant="h3" color="secondary.dark">
                  {formatMoney(total)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Subtotal: ${formatMoney(calculation?.subtotal ?? service.pricing.basePrice)}`} />
                <Chip label={`Adjustments: ${formatMoney(calculation?.adjustmentsTotal ?? 0)}`} variant="outlined" />
              </Stack>

              <Divider />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Позиция</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleBreakdown.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={800}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {item.quantity} x {formatMoney(item.unitPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={900}>
                          {formatMoney(item.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {calculation?.domain && (
                <>
                  <Divider />
                  <Stack spacing={1.5}>
                    <Typography variant="h6">{calculation.domain.label}</Typography>
                    {calculation.domain.warnings?.map((warning) => (
                      <Alert key={warning} severity="warning">
                        {warning}
                      </Alert>
                    ))}
                    <Table size="small">
                      <TableBody>
                        {calculation.domain.breakdown.map((item) => (
                          <TableRow key={item.key}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={900}>
                                {typeof item.value === "number" && item.unit === "KZT"
                                  ? formatMoney(item.value)
                                  : `${String(item.value)}${item.unit && item.unit !== "KZT" ? ` ${item.unit}` : ""}`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Stack>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
