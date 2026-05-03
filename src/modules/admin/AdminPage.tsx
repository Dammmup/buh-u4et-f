import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "../../entities/order/model";
import type {
  AccountingService,
  PricingCondition,
  PricingConditionOperator,
  PricingRule,
  PricingRuleType,
  PricingTier,
  RoundingMode,
  ServiceInputType,
  ServiceParameter
} from "../../entities/service/model";
import { api, formatDateTime, formatMoney } from "../../shared/api/client";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatusChip } from "../../shared/components/StatusChip";

const statuses: OrderStatus[] = ["new", "in_progress", "need_info", "done"];
const inputTypes: ServiceInputType[] = ["number", "text", "select"];
const ruleTypes: PricingRuleType[] = ["per_unit", "per_block", "fixed", "tiered", "percentage"];
const roundingModes: RoundingMode[] = ["none", "ceil", "floor", "round"];
const conditionOperators: PricingConditionOperator[] = ["eq", "neq", "gt", "gte", "lt", "lte", "in"];

const statusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  need_info: "Нужна информация",
  done: "Готово"
};

const ruleTypeLabels: Record<PricingRuleType, string> = {
  per_unit: "За единицу",
  per_block: "За блок",
  fixed: "Фиксированная сумма",
  tiered: "Ступенчатая цена",
  percentage: "Процент от subtotal"
};

interface TelegramSettings {
  chatId: string;
  chatIdConfigured: boolean;
  tokenConfigured: boolean;
  updatedAt?: string;
}

function optionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

function parseMixedValue(value: string): number | string {
  const trimmed = value.trim();
  if (trimmed !== "" && Number.isFinite(Number(trimmed))) {
    return Number(trimmed);
  }
  return trimmed;
}

function parseConditionValue(operator: PricingConditionOperator, value: string): PricingCondition["value"] {
  if (operator === "in") {
    return value
      .split(",")
      .map((item) => parseMixedValue(item))
      .filter((item) => item !== "");
  }

  return parseMixedValue(value);
}

function conditionValueToString(value: PricingCondition["value"]) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function createDraftService(): AccountingService {
  const suffix = Date.now();
  return {
    _id: `draft-${suffix}`,
    name: "Новая услуга",
    slug: `service-${suffix}`,
    description: "Описание услуги для клиента.",
    category: "Новая категория",
    isActive: true,
    parameters: [],
    pricing: {
      currency: "KZT",
      formula: "rules_sum",
      basePrice: 0,
      rounding: { mode: "none", precision: 1 },
      rules: []
    }
  };
}

function newParameter(index: number): ServiceParameter {
  return {
    key: `param${index + 1}`,
    label: "Параметр",
    inputType: "number",
    required: true,
    defaultValue: 0,
    min: 0,
    step: 1,
    unit: "шт."
  };
}

function newRule(parameterKey: string, index: number): PricingRule {
  return {
    key: `rule_${index + 1}`,
    type: "per_unit",
    parameterKey,
    label: "Правило расчета",
    unitPrice: 0,
    includedQuantity: 0,
    taxable: true,
    sortOrder: (index + 1) * 10
  };
}

function servicePayload(service: AccountingService) {
  const { _id: _ignored, ...payload } = service;
  return payload;
}

