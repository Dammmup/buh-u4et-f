import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import type { SubscriptionPlanPolicy } from "../../entities/user/model";
import { api, formatDateTime, formatMoney } from "../../shared/api/client";
import {
  defaultLandingPricing,
  defaultTaxRk,
  type LandingPricingSettings,
  type TaxRkSettings
} from "../../shared/catalog/defaults";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    amount: number;
    startedAt: string;
    expiresAt: string;
  } | null;
}

interface Props {
  onMessage: (message: string) => void;
  onError: (message: string) => void;
  savingId: string;
  setSavingId: (id: string) => void;
}

const taxFields: Array<{ key: keyof TaxRkSettings; label: string; step?: string }> = [
  { key: "year", label: "Год справочника" },
  { key: "mrp", label: "МРП" },
  { key: "mzp", label: "МЗП" },
  { key: "opvRate", label: "ОПВ работника", step: "0.001" },
  { key: "vosmsRate", label: "ВОСМС работника", step: "0.001" },
  { key: "oosmsRate", label: "ООСМС работодателя", step: "0.001" },
  { key: "socialContributionRate", label: "СО работодателя", step: "0.001" },
  { key: "socialTaxRate", label: "СН (ОУР)", step: "0.001" },
  { key: "opvrRate", label: "ОПВР", step: "0.001" },
  { key: "unifiedPaymentRate", label: "Единый платёж", step: "0.001" },
  { key: "simplifiedIpRate", label: "Упрощёнка ИП", step: "0.001" },
  { key: "simplifiedTooRate", label: "Упрощёнка ТОО", step: "0.001" },
  { key: "citRate", label: "КПН", step: "0.001" },
  { key: "pitRate", label: "ИПН 10%", step: "0.001" },
  { key: "highPitRate", label: "ИПН 15%", step: "0.001" },
  { key: "standardDeductionMrp", label: "Вычет ИПН (МРП)" },
  { key: "progressivePitThresholdMrp", label: "Порог ИПН 15% (МРП/год)" },
  { key: "simplifiedIncomeLimitMrp", label: "Лимит упрощёнки (МРП)" },
  { key: "dividendExemptionMrp", label: "Освобождение дивидендов (МРП)" },
  { key: "dividendPitRate", label: "ИПН с дивидендов", step: "0.001" },
  { key: "propertyTaxRate", label: "Имущественный налог", step: "0.001" },
  { key: "ipVosmsMzpFactor", label: "ВОСМС ИП (× МЗП)", step: "0.1" },
  { key: "ipSocialTaxMrp", label: "СН ИП (МРП)" }
];

function listToText(value: string[] | "*"): string {
  return value === "*" ? "*" : value.join(", ");
}

