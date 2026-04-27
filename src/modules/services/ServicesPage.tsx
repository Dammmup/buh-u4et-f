import CalculateIcon from "@mui/icons-material/Calculate";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../app/store/AuthContext";
import type { AccountingService, PricingRuleType } from "../../entities/service/model";
import type { SubscriptionAccess } from "../../entities/user/model";
import { api, formatMoney } from "../../shared/api/client";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";

const ruleLabels: Record<PricingRuleType, string> = {
  per_unit: "за единицу",
  per_block: "за блок",
  fixed: "фиксировано",
  tiered: "ступени",
  percentage: "процент"
};

export function ServicesPage() {
  const [services, setServices] = useState<AccountingService[]>([]);
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ services: AccountingService[] }>("/services"),
      api.get<{ plan: SubscriptionAccess["plan"]; usage: SubscriptionAccess["usage"] }>("/subscriptions/access").catch(() => null)
    ])
      .then(([servicesResponse, accessResponse]) => {
        setServices(servicesResponse.data.services);
        setAccess(accessResponse ? { plan: accessResponse.data.plan, usage: accessResponse.data.usage } : null);
      })
      .catch(() => setError("Не удалось загрузить услуги."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category))).sort((a, b) => a.localeCompare(b)),
    [services]
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === "all" || service.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [service.name, service.description, service.category, service.slug]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, services]);

  const canUseService = (service: AccountingService) => {
    if (user?.role === "admin") return true;
    if (!access) return false;
    const { allowedServiceSlugs, allowedCategories } = access.plan.limits;
    return (
      allowedServiceSlugs === "*" ||
      allowedServiceSlugs.includes(service.slug) ||
      allowedCategories === "*" ||
      allowedCategories.includes(service.category)
    );
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="Каталог"
        title="Бухгалтерские услуги"
        description="Выберите услугу, заполните параметры и получите детальный расчет перед созданием заказа."
        metrics={[
          { label: "услуг", value: services.length },
          { label: "категорий", value: categories.length },
          { label: "валюта", value: "KZT" }
        ]}
      />

      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Поиск"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Категория"
              select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              sx={{ minWidth: { md: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TuneIcon color="action" />
                  </InputAdornment>
                )
              }}
            >
              <MenuItem value="all">Все категории</MenuItem>
              {categories.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !access && user?.role !== "admin" && (
        <Alert severity="warning">
          Подключите тариф в кабинете, чтобы рассчитывать услуги и создавать заказы.
        </Alert>
      )}

      {!loading && filteredServices.length === 0 && (
        <EmptyState
          icon={<FolderOpenIcon />}
          title="Услуги не найдены"
          description="Измените поиск или выберите другую категорию."
        />
      )}

      {!loading && filteredServices.length > 0 && (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={3}>
          {filteredServices.map((service) => (
            (() => {
              const allowed = canUseService(service);
              return (
            <Card
              key={service._id}
              sx={{
                transition: "border-color 0.2s, transform 0.2s",
                opacity: allowed ? 1 : 0.68,
                "&:hover": { borderColor: allowed ? "primary.main" : "divider", transform: allowed ? "translateY(-3px)" : "none" }
              }}
            >
              <CardContent sx={{ height: "100%", p: { xs: 3, md: 3.5 } }}>
                <Stack spacing={2.5} height="100%">
                  <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                    <Stack spacing={0.75}>
                      <Chip label={service.category} size="small" variant="outlined" sx={{ alignSelf: "flex-start" }} />
                      <Typography variant="h6">{service.name}</Typography>
                    </Stack>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={`от ${formatMoney(service.pricing.basePrice)}`} color="primary" />
                      {!allowed && <Chip label="недоступно" color="warning" size="small" />}
                    </Stack>
                  </Stack>

                  <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {service.description}
                  </Typography>

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {service.parameters.length === 0 ? (
                      <Chip label="фиксированная цена" size="small" variant="outlined" />
                    ) : (
                      service.parameters.map((parameter) => (
                        <Chip
                          key={parameter.key}
                          label={parameter.unit ? `${parameter.label}, ${parameter.unit}` : parameter.label}
                          size="small"
                          variant="outlined"
                        />
                      ))
                    )}
                  </Stack>

                  {service.pricing.rules.length > 0 && (
                    <Stack spacing={1}>
                      {service.pricing.rules.slice(0, 3).map((rule) => (
                        <Stack
                          key={rule.key}
                          direction="row"
                          justifyContent="space-between"
                          gap={2}
                          sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {rule.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} textAlign="right">
                            {rule.type === "fixed" && rule.amount !== undefined
                              ? formatMoney(rule.amount)
                              : rule.type === "percentage" && rule.rate !== undefined
                                ? `${rule.rate * 100}%`
                                : rule.type === "tiered"
                                  ? ruleLabels[rule.type]
                                  : formatMoney(rule.unitPrice ?? 0)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}

                  <Box flex={1} />
                  <Button
                    component={RouterLink}
                    to={allowed ? `/services/${service._id}/calculate` : "/dashboard"}
                    variant="contained"
                    startIcon={<CalculateIcon />}
                    color={allowed ? "primary" : "warning"}
                  >
                    {allowed ? "Открыть калькулятор" : "Выбрать тариф"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
              );
            })()
          ))}
        </Box>
      )}
    </Stack>
  );
}