export function AdminPage() {
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<AccountingService[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersResponse, servicesResponse, telegramResponse] = await Promise.all([
        api.get<{ orders: Order[] }>("/orders/admin/all"),
        api.get<{ services: AccountingService[] }>("/services?includeInactive=true"),
        api.get<{ settings: TelegramSettings }>("/settings/telegram")
      ]);
      setOrders(ordersResponse.data.orders);
      setServices(servicesResponse.data.services);
      setTelegramSettings(telegramResponse.data.settings);
      setTelegramChatId(telegramResponse.data.settings.chatId);
    } catch {
      setError("Не удалось загрузить данные админ панели.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOrders = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );

  const patchService = (serviceId: string, updater: (service: AccountingService) => AccountingService) => {
    setServices((current) => current.map((service) => (service._id === serviceId ? updater(service) : service)));
  };

  const saveService = async (service: AccountingService) => {
    setSavingId(service._id);
    setMessage("");
    setError("");
    try {
      const request = service._id.startsWith("draft-")
        ? api.post<{ service: AccountingService }>("/services", servicePayload(service))
        : api.put<{ service: AccountingService }>(`/services/${service._id}`, servicePayload(service));
      const response = await request;
      setServices((current) =>
        current.map((item) => (item._id === service._id ? response.data.service : item))
      );
      setMessage("Услуга сохранена.");
    } catch {
      setError("Не удалось сохранить услугу. Проверьте параметры и правила расчета.");
    } finally {
      setSavingId("");
    }
  };

  const deleteService = async (service: AccountingService) => {
    setSavingId(service._id);
    setMessage("");
    setError("");
    try {
      if (service._id.startsWith("draft-")) {
        setServices((current) => current.filter((item) => item._id !== service._id));
      } else {
        await api.delete(`/services/${service._id}`);
        await loadData();
      }
      setMessage("Услуга удалена или отключена.");
    } catch {
      setError("Не удалось удалить услугу.");
    } finally {
      setSavingId("");
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const response = await api.patch<{ order: Order }>(`/orders/admin/${orderId}/status`, { status });
    setOrders((current) => current.map((order) => (order._id === orderId ? response.data.order : order)));
    setMessage("Статус заказа обновлен.");
  };

  const recalculateOrder = async (orderId: string) => {
    setSavingId(orderId);
    setMessage("");
    setError("");
    try {
      const response = await api.post<{ order: Order }>(`/orders/admin/${orderId}/recalculate`);
      setOrders((current) => current.map((order) => (order._id === orderId ? response.data.order : order)));
      setMessage("Расчет заказа обновлен по текущим ценам.");
    } catch {
      setError("Не удалось пересчитать заказ.");
    } finally {
      setSavingId("");
    }
  };

  const saveTelegramSettings = async () => {
    setSavingId("telegram-settings");
    setMessage("");
    setError("");
    try {
      const response = await api.put<{ settings: TelegramSettings }>("/settings/telegram", {
        chatId: telegramChatId
      });
      setTelegramSettings(response.data.settings);
      setTelegramChatId(response.data.settings.chatId);
      setMessage("Telegram chat_id сохранен.");
    } catch {
      setError("Не удалось сохранить Telegram chat_id.");
    } finally {
      setSavingId("");
    }
  };

  const testTelegram = async () => {
    setSavingId("telegram-test");
    setMessage("");
    setError("");
    try {
      await api.post("/settings/telegram/test");
      setMessage("Тестовое сообщение отправлено в Telegram.");
    } catch {
      setError("Не удалось отправить тестовое сообщение. Проверьте токен бота и chat_id.");
    } finally {
      setSavingId("");
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.calculation.total, 0);
  const activeServices = services.filter((service) => service.isActive).length;

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="Admin"
        title="Админ панель"
        description="Управление заказами, статусами, услугами и правилами расчета стоимости."
        actions={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>
            Обновить
          </Button>
        }
        metrics={[
          { label: "заказов", value: orders.length },
          { label: "услуг", value: activeServices },
          { label: "оборот", value: formatMoney(totalRevenue) }
        ]}
      />

      {loading && <LinearProgress />}
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Tab label="Заказы" />
          <Tab label="Услуги и цены" />
          <Tab label="Telegram" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && (
            <Stack spacing={2.5}>
              <TextField
                select
                label="Статус"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
                sx={{ maxWidth: { sm: 280 } }}
              >
                <MenuItem value="all">Все заказы</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusLabels[status]}
                  </MenuItem>
                ))}
              </TextField>

              {filteredOrders.length === 0 ? (
                <EmptyState
                  icon={<ReplayIcon />}
                  title="Заказов нет"
                  description="Когда клиенты создадут заказы, они появятся в этом разделе."
                />
              ) : (
                <Stack spacing={2}>
                  {filteredOrders.map((order) => (
                    <Accordion key={order._id} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2} width="100%" pr={2}>
                          <Stack spacing={0.5}>
                            <Typography variant="h6">{order.serviceSnapshot.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.user?.name ?? "Клиент"} · {order.user?.email ?? "email не указан"} · {formatDateTime(order.createdAt)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <StatusChip status={order.status} />
                            <Chip label={formatMoney(order.calculation.total)} color="secondary" />
                          </Stack>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2.5}>
                          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <Select
                              size="small"
                              value={order.status}
                              onChange={(event) => updateStatus(order._id, event.target.value as OrderStatus)}
                              sx={{ minWidth: 220 }}
                            >
                              {statuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                  {statusLabels[status]}
                                </MenuItem>
                              ))}
                            </Select>
                            <Button
                              variant="outlined"
                              startIcon={savingId === order._id ? <LinearProgress sx={{ width: 18 }} /> : <ReplayIcon />}
                              onClick={() => recalculateOrder(order._id)}
                              disabled={savingId === order._id}
                            >
                              Пересчитать
                            </Button>
                          </Stack>

                          <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "0.9fr 1.1fr" }} gap={3}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                              <Typography fontWeight={900} mb={1.5}>
                                Параметры заказа
                              </Typography>
                              <Stack spacing={1}>
                                {Object.entries(order.params).map(([key, value]) => (
                                  <Stack key={key} direction="row" justifyContent="space-between" gap={2}>
                                    <Typography color="text.secondary">{key}</Typography>
                                    <Typography fontWeight={800}>{String(value)}</Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Paper>

                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Расчет</TableCell>
                                  <TableCell align="right">Сумма</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.calculation.breakdown.map((item) => (
                                  <TableRow key={item.key}>
                                    <TableCell>{item.label}</TableCell>
                                    <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell>
                                    <Typography fontWeight={900}>Итого</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontWeight={900} color="secondary.dark">
                                      {formatMoney(order.calculation.total)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            {order.calculation.domain && (
                              <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                                <Stack spacing={1}>
                                  <Typography fontWeight={900}>{order.calculation.domain.label}</Typography>
                                  {order.calculation.domain.breakdown.map((item) => (
                                    <Stack key={item.key} direction="row" justifyContent="space-between" gap={2}>
                                      <Typography color="text.secondary">{item.label}</Typography>
                                      <Typography fontWeight={900}>
                                        {typeof item.value === "number" && item.unit === "KZT"
                                          ? formatMoney(item.value)
                                          : `${String(item.value)}${item.unit && item.unit !== "KZT" ? ` ${item.unit}` : ""}`}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Paper>
                            )}
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
                <Typography variant="h6">Каталог услуг</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setServices((current) => [createDraftService(), ...current])}
                >
                  Новая услуга
                </Button>
              </Stack>

              {services.map((service) => (
                <ServiceEditor
                  key={service._id}
                  service={service}
                  saving={savingId === service._id}
                  onPatch={(updater) => patchService(service._id, updater)}
                  onSave={() => saveService(service)}
                  onDelete={() => deleteService(service)}
                />
              ))}
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2.5}>
              <Typography variant="h6">Telegram заявки</Typography>
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <Chip
                      label={telegramSettings?.tokenConfigured ? "Bot token подключен" : "Нужен TELEGRAM_BOT_TOKEN"}
                      color={telegramSettings?.tokenConfigured ? "success" : "warning"}
                    />
                    <Chip
                      label={telegramSettings?.chatIdConfigured ? "chat_id сохранен" : "chat_id не задан"}
                      color={telegramSettings?.chatIdConfigured ? "success" : "warning"}
                    />
                  </Stack>

                  <TextField
                    label="Telegram chat_id"
                    value={telegramChatId}
                    onChange={(event) => setTelegramChatId(event.target.value)}
                    placeholder="-1001234567890"
                    helperText="Добавьте бота в нужный чат или группу, затем сохраните chat_id. Токен бота хранится только в переменных окружения backend."
                    fullWidth
                  />

                  {telegramSettings?.updatedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Последнее обновление: {formatDateTime(telegramSettings.updatedAt)}
                    </Typography>
                  )}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={saveTelegramSettings}
                      disabled={savingId === "telegram-settings"}
                    >
                      Сохранить chat_id
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SendIcon />}
                      onClick={testTelegram}
                      disabled={
                        savingId === "telegram-test" ||
                        !telegramSettings?.tokenConfigured ||
                        telegramChatId.trim().length === 0
                      }
                    >
                      Отправить тест
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}

interface ServiceEditorProps {
  service: AccountingService;
  saving: boolean;
  onPatch: (updater: (service: AccountingService) => AccountingService) => void;
  onSave: () => void;
  onDelete: () => void;
}

function ServiceEditor({ service, saving, onPatch, onSave, onDelete }: ServiceEditorProps) {
  const patchParameter = (index: number, updater: (parameter: ServiceParameter) => ServiceParameter) => {
    onPatch((current) => ({
      ...current,
      parameters: current.parameters.map((parameter, parameterIndex) =>
        parameterIndex === index ? updater(parameter) : parameter
      )
    }));
  };

  const patchRule = (index: number, updater: (rule: PricingRule) => PricingRule) => {
    onPatch((current) => ({
      ...current,
      pricing: {
        ...current.pricing,
        rules: current.pricing.rules.map((rule, ruleIndex) => (ruleIndex === index ? updater(rule) : rule))
      }
    }));
  };

  const firstParameterKey = service.parameters[0]?.key ?? "";

  return (
    <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: service.isActive ? "divider" : "warning.light", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} width="100%" pr={2}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h6">{service.name}</Typography>
              <Chip label={service.isActive ? "active" : "inactive"} color={service.isActive ? "success" : "warning"} size="small" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {service.category} · {service.slug}
            </Typography>
          </Stack>
          <Chip label={`от ${formatMoney(service.pricing.basePrice)}`} color="secondary" sx={{ alignSelf: "center" }} />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={saving}>
              Сохранить
            </Button>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={onDelete} disabled={saving}>
              Удалить
            </Button>
          </Stack>

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }} gap={2}>
            <TextField label="Название" value={service.name} onChange={(event) => onPatch((current) => ({ ...current, name: event.target.value }))} />
            <TextField label="Slug" value={service.slug} onChange={(event) => onPatch((current) => ({ ...current, slug: event.target.value }))} />
            <TextField label="Категория" value={service.category} onChange={(event) => onPatch((current) => ({ ...current, category: event.target.value }))} />
            <FormControlLabel
              control={
                <Switch
                  checked={service.isActive}
                  onChange={(event) => onPatch((current) => ({ ...current, isActive: event.target.checked }))}
                />
              }
              label="Активна"
            />
            <TextField
              label="Описание"
              value={service.description}
              onChange={(event) => onPatch((current) => ({ ...current, description: event.target.value }))}
              multiline
              minRows={3}
              sx={{ gridColumn: { md: "1 / -1" } }}
            />
          </Box>

          <Divider />

          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
              <Typography variant="h6">Параметры</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  onPatch((current) => ({
                    ...current,
                    parameters: [...current.parameters, newParameter(current.parameters.length)]
                  }))
                }
              >
                Добавить параметр
              </Button>
            </Stack>

            {service.parameters.map((parameter, index) => (
              <Paper key={`${parameter.key}-${index}`} elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr)" }} gap={2}>
                  <TextField label="Key" value={parameter.key} onChange={(event) => patchParameter(index, (item) => ({ ...item, key: event.target.value }))} />
                  <TextField label="Label" value={parameter.label} onChange={(event) => patchParameter(index, (item) => ({ ...item, label: event.target.value }))} />
                  <TextField
                    label="Тип"
                    select
                    value={parameter.inputType}
                    onChange={(event) => patchParameter(index, (item) => ({ ...item, inputType: event.target.value as ServiceInputType }))}
                  >
                    {inputTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={parameter.required}
                          onChange={(event) => patchParameter(index, (item) => ({ ...item, required: event.target.checked }))}
                        />
                      }
                      label="required"
                    />
                    <Tooltip title="Удалить параметр">
                      <IconButton
                        color="error"
                        onClick={() =>
                          onPatch((current) => ({
                            ...current,
                            parameters: current.parameters.filter((_item, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <TextField label="Default" value={parameter.defaultValue ?? ""} onChange={(event) => patchParameter(index, (item) => ({ ...item, defaultValue: parseMixedValue(event.target.value) }))} />
                  <TextField label="Min" type="number" value={parameter.min ?? ""} onChange={(event) => patchParameter(index, (item) => ({ ...item, min: optionalNumber(event.target.value) }))} />
                  <TextField label="Max" type="number" value={parameter.max ?? ""} onChange={(event) => patchParameter(index, (item) => ({ ...item, max: optionalNumber(event.target.value) }))} />
                  <TextField label="Step" type="number" value={parameter.step ?? ""} onChange={(event) => patchParameter(index, (item) => ({ ...item, step: optionalNumber(event.target.value) }))} />
                  <TextField label="Unit" value={parameter.unit ?? ""} onChange={(event) => patchParameter(index, (item) => ({ ...item, unit: event.target.value || undefined }))} />
                  <TextField label="Help text" value={parameter.helpText ?? ""} onChange={(event) => patchParameter(index, (item) => ({ ...item, helpText: event.target.value || undefined }))} sx={{ gridColumn: { md: "span 2" } }} />
                  {parameter.inputType === "select" && (
                    <TextField
                      label="Options"
                      value={(parameter.options ?? []).join(", ")}
                      onChange={(event) =>
                        patchParameter(index, (item) => ({
                          ...item,
                          options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean)
                        }))
                      }
                      sx={{ gridColumn: { md: "1 / -1" } }}
                    />
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>

          <Divider />

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr)" }} gap={2}>
            <TextField
              label="Base price"
              type="number"
              value={service.pricing.basePrice}
              onChange={(event) =>
                onPatch((current) => ({
                  ...current,
                  pricing: { ...current.pricing, basePrice: Number(event.target.value) }
                }))
              }
            />
            <TextField
              label="Minimum price"
              type="number"
              value={service.pricing.minimumPrice ?? ""}
              onChange={(event) =>
                onPatch((current) => ({
                  ...current,
                  pricing: { ...current.pricing, minimumPrice: optionalNumber(event.target.value) }
                }))
              }
            />
            <TextField
              label="Rounding"
              select
              value={service.pricing.rounding?.mode ?? "none"}
              onChange={(event) =>
                onPatch((current) => ({
                  ...current,
                  pricing: {
                    ...current.pricing,
                    rounding: {
                      mode: event.target.value as RoundingMode,
                      precision: current.pricing.rounding?.precision ?? 1
                    }
                  }
                }))
              }
            >
              {roundingModes.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Precision"
              type="number"
              value={service.pricing.rounding?.precision ?? 1}
              onChange={(event) =>
                onPatch((current) => ({
                  ...current,
                  pricing: {
                    ...current.pricing,
                    rounding: {
                      mode: current.pricing.rounding?.mode ?? "none",
                      precision: Number(event.target.value)
                    }
                  }
                }))
              }
            />
          </Box>

          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
              <Typography variant="h6">Правила расчета</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={!firstParameterKey}
                onClick={() =>
                  onPatch((current) => ({
                    ...current,
                    pricing: {
                      ...current.pricing,
                      rules: [...current.pricing.rules, newRule(firstParameterKey, current.pricing.rules.length)]
                    }
                  }))
                }
              >
                Добавить правило
              </Button>
            </Stack>

            {service.pricing.rules.map((rule, index) => (
              <RuleEditor
                key={`${rule.key}-${index}`}
                rule={rule}
                parameters={service.parameters}
                onPatch={(updater) => patchRule(index, updater)}
                onDelete={() =>
                  onPatch((current) => ({
                    ...current,
                    pricing: {
                      ...current.pricing,
                      rules: current.pricing.rules.filter((_item, itemIndex) => itemIndex !== index)
                    }
                  }))
                }
              />
            ))}
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

interface RuleEditorProps {
  rule: PricingRule;
  parameters: ServiceParameter[];
  onPatch: (updater: (rule: PricingRule) => PricingRule) => void;
  onDelete: () => void;
}

function RuleEditor({ rule, parameters, onPatch, onDelete }: RuleEditorProps) {
  const patchTier = (index: number, updater: (tier: PricingTier) => PricingTier) => {
    onPatch((current) => ({
      ...current,
      tiers: (current.tiers ?? []).map((tier, tierIndex) => (tierIndex === index ? updater(tier) : tier))
    }));
  };

  const patchCondition = (index: number, updater: (condition: PricingCondition) => PricingCondition) => {
    onPatch((current) => ({
      ...current,
      conditions: (current.conditions ?? []).map((condition, conditionIndex) =>
        conditionIndex === index ? updater(condition) : condition
      )
    }));
  };

  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2}>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr)" }} gap={2}>
          <TextField label="Rule key" value={rule.key} onChange={(event) => onPatch((current) => ({ ...current, key: event.target.value }))} />
          <TextField label="Label" value={rule.label} onChange={(event) => onPatch((current) => ({ ...current, label: event.target.value }))} />
          <TextField
            label="Type"
            select
            value={rule.type}
            onChange={(event) => onPatch((current) => ({ ...current, type: event.target.value as PricingRuleType }))}
          >
            {ruleTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {ruleTypeLabels[type]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Parameter"
            select
            value={rule.parameterKey}
            onChange={(event) => onPatch((current) => ({ ...current, parameterKey: event.target.value }))}
          >
            {parameters.map((parameter) => (
              <MenuItem key={parameter.key} value={parameter.key}>
                {parameter.label} ({parameter.key})
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Sort order" type="number" value={rule.sortOrder ?? 0} onChange={(event) => onPatch((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
          <TextField label="Included quantity" type="number" value={rule.includedQuantity ?? 0} onChange={(event) => onPatch((current) => ({ ...current, includedQuantity: Number(event.target.value) }))} />
          {(rule.type === "per_unit" || rule.type === "per_block") && (
            <TextField label="Unit price" type="number" value={rule.unitPrice ?? ""} onChange={(event) => onPatch((current) => ({ ...current, unitPrice: optionalNumber(event.target.value) }))} />
          )}
          {rule.type === "per_block" && (
            <TextField label="Block size" type="number" value={rule.blockSize ?? 1} onChange={(event) => onPatch((current) => ({ ...current, blockSize: Number(event.target.value) }))} />
          )}
          {rule.type === "fixed" && (
            <TextField label="Amount" type="number" value={rule.amount ?? ""} onChange={(event) => onPatch((current) => ({ ...current, amount: optionalNumber(event.target.value) }))} />
          )}
          {rule.type === "percentage" && (
            <TextField label="Rate" type="number" value={rule.rate ?? ""} helperText="0.1 = 10%" onChange={(event) => onPatch((current) => ({ ...current, rate: optionalNumber(event.target.value) }))} />
          )}
          <FormControlLabel
            control={<Switch checked={rule.taxable ?? true} onChange={(event) => onPatch((current) => ({ ...current, taxable: event.target.checked }))} />}
            label="taxable"
          />
          <Tooltip title="Удалить правило">
            <IconButton color="error" onClick={onDelete} sx={{ alignSelf: "center" }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {rule.type === "tiered" && (
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={900}>Ступени</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  onPatch((current) => ({
                    ...current,
                    tiers: [...(current.tiers ?? []), { from: 0, unitPrice: 0 }]
                  }))
                }
              >
                Добавить
              </Button>
            </Stack>
            {(rule.tiers ?? []).map((tier, index) => (
              <Box key={`${tier.from}-${index}`} display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr) auto" }} gap={1.5}>
                <TextField label="From" type="number" value={tier.from} onChange={(event) => patchTier(index, (item) => ({ ...item, from: Number(event.target.value) }))} />
                <TextField label="To" type="number" value={tier.to ?? ""} onChange={(event) => patchTier(index, (item) => ({ ...item, to: optionalNumber(event.target.value) }))} />
                <TextField label="Unit price" type="number" value={tier.unitPrice} onChange={(event) => patchTier(index, (item) => ({ ...item, unitPrice: Number(event.target.value) }))} />
                <Box />
                <IconButton
                  color="error"
                  onClick={() =>
                    onPatch((current) => ({
                      ...current,
                      tiers: (current.tiers ?? []).filter((_item, itemIndex) => itemIndex !== index)
                    }))
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}

        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={900}>Условия</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              disabled={!parameters[0]?.key}
              onClick={() =>
                onPatch((current) => ({
                  ...current,
                  conditions: [
                    ...(current.conditions ?? []),
                    { parameterKey: parameters[0]?.key ?? "", operator: "gte", value: 1 }
                  ]
                }))
              }
            >
              Добавить
            </Button>
          </Stack>
          {(rule.conditions ?? []).map((condition, index) => (
            <Box key={`${condition.parameterKey}-${index}`} display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr auto" }} gap={1.5}>
              <TextField
                label="Parameter"
                select
                value={condition.parameterKey}
                onChange={(event) => patchCondition(index, (item) => ({ ...item, parameterKey: event.target.value }))}
              >
                {parameters.map((parameter) => (
                  <MenuItem key={parameter.key} value={parameter.key}>
                    {parameter.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Operator"
                select
                value={condition.operator}
                onChange={(event) =>
                  patchCondition(index, (item) => ({
                    ...item,
                    operator: event.target.value as PricingConditionOperator
                  }))
                }
              >
                {conditionOperators.map((operator) => (
                  <MenuItem key={operator} value={operator}>
                    {operator}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Value"
                value={conditionValueToString(condition.value)}
                onChange={(event) =>
                  patchCondition(index, (item) => ({
                    ...item,
                    value: parseConditionValue(item.operator, event.target.value)
                  }))
                }
              />
              <IconButton
                color="error"
                onClick={() =>
                  onPatch((current) => ({
                    ...current,
                    conditions: (current.conditions ?? []).filter((_item, itemIndex) => itemIndex !== index)
                  }))
                }
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