function textToList(value: string): string[] | "*" {
  const trimmed = value.trim();
  if (trimmed === "*") return "*";
  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminCatalogPanels({ onMessage, onError, savingId, setSavingId }: Props) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanPolicy[]>([]);
  const [tax, setTax] = useState<TaxRkSettings>(defaultTaxRk);
  const [landing, setLanding] = useState<LandingPricingSettings>(defaultLandingPricing);
  const [grantPlan, setGrantPlan] = useState<Record<string, string>>({});
  const [grantMonths, setGrantMonths] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, plansRes, taxRes, landingRes] = await Promise.all([
        api.get<{ users: ClientRow[] }>("/admin/users"),
        api.get<{ plans: SubscriptionPlanPolicy[] }>("/settings/plans"),
        api.get<{ settings: TaxRkSettings }>("/settings/tax"),
        api.get<{ settings: LandingPricingSettings }>("/settings/landing-pricing")
      ]);
      setClients(clientsRes.data.users);
      setPlans(plansRes.data.plans);
      setTax(taxRes.data.settings);
      setLanding(landingRes.data.settings);
    } catch {
      onError("Не удалось загрузить справочники и клиентов.");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const grant = async (userId: string) => {
    setSavingId(`grant-${userId}`);
    try {
      await api.post(`/admin/users/${userId}/subscription`, {
        plan: grantPlan[userId] || "starter",
        months: grantMonths[userId] || 1
      });
      onMessage("Тариф выдан клиенту.");
      await load();
    } catch {
      onError("Не удалось выдать тариф.");
    } finally {
      setSavingId("");
    }
  };

  const revoke = async (userId: string) => {
    setSavingId(`revoke-${userId}`);
    try {
      await api.post(`/admin/users/${userId}/subscription/revoke`);
      onMessage("Подписка отозвана.");
      await load();
    } catch {
      onError("Не удалось отозвать подписку.");
    } finally {
      setSavingId("");
    }
  };

  const savePlan = async (plan: SubscriptionPlanPolicy) => {
    setSavingId(`plan-${plan.plan}`);
    try {
      const response = await api.put<{ plan: SubscriptionPlanPolicy }>(`/settings/plans/${plan.plan}`, {
        title: plan.title,
        description: plan.description,
        amount: plan.amount,
        features: plan.features,
        limits: plan.limits
      });
      setPlans((current) => current.map((item) => (item.plan === plan.plan ? response.data.plan : item)));
      onMessage(`Тариф «${plan.title}» сохранён.`);
    } catch {
      onError("Не удалось сохранить тариф.");
    } finally {
      setSavingId("");
    }
  };

  const saveTax = async (reset = false) => {
    setSavingId("tax");
    try {
      const response = await api.put<{ settings: TaxRkSettings }>("/settings/tax", reset ? { reset: true } : tax);
      setTax(response.data.settings);
      onMessage(reset ? "Налоги сброшены к дефолту 2026." : "Налоговый справочник сохранён.");
    } catch {
      onError("Не удалось сохранить налоговый справочник.");
    } finally {
      setSavingId("");
    }
  };

  const saveLanding = async (reset = false) => {
    setSavingId("landing");
    try {
      const response = await api.put<{ settings: LandingPricingSettings }>(
        "/settings/landing-pricing",
        reset ? { reset: true } : landing
      );
      setLanding(response.data.settings);
      onMessage(reset ? "Лендинг-прайс сброшен." : "Лендинг-прайс сохранён.");
    } catch {
      onError("Не удалось сохранить лендинг-прайс.");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <Typography color="text.secondary">Загрузка справочников…</Typography>;
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="h6">Клиенты и доступ</Typography>
        {clients.length === 0 ? (
          <Alert severity="info">Клиентов пока нет.</Alert>
        ) : (
          clients.map((client) => (
            <Box key={client.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={800}>{client.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {client.email}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {client.subscription
                      ? `${client.subscription.plan} до ${formatDateTime(client.subscription.expiresAt)}`
                      : "Нет активного тарифа"}
                  </Typography>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                  <TextField
                    select
                    size="small"
                    label="Тариф"
                    value={grantPlan[client.id] || client.subscription?.plan || "starter"}
                    onChange={(event) =>
                      setGrantPlan((current) => ({ ...current, [client.id]: event.target.value }))
                    }
                    sx={{ minWidth: 160 }}
                  >
                    {plans.map((plan) => (
                      <MenuItem key={plan.plan} value={plan.plan}>
                        {plan.title}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    type="number"
                    label="Месяцев"
                    value={grantMonths[client.id] ?? 1}
                    onChange={(event) =>
                      setGrantMonths((current) => ({ ...current, [client.id]: Number(event.target.value) || 1 }))
                    }
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="contained"
                    disabled={savingId === `grant-${client.id}`}
                    onClick={() => grant(client.id)}
                  >
                    Выдать
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    disabled={!client.subscription || savingId === `revoke-${client.id}`}
                    onClick={() => revoke(client.id)}
                  >
                    Отозвать
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ))
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">Тарифы платформы</Typography>
        {plans.map((plan) => (
          <Box key={plan.plan} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Название"
                  value={plan.title}
                  onChange={(event) =>
                    setPlans((current) =>
                      current.map((item) => (item.plan === plan.plan ? { ...item, title: event.target.value } : item))
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Цена / мес"
                  type="number"
                  value={plan.amount}
                  onChange={(event) =>
                    setPlans((current) =>
                      current.map((item) =>
                        item.plan === plan.plan ? { ...item, amount: Number(event.target.value) || 0 } : item
                      )
                    )
                  }
                  sx={{ minWidth: 160 }}
                />
              </Stack>
              <TextField
                label="Описание"
                value={plan.description}
                onChange={(event) =>
                  setPlans((current) =>
                    current.map((item) =>
                      item.plan === plan.plan ? { ...item, description: event.target.value } : item
                    )
                  )
                }
                fullWidth
                multiline
              />
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
                {(
                  [
                    ["calculationsPerMonth", "Расчёты / мес"],
                    ["ordersPerMonth", "Заказы / мес"],
                    ["uploadFilesPerMonth", "Файлы / мес"],
                    ["uploadFilesPerOrder", "Файлы / заказ"],
                    ["maxFileSizeMb", "Макс. файл МБ"],
                    ["maxEmployees", "Макс. сотрудников"]
                  ] as const
                ).map(([key, label]) => (
                  <TextField
                    key={key}
                    label={label}
                    type="number"
                    value={plan.limits[key]}
                    onChange={(event) =>
                      setPlans((current) =>
                        current.map((item) =>
                          item.plan === plan.plan
                            ? {
                                ...item,
                                limits: { ...item.limits, [key]: Number(event.target.value) || 0 }
                              }
                            : item
                        )
                      )
                    }
                  />
                ))}
              </Box>
              <TextField
                label="Категории (через запятую или *)"
                value={listToText(plan.limits.allowedCategories)}
                onChange={(event) =>
                  setPlans((current) =>
                    current.map((item) =>
                      item.plan === plan.plan
                        ? {
                            ...item,
                            limits: { ...item.limits, allowedCategories: textToList(event.target.value) }
                          }
                        : item
                    )
                  )
                }
                fullWidth
              />
              <TextField
                label="Slug услуг (через запятую или *)"
                value={listToText(plan.limits.allowedServiceSlugs)}
                onChange={(event) =>
                  setPlans((current) =>
                    current.map((item) =>
                      item.plan === plan.plan
                        ? {
                            ...item,
                            limits: { ...item.limits, allowedServiceSlugs: textToList(event.target.value) }
                          }
                        : item
                    )
                  )
                }
                fullWidth
              />
              <TextField
                label="Особенности (по строке)"
                value={plan.features.join("\n")}
                onChange={(event) =>
                  setPlans((current) =>
                    current.map((item) =>
                      item.plan === plan.plan
                        ? {
                            ...item,
                            features: event.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                          }
                        : item
                    )
                  )
                }
                fullWidth
                multiline
                minRows={3}
              />
              <Button variant="contained" disabled={savingId === `plan-${plan.plan}`} onClick={() => savePlan(plan)}>
                Сохранить {plan.plan} · {formatMoney(plan.amount)}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Typography variant="h6">Налоги РК</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={savingId === "tax"} onClick={() => saveTax(true)}>
              Сброс 2026
            </Button>
            <Button variant="contained" disabled={savingId === "tax"} onClick={() => saveTax(false)}>
              Сохранить налоги
            </Button>
          </Stack>
        </Stack>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
          {taxFields.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              type="number"
              inputProps={{ step: field.step ?? "1" }}
              value={tax[field.key]}
              onChange={(event) =>
                setTax((current) => ({ ...current, [field.key]: Number(event.target.value) || 0 }))
              }
            />
          ))}
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Typography variant="h6">Лендинг: абонплата, срочность, ЭЦП</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={savingId === "landing"} onClick={() => saveLanding(true)}>
              Сброс
            </Button>
            <Button variant="contained" disabled={savingId === "landing"} onClick={() => saveLanding(false)}>
              Сохранить лендинг
            </Button>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Надбавка за срочность (доля)"
            type="number"
            inputProps={{ step: "0.01" }}
            value={landing.urgentSurchargeRate}
            onChange={(event) =>
              setLanding((current) => ({
                ...current,
                urgentSurchargeRate: Number(event.target.value) || 0
              }))
            }
          />
          <TextField
            label="Цена ЭЦП / сдача, ₸"
            type="number"
            value={landing.digitalSubmissionPrice}
            onChange={(event) =>
              setLanding((current) => ({
                ...current,
                digitalSubmissionPrice: Number(event.target.value) || 0
              }))
            }
          />
        </Stack>
        {(["ip", "too"] as const).map((form) => (
          <Box key={form}>
            <Typography fontWeight={800} mb={1}>
              {form.toUpperCase()}
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
              {(["simplified", "general"] as const).flatMap((regime) =>
                (["service", "trade", "production"] as const).map((activity) => (
                  <TextField
                    key={`${form}-${regime}-${activity}`}
                    label={`${regime}/${activity}`}
                    type="number"
                    value={landing.tariffRates[form][regime][activity]}
                    onChange={(event) =>
                      setLanding((current) => ({
                        ...current,
                        tariffRates: {
                          ...current.tariffRates,
                          [form]: {
                            ...current.tariffRates[form],
                            [regime]: {
                              ...current.tariffRates[form][regime],
                              [activity]: Number(event.target.value) || 0
                            }
                          }
                        }
                      }))
                    }
                  />
                ))
              )}
            </Box>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
