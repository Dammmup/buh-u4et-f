import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArticleIcon from "@mui/icons-material/Article";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BarChartIcon from "@mui/icons-material/BarChart";
import BusinessIcon from "@mui/icons-material/Business";
import CalculateIcon from "@mui/icons-material/Calculate";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import GroupsIcon from "@mui/icons-material/Groups";
import MailIcon from "@mui/icons-material/Mail";
import MenuIcon from "@mui/icons-material/Menu";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RestoreIcon from "@mui/icons-material/Restore";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import SendIcon from "@mui/icons-material/Send";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Shield";
import StarIcon from "@mui/icons-material/Star";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  CircularProgress,
  Divider,
  FormControlLabel as MuiFormControlLabel,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { FormEvent, ReactNode, useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../../shared/api/client";

const navItems = [
  { label: "Что нужно", target: "services" },
  { label: "Актуально", target: "seasonal" },
  { label: "Калькулятор", target: "tax-calculator" },
  { label: "Тарифы", target: "pricing" },
  { label: "Прайс", target: "price-list" }
];

const brandName = "Bukhuchet.kz";
const contactPhoneDisplay = "+7 777 803 67 88";
const contactPhoneHref = "tel:+77778036788";
const whatsappHref = "https://wa.me/77778036788";
const contactEmail = "bukhuchet88@gmail.com";
const contactAddress = "Навои 323";
const phoneHelperText = "Введите казахстанский номер в формате +7 7XX XXX XX XX";

const normalizePhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }

  return digits;
};

const isValidPhone = (value: string) => /^77\d{9}$/.test(normalizePhoneDigits(value));

type TariffForm = "ip" | "too";
type TariffRegime = "simplified" | "general";
type TariffActivity = "service" | "trade" | "production";
type TaxMode = "ip_usn" | "ip_our" | "too_usn" | "too_our" | "reverse" | "unified";
type CalculationDirection = "direct" | "reverse";
type Residency = "citizen" | "foreigner";
type ServiceCalculatorKey = string;

const tariffOptions = {
  forms: [
    { value: "ip", label: "ИП" },
    { value: "too", label: "ТОО" }
  ],
  regimes: [
    { value: "simplified", label: "Упрощенный" },
    { value: "general", label: "Общеустановленный" }
  ],
  activities: [
    { value: "service", label: "Услуга" },
    { value: "trade", label: "Торговля" },
    { value: "production", label: "Производство" }
  ]
} as const;

const tariffRates: Record<TariffForm, Record<TariffRegime, Record<TariffActivity, number>>> = {
  ip: {
    simplified: { service: 50000, trade: 75000, production: 130000 },
    general: { service: 100000, trade: 140000, production: 170000 }
  },
  too: {
    simplified: { service: 75000, trade: 100000, production: 145000 },
    general: { service: 150000, trade: 200000, production: 230000 }
  }
};

const taxModes: { value: TaxMode; label: string }[] = [
  { value: "ip_usn", label: "ИП УСН" },
  { value: "ip_our", label: "ИП ОУР" },
  { value: "too_usn", label: "ТОО УСН" },
  { value: "too_our", label: "ТОО ОУР" },
  { value: "reverse", label: "Расчет от обратного" },
  { value: "unified", label: "Единый платеж" }
];

const monthOptions = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

const taxConstants = {
  mrp: 4325,
  mzp: 85000,
  opvRate: 0.1,
  vosmsRate: 0.02,
  oosmsRate: 0.03,
  socialContributionRate: 0.05,
  socialTaxRate: 0.06,
  opvrRate: 0.035,
  unifiedPaymentRate: 0.248,
  simplifiedIpRate: 0.04,
  simplifiedTooRate: 0.03,
  citRate: 0.2,
  pitRate: 0.1,
  highPitRate: 0.15
};

const taxLimits = {
  opvMax: taxConstants.mzp * 50 * taxConstants.opvRate,
  vosmsMax: taxConstants.mzp * 20 * taxConstants.vosmsRate,
  oosmsMax: taxConstants.mzp * 40 * taxConstants.oosmsRate,
  socialContributionMin: taxConstants.mzp * taxConstants.socialContributionRate,
  socialContributionMax: taxConstants.mzp * 7 * taxConstants.socialContributionRate,
  opvrMin: taxConstants.mzp * taxConstants.opvrRate,
  opvrMax: taxConstants.mzp * 50 * taxConstants.opvrRate,
  standardDeduction: taxConstants.mrp * 30,
  monthlyProgressivePitThreshold: (taxConstants.mrp * 8500) / 12
};

const serviceCalculatorOptions: any[] = [];

const serviceCards = [
  {
    icon: <ArticleIcon />,
    title: "Сдать отчетность",
    description: "Формы 910, 300, 328, 200 и другие отчеты без лишних разборов для клиента.",
    action: "Подобрать форму"
  },
  {
    icon: <GroupsIcon />,
    title: "Рассчитать зарплату",
    description: "Зарплата, кадровые документы, Enbek.kz и справки по сотрудникам.",
    action: "Рассчитать"
  },
  {
    icon: <ReceiptLongIcon />,
    title: "Оформить ЭСФ / СНТ / АВР",
    description: "Электронные документы, позиции, корректировки и регистрация на портале.",
    action: "Посчитать позиции"
  },
  {
    icon: <BusinessIcon />,
    title: "Открыть или закрыть бизнес",
    description: "Регистрация ИП/ТОО, смена режима, ОКЭД и приостановление отчетности.",
    action: "Выбрать услугу"
  },
  {
    icon: <AccountBalanceIcon />,
    title: "Вести учет каждый месяц",
    description: "Аутсорс бухгалтерии для ИП и ТОО с отчетностью и сопровождением.",
    action: "Подобрать тариф"
  },
  {
    icon: <RestoreIcon />,
    title: "Восстановить учет",
    description: "Если отчетность или документы накопились, поможем привести все в порядок.",
    action: "Оставить заявку"
  }
];

const frequentServices = [
  {
    title: "Форма 910",
    description: "Упрощенная декларация для ИП",
    price: "от 7 000 тг",
    tag: "часто"
  },
  {
    title: "Форма 300",
    description: "Отчетность по НДС/ЭСФ",
    price: "от 30 000 тг",
    tag: "отчетность"
  },
  {
    title: "Форма 328",
    description: "Импорт/экспорт по ЕАЭС, до 10 строк",
    price: "от 20 000 тг",
    tag: "расчет"
  },
  {
    title: "Расчет зарплаты",
    description: "По системе оплаты труда заказчика",
    price: "от 24 000 тг",
    tag: "кадры"
  },
  {
    title: "ЭСФ / СНТ",
    description: "Позиции и электронные документы",
    price: "от 5 000 тг",
    tag: "документы"
  },
  {
    title: "Регистрация ИП",
    description: "Базовое оформление",
    price: "от 5 000 тг",
    tag: "старт"
  }
];

const seasonalGroups = [
  {
    label: "Сейчас актуально",
    title: "Проверить ближайшие отчеты",
    description: "Бухгалтер уточнит вашу форму, период и дедлайн, чтобы не пропустить срок.",
    items: ["Форма 910", "Форма 300", "Расчет дохода по ОФД", "Зарплата и кадровые документы"]
  },
  {
    label: "Ежемесячно",
    title: "Операционная бухгалтерия",
    description: "То, что предприниматели чаще всего делают каждый месяц.",
    items: ["Зарплата", "ЭСФ", "СНТ", "АВР", "Первичные документы"]
  },
  {
    label: "Ежеквартально",
    title: "Квартальная отчетность",
    description: "Подходит для ИП и ТОО, которым нужно закрыть отчетный период.",
    items: ["Форма 910", "Форма 300", "Форма 200", "Комплексная бухуслуга"]
  },
  {
    label: "Годовой период",
    title: "Закрытие года",
    description: "Годовые отчеты, учетная политика и сверка документов.",
    items: ["Форма 700/701", "Форма 328", "Налоговая учетная политика", "Восстановление учета"]
  }
];

const stats = [
  { icon: <AccountBalanceIcon />, value: "7+", label: "лет опыта", description: "Работаем с 2019 года" },
  { icon: <GroupsIcon />, value: "100+", label: "клиентов", description: "Доверяют нам свой учет" },
  {
    icon: <TrendingDownIcon />,
    value: "до 70%",
    label: "экономии",
    description: "По сравнению со штатным бухгалтером"
  },
  { icon: <SecurityIcon />, value: "0", label: "налоговых рисков", description: "Снижаем риск штрафов" }
];

const priceList = [
  {
    icon: <ArticleIcon />,
    title: "Отчет в налоговые органы",
    items: [
      { name: "Любая форма «нулевка»", price: "5 000 тг" },
      { name: "Форма 300 по данным портала ИС ЭСФ", price: "30 000 тг" },
      { name: "Плюс за каждого работника", price: "1 500 тг" },
      { name: "Форма 910 без работников", price: "7 000 тг" },
      { name: "Форма 200 с 1 работником", price: "7 000 тг" },
      { name: "Плюс расчет дохода по ОФД и выпискам", price: "10 000 тг" },
      { name: "Комплексная бухгалтерская услуга", price: "50 000 тг" },
      { name: "Форма 328 (импорт/экспорт по ЕАЭС; до 10 строк)", price: "20 000 тг" },
      { name: "Форма 700 (земля, имущество, транспорт)", price: "15 000 тг" },
      { name: "Форма 701", price: "15 000 тг" },
      { name: "Дополнительная строка для формы 328", price: "1 000 тг" }
    ]
  },
  {
    icon: <ReceiptLongIcon />,
    title: "ЭСФ, СНТ, АВР",
    items: [
      { name: "Регистрация на портале ИС ЭСФ", price: "5 000 тг" },
      { name: "ЭСФ плюс за каждые 5 позиций", price: "3 000 тг" },
      { name: "СНТ плюс за каждые 5 позиций", price: "3 000 тг" },
      { name: "Выписка ЭСФ (разово; до 10 строк)", price: "от 17 000 тг" },
      { name: "Выписка первичного СНТ по импорту (до 10 строк)", price: "от 30 000 тг" },
      { name: "АВР бумажный, электронный 1-10 позиций", price: "5 000 тг" }
    ]
  },
  {
    icon: <BusinessIcon />,
    title: "Лицензия на алкоголь",
    items: [
      { name: "Получение", price: "60 000 тг" },
      { name: "Закрытие", price: "10 000 тг" }
    ]
  },
  {
    icon: <CalculateIcon />,
    title: "Регистрация и изменения",
    items: [
      {
        name: "Регистрация ТОО: устав на русском и казахском, решение учредителя, приказ о назначении, справка о госрегистрации",
        price: "от 84 000 тг"
      },
      { name: "Регистрация ИП + первичная консультация", price: "от 24 000 тг" },
      { name: "Смена ОКЭД", price: "от 12 000 тг" },
      { name: "Ответ на уведомление", price: "от 17 000 тг" },
      { name: "Постановка на НДС", price: "от 12 000 тг" },
      { name: "Переброска налогов", price: "от 12 000 тг" },
      { name: "Смена налогового режима", price: "от 12 000 тг" },
      { name: "Заявление на приостановление", price: "от 12 000 тг" },
      { name: "Разработка налоговой учетной политики", price: "25 000 тг" },
      { name: "Ликвидация ИП", price: "20 000 тг" }
    ]
  },
  {
    icon: <GroupsIcon />,
    title: "Кадровый учет",
    items: [
      { name: "Оформление изменения штатного расписания", price: "10 000 тг" },
      { name: "Разработка должностной инструкции", price: "20 000 тг" },
      { name: "Изменение должностной инструкции", price: "10 000 тг" },
      { name: "Расчет заработной платы по системе оплаты труда заказчика", price: "5 000 тг" },
      { name: "Ввод данных в систему Enbek.kz", price: "4 000 тг" },
      { name: "Разработка шаблона трудового договора", price: "20 000 тг" },
      { name: "Изменение шаблона трудового договора", price: "10 000 тг" },
      { name: "Оформление изменения размера заработной платы", price: "5 000 тг" },
      { name: "Расчет в сокращенные сроки", price: "4 000 тг" },
      { name: "Формирование справки о доходах", price: "2 000 тг" },
      { name: "Формирование справки о доходах в банк", price: "5 000 тг" },
      { name: "Справка о доходах за два года для расчета пособий", price: "10 000 тг" }
    ]
  },
  {
    icon: <BarChartIcon />,
    title: "Статистическая отчетность",
    items: [
      { name: "Формирование и сдача статистической отчетности по электронным каналам", price: "15 000 тг" },
      { name: "Формирование и сдача нулевой отчетности", price: "5 000 тг" },
      { name: "Постановка на учет ККМ: ReKassa, налоговая, настройка приложения", price: "10 000 тг" }
    ]
  }
];

const pricing = [
  {
    name: "Старт",
    price: "от 50 000",
    description: "Для ИП на упрощенном режиме, до 3 штатных работников",
    features: ["Ведение учета ИП", "До 50 операций в месяц", "До 3 штатных работников", "Налоговая отчетность", "Консультации"]
  },
  {
    name: "Бизнес",
    price: "от 100 000",
    description: "Для ТОО и ИП с регулярными операциями, до 3 штатных работников",
    highlighted: true,
    features: [
      "Полное ведение учета ТОО",
      "До 200 операций в месяц",
      "Отчетность и платежи",
      "Кадровый учет до 3 штатных работников",
      "Приоритетная поддержка",
      "Персональный менеджер"
    ]
  },
  {
    name: "Главный бухгалтер",
    price: "от 150 000",
    description: "Для общего режима, торговли, производства и сложных участков",
    features: [
      "Безлимитное количество операций",
      "До 3 штатных работников в базовой цене",
      "Финансовый анализ",
      "Налоговая оптимизация",
      "Выделенный бухгалтер",
      "Выезд на встречи"
    ]
  }
];

const workflow = [
  {
    icon: <QuestionAnswerIcon />,
    number: "01",
    title: "Заявка",
    description: "Вы оставляете заявку или регистрируетесь в кабинете. Мы быстро уточняем задачу."
  },
  {
    icon: <SearchIcon />,
    number: "02",
    title: "Анализ",
    description: "Проверяем объем документов, параметры услуги и рассчитываем стоимость."
  },
  {
    icon: <SettingsIcon />,
    number: "03",
    title: "Настройка",
    description: "Подключаем подписку, создаем заказ и собираем необходимые файлы."
  },
  {
    icon: <TrendingUpIcon />,
    number: "04",
    title: "Ведение учета",
    description: "Бухгалтер берет заказ в работу, а клиент отслеживает статус онлайн."
  }
];

const reviews = [
  {
    name: "Алексей Иванов",
    position: 'Директор, ТОО "СтройМонтаж"',
    text: "Теперь просто отправляю документы и получаю готовые отчеты. Экономия времени колоссальная."
  },
  {
    name: "Мария Петрова",
    position: "ИП, интернет-магазин",
    text: "Никаких штрафов, все отчеты вовремя, а я спокойно занимаюсь продажами."
  },
  {
    name: "Дмитрий Сергеев",
    position: 'Учредитель, ТОО "ТехноПро"',
    text: "Восстановили учет за два года и теперь ведут бухгалтерию на постоянной основе."
  }
];

const faq = [
  {
    question: "Как быстро можно начать работу?",
    answer: "После регистрации и подключения подписки можно создать заказ сразу. Обычно первичная обработка начинается в течение 1-3 рабочих дней."
  },
  {
    question: "Что входит в стоимость услуг?",
    answer: "Стоимость складывается из базовой цены услуги и параметров: сотрудников, строк, товарных позиций или дополнительных приложений."
  },
  {
    question: "Как передавать документы?",
    answer: "Документы загружаются в личном кабинете и автоматически привязываются к конкретному заказу."
  },
  {
    question: "Как контролировать работу бухгалтера?",
    answer: "В кабинете видны статусы заказов, расчеты, комментарии и история загруженных документов."
  }
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function formatTariff(value: number) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0
  }).format(value);
}

function parseAmount(value: string) {
  const numberValue = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0;
}

function roundMoney(value: number) {
  return Math.round(Math.max(0, value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function progressivePit(taxableIncome: number) {
  const threshold = taxLimits.monthlyProgressivePitThreshold;
  const basePart = Math.min(taxableIncome, threshold) * taxConstants.pitRate;
  const highPart = Math.max(0, taxableIncome - threshold) * taxConstants.highPitRate;
  return basePart + highPart;
}

function SectionTitle({ title, subtitle, light = false }: { title: string; subtitle: string; light?: boolean }) {
  return (
    <Stack spacing={2} alignItems="center" textAlign="center" mb={{ xs: 5, md: 8 }}>
      <Typography variant="h3" color={light ? "white" : "text.primary"} sx={{ fontSize: { xs: 30, md: 40 } }}>
        {title}
      </Typography>
      <Typography color={light ? "primary.light" : "text.secondary"} sx={{ maxWidth: 720, fontSize: 18 }}>
        {subtitle}
      </Typography>
    </Stack>
  );
}

function IconTile({ children, color = "primary" }: { children: ReactNode; color?: "primary" | "secondary" }) {
  return (
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 3,
        bgcolor: color === "primary" ? "primary.light" : "secondary.light",
        color: color === "primary" ? "primary.main" : "secondary.main",
        display: "grid",
        placeItems: "center",
        "& svg": { fontSize: 29 }
      }}
    >
      {children}
    </Box>
  );
}

function TariffCalculator() {
  const [form, setForm] = useState<TariffForm>("ip");
  const [regime, setRegime] = useState<TariffRegime>("simplified");
  const [activity, setActivity] = useState<TariffActivity>("service");

  const monthly = tariffRates[form][regime][activity];
  const yearly = monthly * 10;

  return (
    <Card sx={{ mb: 4, overflow: "hidden", borderColor: "primary.main" }}>
      <Box sx={{ p: { xs: 3, md: 4 }, background: "var(--grad-brand)", color: "white" }}>
        <Stack spacing={1}>
          <Typography variant="h4" color="white">
            Подбор тарифа
          </Typography>
          <Typography sx={{ color: "var(--gold)", maxWidth: 780 }}>
            Выберите форму собственности, режим налогообложения и вид деятельности. Базовая стоимость включает до 3 штатных работников.
          </Typography>
        </Stack>
      </Box>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1.15fr 0.85fr" }} gap={4} alignItems="stretch">
          <Stack spacing={3}>
            <TariffToggle
              title="Форма собственности"
              value={form}
              options={tariffOptions.forms}
              onChange={(value) => setForm(value as TariffForm)}
            />
            <TariffToggle
              title="Режим налогообложения"
              value={regime}
              options={tariffOptions.regimes}
              onChange={(value) => setRegime(value as TariffRegime)}
            />
            <TariffToggle
              title="Вид деятельности"
              value={activity}
              options={tariffOptions.activities}
              onChange={(value) => setActivity(value as TariffActivity)}
            />
          </Stack>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, bgcolor: "background.default", border: "1px solid #E5E7EB" }}>
            <Stack spacing={2.5}>
              <Chip label="До 3 штатных работников включено" color="secondary" sx={{ alignSelf: "flex-start" }} />
              <Box>
                <Typography color="text.secondary" mb={0.5}>
                  Стоимость в месяц
                </Typography>
                <Typography variant="h3" color="secondary.dark">
                  {formatTariff(monthly)}
                </Typography>
              </Box>
              <Divider />
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography color="text.secondary">Стоимость за год</Typography>
                <Typography fontWeight={900} color="secondary.dark">
                  {formatTariff(yearly)}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Расчет предварительный. Если штат больше 3 работников или есть НДС, ВЭД, акциз, имущество, транспорт или земля, стоимость уточняется после консультации.
              </Typography>
              <Button variant="contained" onClick={() => scrollToSection("contact")}>
                Получить точный расчет
              </Button>
            </Stack>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
}

function TariffToggle<T extends string>({
  title,
  value,
  options,
  onChange
}: {
  title: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Stack spacing={1.25}>
      <Typography variant="h6">{title}</Typography>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(_event, nextValue: T | null) => {
          if (nextValue) {
            onChange(nextValue);
          }
        }}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: `repeat(${options.length}, 1fr)` },
          gap: 1,
          "& .MuiToggleButtonGroup-grouped": {
            m: "0 !important",
            border: "1px solid #E5E7EB !important",
            borderRadius: "8px !important"
          }
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value} color="primary" sx={{ minHeight: 48, fontWeight: 800 }}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

function ClientNeedsSection() {
  return (
    <Box id="services" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
      <Container maxWidth="xl">
        <SectionTitle
          title="Что вам нужно сейчас?"
          subtitle="Выберите понятный сценарий. Форму, сроки и точный состав работ уточнит бухгалтер."
        />
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
          {serviceCards.map((service) => (
            <Card key={service.title} sx={{ transition: "0.2s", "&:hover": { borderColor: "primary.main", transform: "translateY(-4px)" } }}>
              <CardContent sx={{ p: 4, height: "100%" }}>
                <Stack spacing={2.5} height="100%">
                  <IconTile>{service.icon}</IconTile>
                  <Typography variant="h5">{service.title}</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7, flex: 1 }}>
                    {service.description}
                  </Typography>
                  <Button variant="outlined" onClick={() => scrollToSection("tax-calculator")} sx={{ alignSelf: "flex-start" }}>
                    {service.action}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function SeasonalServicesSection() {
  const currentMonth = new Intl.DateTimeFormat("ru-KZ", { month: "long" }).format(new Date());

  return (
    <Box id="seasonal" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default" }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3} mb={{ xs: 5, md: 7 }}>
          <Box>
            <Typography variant="h2" mb={2}>
              Актуально сейчас
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760, fontSize: 18 }}>
              В {currentMonth} чаще всего уточняют отчетность, зарплату и электронные документы. Показываем клиенту только основные сценарии, без перегруза налоговым календарем.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => scrollToSection("contact")} sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
            Спросить бухгалтера
          </Button>
        </Stack>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }} gap={3}>
          {seasonalGroups.map((group) => (
            <Card key={group.label} sx={{ borderColor: group.label === "Сейчас актуально" ? "secondary.main" : "#F3F4F6" }}>
              <CardContent sx={{ p: 3.5 }}>
                <Stack spacing={2.25}>
                  <Chip label={group.label} color={group.label === "Сейчас актуально" ? "secondary" : "primary"} sx={{ alignSelf: "flex-start" }} />
                  <Typography variant="h5">{group.title}</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {group.description}
                  </Typography>
                  <Stack spacing={1}>
                    {group.items.map((item) => (
                      <Stack key={item} direction="row" spacing={1.25} alignItems="center">
                        <CheckIcon color="primary" fontSize="small" />
                        <Typography color="text.secondary">{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function FrequentServicesSection() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
      <Container maxWidth="xl">
        <SectionTitle
          title="Часто заказывают"
          subtitle="Самые частые услуги вынесены отдельно, чтобы клиенту не приходилось искать их в полном прайсе."
        />
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
          {frequentServices.map((service) => (
            <Card key={service.title} sx={{ "&:hover": { borderColor: "secondary.main" } }}>
              <CardContent sx={{ p: 3.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Typography variant="h5">{service.title}</Typography>
                    <Chip label={service.tag} size="small" color="primary" variant="outlined" />
                  </Stack>
                  <Typography color="text.secondary">{service.description}</Typography>
                  <Typography variant="h5" color="secondary.dark">
                    {service.price}
                  </Typography>
                  <Button variant="outlined" onClick={() => scrollToSection("tax-calculator")}>
                    Рассчитать
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

interface ServiceCostCalculatorProps {
  dbServices: any[];
  loading: boolean;
}

function ServiceCostCalculator({ dbServices, loading }: ServiceCostCalculatorProps) {
  const calculatorSlugs = [
    "forma-328-dynamic",
    "hr-payroll-once",
    "forma-300-esf",
    "forma-200-employees",
    "document-issue",
    "registration-ip",
    "registration-too",
    "tax-reporting-suspension-ip",
    "tax-accounting-policy"
  ];

  const displayCalculatorOptions = dbServices.length > 0
    ? calculatorSlugs
        .map((slug) => dbServices.find((s) => s.slug === slug))
        .filter(Boolean)
        .map((s: any) => {
          const numParam = s.parameters?.find((p: any) => p.inputType === "number");
          const rule = s.pricing?.rules?.find((r: any) => r.parameterKey === numParam?.key);
          
          let title = s.name;
          if (s.slug === "document-issue") title = "ЭСФ / СНТ / АВР";
          
          return {
            key: s.slug,
            title: title,
            description: s.description,
            basePrice: s.pricing?.basePrice ?? 0,
            parameterLabel: numParam?.label,
            parameterName: numParam?.key,
            unitPrice: rule?.unitPrice ?? rule?.amount ?? 0,
            includedUnits: rule?.includedQuantity ?? 0,
            unitStep: rule?.blockSize ?? 1,
            unitSuffix: numParam?.unit ?? ""
          };
        })
    : [];

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [quantity, setQuantity] = useState("0");
  const [urgent, setUrgent] = useState(false);
  const [withDigitalSubmission, setWithDigitalSubmission] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (displayCalculatorOptions.length > 0 && !selectedKey) {
      setSelectedKey(displayCalculatorOptions[0].key);
    }
  }, [displayCalculatorOptions, selectedKey]);

  if (loading || displayCalculatorOptions.length === 0 || !selectedKey) {
    return (
      <Box id="tax-calculator" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default", display: "grid", placeItems: "center" }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  const selectedService =
    displayCalculatorOptions.find((service) => service.key === selectedKey) ?? displayCalculatorOptions[0];
  const rawQuantity = selectedService.parameterName ? parseAmount(quantity) : 0;
  const chargeableUnits = selectedService.parameterName
    ? Math.max(0, rawQuantity - (selectedService.includedUnits ?? 0))
    : 0;
  const pricedUnits = selectedService.unitStep
    ? Math.ceil(chargeableUnits / selectedService.unitStep)
    : chargeableUnits;
  const parameterPrice = roundMoney(pricedUnits * (selectedService.unitPrice ?? 0));
  const digitalSubmissionPrice = withDigitalSubmission ? 0 : 0;
  const subtotal = selectedService.basePrice + parameterPrice + digitalSubmissionPrice;
  const urgentPrice = urgent ? roundMoney(subtotal * 0.5) : 0;
  const total = subtotal + urgentPrice;
  const phoneIsValid = isValidPhone(phone);
  const showPhoneError = phone.trim().length > 0 && !phoneIsValid;
  const canSubmit = name.trim().length >= 2 && phoneIsValid;

  const calculationLines = [
    `Услуга: ${selectedService.title}`,
    `Базовая цена: ${formatTariff(selectedService.basePrice)}`,
    selectedService.parameterName
      ? `${selectedService.parameterLabel}: ${rawQuantity} ${selectedService.unitSuffix ?? ""}`
      : null,
    parameterPrice > 0 ? `Доп. объем: ${formatTariff(parameterPrice)}` : null,
    urgent ? `Срочность: ${formatTariff(urgentPrice)}` : null,
    `Сдача с ЭЦП: ${withDigitalSubmission ? "да" : "нет"}`,
    `Итого: ${formatTariff(total)}`
  ].filter(Boolean);

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(phoneHelperText);
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await api.post("/leads", {
        source: "service_calculator",
        name,
        phone: normalizePhoneDigits(phone),
        services: [selectedService.title],
        message: calculationLines.join("\n"),
        calculation: {
          serviceKey: selectedService.key,
          serviceTitle: selectedService.title,
          basePrice: selectedService.basePrice,
          quantity: rawQuantity,
          parameterPrice,
          urgent,
          urgentPrice,
          withDigitalSubmission,
          total
        }
      });
      setSubmitted(true);
      setName("");
      setPhone("");
      window.setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setError("Не удалось отправить расчет. Попробуйте позже или напишите нам в WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box id="tax-calculator" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default" }}>
      <Container maxWidth="xl">
        <SectionTitle
          title="Рассчитайте стоимость услуги"
          subtitle="Выберите нужную бухгалтерскую услугу и параметры. Клиент видит ориентировочную стоимость, а заявка уходит специалисту."
        />

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 0.48fr" }} gap={3} alignItems="stretch">
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
              <ToggleButtonGroup
                exclusive
                value={selectedKey}
                onChange={(_event, nextValue: string | null) => {
                  if (nextValue) {
                    setSelectedKey(nextValue);
                    setQuantity("0");
                  }
                }}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                  gap: 1,
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "1px solid #D1D5DB !important",
                    borderRadius: "8px !important",
                    justifyContent: "flex-start",
                    minHeight: 54,
                    px: 2
                  }
                }}
              >
                {displayCalculatorOptions.map((service) => (
                  <ToggleButton key={service.key} value={service.key}>
                    {service.title}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h4">{selectedService.title}</Typography>
                  <Typography color="text.secondary">{selectedService.description}</Typography>
                </Box>

                <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: selectedService.parameterName ? "1fr 1fr" : "1fr" }} gap={2}>
                  <TextField label="Базовая цена" value={formatTariff(selectedService.basePrice)} disabled />
                  {selectedService.parameterName && (
                    <TextField
                      label={selectedService.parameterLabel}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      type="number"
                      helperText={
                        selectedService.includedUnits
                          ? `В базовую цену входит до ${selectedService.includedUnits} ${selectedService.unitSuffix ?? ""}`
                          : "Дополнительный объем считается по прайсу"
                      }
                    />
                  )}
                </Box>

                <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2}>
                  <MuiFormControlLabel
                    control={<Checkbox checked={urgent} onChange={(event) => setUrgent(event.target.checked)} />}
                    label="Срочный расчет +50%"
                  />
                  <MuiFormControlLabel
                    control={
                      <Checkbox
                        checked={withDigitalSubmission}
                        onChange={(event) => setWithDigitalSubmission(event.target.checked)}
                      />
                    }
                    label="Нужна сдача/оформление с ЭЦП"
                  />
                </Box>

                <Alert severity="info">
                  Итог является ориентировочным. Бухгалтер уточнит стоимость после проверки документов, периода и объема работ.
                </Alert>

                <Box component="form" onSubmit={submitRequest} display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr auto" }} gap={2}>
                  <TextField label="Ваше имя" value={name} onChange={(event) => setName(event.target.value)} required />
                  <TextField
                    label="Телефон"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    placeholder="+7 7XX XXX XX XX"
                    error={showPhoneError}
                    helperText={showPhoneError ? phoneHelperText : " "}
                  />
                  <Button type="submit" variant="contained" disabled={!canSubmit || submitting} sx={{ minHeight: 56 }}>
                    {submitting ? <CircularProgress size={22} color="inherit" /> : "Отправить"}
                  </Button>
                </Box>

                {submitted && <Alert severity="success">Расчет отправлен. Специалист свяжется с вами.</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ alignSelf: "flex-start", position: { lg: "sticky" }, top: { lg: 88 } }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={2.5}>
                <Chip label="Ориентировочная стоимость" color="secondary" sx={{ alignSelf: "flex-start" }} />
                <Box>
                  <Typography color="text.secondary">Итого к оплате</Typography>
                  <Typography variant="h3" color="secondary.dark">
                    {formatTariff(total)}
                  </Typography>
                </Box>

                <Divider />

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" gap={2}>
                    <Typography color="text.secondary">Базовая цена</Typography>
                    <Typography fontWeight={900}>{formatTariff(selectedService.basePrice)}</Typography>
                  </Stack>
                  {selectedService.parameterName && (
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Typography color="text.secondary">Доп. объем</Typography>
                      <Typography fontWeight={900}>{formatTariff(parameterPrice)}</Typography>
                    </Stack>
                  )}
                  {urgent && (
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Typography color="text.secondary">Срочность</Typography>
                      <Typography fontWeight={900}>{formatTariff(urgentPrice)}</Typography>
                    </Stack>
                  )}
                </Stack>

                <Divider />

                <Typography variant="body2" color="text.secondary">
                  При отправке заявки в Telegram уйдет выбранная услуга, параметры расчета, итоговая сумма, имя и телефон клиента.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}

interface TaxBreakdownItem {
  label: string;
  amount: number;
  hint?: string;
}

interface TaxCalculationResult {
  businessIncome: number;
  expenses: number;
  taxableBusinessBase: number;
  breakdown: TaxBreakdownItem[];
  total: number;
  net: number;
  warnings: string[];
}

function TaxCalculator() {
  const [mode, setMode] = useState<TaxMode>("ip_our");
  const [direction, setDirection] = useState<CalculationDirection>("direct");
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("Май");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [salary, setSalary] = useState("");
  const [gphAmount, setGphAmount] = useState("");
  const [includeBusinessTax, setIncludeBusinessTax] = useState(true);
  const [includeStaffEmployee, setIncludeStaffEmployee] = useState(false);
  const [includeGphEmployee, setIncludeGphEmployee] = useState(false);
  const [changedThisMonth, setChangedThisMonth] = useState(false);
  const [residency, setResidency] = useState<Residency>("citizen");
  const [taxResident, setTaxResident] = useState(true);
  const [eaecCitizen, setEaecCitizen] = useState(false);
  const [pensioner, setPensioner] = useState(false);
  const [oppvRecipient, setOppvRecipient] = useState(false);
  const [student, setStudent] = useState(false);

  const effectiveMode: TaxMode = mode === "reverse" ? "ip_our" : mode;
  const entityType = effectiveMode.startsWith("too") ? "too" : "ip";
  const businessRegime = effectiveMode.endsWith("usn") ? "usn" : "our";
  const isUnified = mode === "unified";
  const isReverse = mode === "reverse" || direction === "reverse";

  const buildCalculation = (businessIncome: number) => {
    const expenseAmount = parseAmount(expenses);
    const salaryAmount = parseAmount(salary);
    const gphGross = parseAmount(gphAmount);
    const breakdown: TaxBreakdownItem[] = [];
    const warnings: string[] = [];
    const add = (label: string, amount: number, hint?: string) => {
      if (amount > 0) {
        breakdown.push({ label, amount: roundMoney(amount), hint });
      }
    };

    const taxableBusinessBase =
      businessRegime === "our" ? Math.max(0, businessIncome - expenseAmount) : businessIncome;

    let businessTax = 0;
    if (includeBusinessTax && businessIncome > 0 && !isUnified) {
      if (businessRegime === "usn") {
        const rate = entityType === "ip" ? taxConstants.simplifiedIpRate : taxConstants.simplifiedTooRate;
        businessTax = taxableBusinessBase * rate;
        add(entityType === "ip" ? "Налог ИП по УСН" : "Налог ТОО по УСН", businessTax, `${rate * 100}% от дохода`);
      } else if (entityType === "ip") {
        businessTax = progressivePit(taxableBusinessBase);
        add("ИПН ИП на ОУР", businessTax, "10-15% от прибыли");
      } else {
        businessTax = taxableBusinessBase * taxConstants.citRate;
        add("КПН ТОО", businessTax, "20% от прибыли");
      }
    }

    if (includeBusinessTax && entityType === "ip" && businessIncome > 0 && !isUnified) {
      const opv = pensioner ? 0 : Math.min(businessIncome * taxConstants.opvRate, taxLimits.opvMax);
      const socialContribution = pensioner
        ? 0
        : clamp((Math.max(taxConstants.mzp, businessIncome) - Math.min(opv, taxConstants.mzp * taxConstants.opvRate)) * taxConstants.socialContributionRate, taxLimits.socialContributionMin, taxLimits.socialContributionMax);
      const vosms = pensioner ? 0 : taxConstants.mzp * 1.4 * 0.05;
      const opvr = pensioner ? 0 : taxLimits.opvrMin;
      const socialTax = taxConstants.mrp * 2;

      add("ОПВ за ИП", opv, "10%, максимум 425 000 тг");
      add("СО за ИП", socialContribution, "5% с учетом лимитов");
      add("ВОСМС за ИП", vosms, "5% от 1.4 МЗП");
      add("ОПВР за ИП", opvr, "3.5% от 1 МЗП");
      add("Социальный налог за ИП", socialTax, "2 МРП");
    }

    if (includeStaffEmployee && salaryAmount > 0) {
      const payroll = calculateEmployeePayroll(salaryAmount, {
        entityType,
        pensioner,
        student,
        nonResident: residency === "foreigner" && !taxResident,
        useUnifiedPayment: isUnified
      });

      add("ОПВ работника", payroll.opv, "удерживается с зарплаты");
      add("ВОСМС работника", payroll.vosms, "удерживается с зарплаты");
      add("ИПН работника", payroll.pit, "удерживается с зарплаты");
      add("СО работодателя", payroll.socialContribution);
      add(entityType === "ip" ? "СН за работника ИП" : "СН работодателя", payroll.socialTax);
      add("ООСМС работодателя", payroll.oosms);
      add("ОПВР работодателя", payroll.opvr);
    }

    if (includeGphEmployee && gphGross > 0) {
      const gph = calculateGph(gphGross, residency === "foreigner" && !taxResident, pensioner || student);
      add("ОПВ по ГПХ", gph.opv);
      add("ВОСМС по ГПХ", gph.vosms);
      add("ИПН по ГПХ", gph.pit);
    }

    if (isUnified) {
      const unifiedBase = salaryAmount || businessIncome;
      add("Единый платеж", unifiedBase * taxConstants.unifiedPaymentRate, "24.8% от базы");
    }

    if (changedThisMonth) {
      warnings.push("Если работник принят или уволен в этом месяце, расчет нужно сверить по фактическим дням и начислениям.");
    }
    if (oppvRecipient) {
      warnings.push("Для получателей ОППВ могут применяться отдельные правила. Сверьте расчет с бухгалтером.");
    }
    if (student) {
      warnings.push("Для студентов льготы зависят от статуса и документов. Калькулятор применяет упрощенное освобождение по пенсионным/медицинским платежам.");
    }
    if (residency === "foreigner" && !eaecCitizen) {
      warnings.push("Для иностранцев не из ЕАЭС часть взносов может отличаться. Проверьте договор и статус резидентства.");
    }

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const net = Math.max(0, businessIncome - total);

    return {
      businessIncome,
      expenses: expenseAmount,
      taxableBusinessBase,
      breakdown,
      total,
      net,
      warnings
    };
  };

  const directIncome = parseAmount(income);
  const resolvedIncome = isReverse ? resolveReverseIncome(directIncome, buildCalculation) : directIncome;
  const result = buildCalculation(resolvedIncome);
  const hasInput = directIncome > 0 || parseAmount(salary) > 0 || parseAmount(gphAmount) > 0;

  return (
    <Box id="tax-calculator" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default" }}>
      <Container maxWidth="xl">
        <SectionTitle
          title="Налоговый калькулятор 2026"
          subtitle="Предварительный расчет налогов и взносов для ИП и ТОО по основным режимам"
        />

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 0.52fr" }} gap={3} alignItems="stretch">
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={(_event, nextMode: TaxMode | null) => {
                  if (nextMode) {
                    setMode(nextMode);
                    setDirection(nextMode === "reverse" ? "reverse" : "direct");
                  }
                }}
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "999px !important", border: "1px solid #D1D5DB !important", px: 2.2 } }}
              >
                {taxModes.map((item) => (
                  <ToggleButton key={item.value} value={item.value}>
                    {item.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={3}>
                <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1.15fr 0.75fr 0.9fr 0.65fr 0.8fr" }} gap={1.5}>
                  <TextField select label="Тип расчета" value={direction} onChange={(event) => setDirection(event.target.value as CalculationDirection)}>
                    <MenuItem value="direct">Прямой расчет</MenuItem>
                    <MenuItem value="reverse">Расчет от обратного</MenuItem>
                  </TextField>
                  <TextField label="Форма" value={entityType === "ip" ? "ИП" : "ТОО"} disabled />
                  <TextField label="Режим" value={businessRegime === "usn" ? "УСН" : "ОУР"} disabled />
                  <TextField select label="Год" value={year} onChange={(event) => setYear(event.target.value)}>
                    <MenuItem value="2026">2026</MenuItem>
                  </TextField>
                  <TextField select label="Месяц" value={month} onChange={(event) => setMonth(event.target.value)}>
                    {monthOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Divider />

                <CalculatorSection title="Расчет">
                  <MuiFormControlLabel
                    control={<Checkbox checked={includeBusinessTax} onChange={(event) => setIncludeBusinessTax(event.target.checked)} />}
                    label={entityType === "ip" ? "Налоги за ИП" : "Налоги за ТОО"}
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={includeStaffEmployee} onChange={(event) => setIncludeStaffEmployee(event.target.checked)} />}
                    label="За работника в штате"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={includeGphEmployee} onChange={(event) => setIncludeGphEmployee(event.target.checked)} />}
                    label="За работника на ГПХ"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={changedThisMonth} onChange={(event) => setChangedThisMonth(event.target.checked)} />}
                    label="Нанят или уволен в этом месяце"
                  />
                </CalculatorSection>

                <Divider />

                <CalculatorSection title="Доход">
                  <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: businessRegime === "our" ? "1fr 1fr" : "1fr" }} gap={1.5} width="100%">
                    <TextField
                      label={isReverse ? "Сумма после налогов" : "База расчета"}
                      placeholder="Введите сумму..."
                      value={income}
                      onChange={(event) => setIncome(event.target.value)}
                      type="number"
                    />
                    {businessRegime === "our" && !isUnified && (
                      <TextField
                        label="Расходы"
                        placeholder="Введите расходы..."
                        value={expenses}
                        onChange={(event) => setExpenses(event.target.value)}
                        type="number"
                      />
                    )}
                  </Box>
                </CalculatorSection>

                {(includeStaffEmployee || includeGphEmployee) && (
                  <>
                    <Divider />
                    <CalculatorSection title="Работники">
                      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={1.5} width="100%">
                        {includeStaffEmployee && (
                          <TextField label="Зарплата штатного работника" value={salary} onChange={(event) => setSalary(event.target.value)} type="number" />
                        )}
                        {includeGphEmployee && (
                          <TextField label="Сумма договора ГПХ" value={gphAmount} onChange={(event) => setGphAmount(event.target.value)} type="number" />
                        )}
                      </Box>
                    </CalculatorSection>
                  </>
                )}

                <Divider />

                <CalculatorSection title="Резидентство">
                  <MuiFormControlLabel
                    control={<Checkbox checked={residency === "citizen"} onChange={() => setResidency("citizen")} />}
                    label="Гражданин РК"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={residency === "foreigner"} onChange={() => setResidency("foreigner")} />}
                    label="Иностранец"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={taxResident} onChange={(event) => setTaxResident(event.target.checked)} />}
                    label="Налоговый резидент РК"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={eaecCitizen} onChange={(event) => setEaecCitizen(event.target.checked)} />}
                    label="Гражданин ЕАЭС"
                  />
                </CalculatorSection>

                <Divider />

                <CalculatorSection title="Социальные статусы">
                  <MuiFormControlLabel
                    control={<Checkbox checked={pensioner} onChange={(event) => setPensioner(event.target.checked)} />}
                    label="Пенсионер"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={oppvRecipient} onChange={(event) => setOppvRecipient(event.target.checked)} />}
                    label="Получатель ОППВ"
                  />
                  <MuiFormControlLabel
                    control={<Checkbox checked={student} onChange={(event) => setStudent(event.target.checked)} />}
                    label="Студент"
                  />
                </CalculatorSection>
              </Stack>
            </CardContent>
          </Card>

          <TaxResultPanel hasInput={hasInput} result={result} isReverse={isReverse} />
        </Box>
      </Container>
    </Box>
  );
}

function CalculatorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "220px 1fr" }} gap={{ xs: 1.5, md: 3 }} alignItems="flex-start">
      <Typography variant="h6">{title}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={1.5}>
        {children}
      </Stack>
    </Box>
  );
}

function TaxResultPanel({
  hasInput,
  result,
  isReverse
}: {
  hasInput: boolean;
  result: TaxCalculationResult;
  isReverse: boolean;
}) {
  if (!hasInput) {
    return (
      <Card sx={{ minHeight: 520, display: "grid", placeItems: "center", textAlign: "center" }}>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <CalculateIcon sx={{ fontSize: 72, color: "text.secondary" }} />
            <Typography variant="h5" color="text.secondary">
              Укажите параметры для получения результата
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ position: { lg: "sticky" }, top: { lg: 88 }, alignSelf: "flex-start" }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography color="text.secondary">К перечислению</Typography>
            <Typography variant="h3" color="secondary.dark">
              {formatTariff(result.total)}
            </Typography>
          </Box>

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography color="text.secondary">{isReverse ? "Расчетная база" : "Доход"}</Typography>
              <Typography fontWeight={900}>{formatTariff(result.businessIncome)}</Typography>
            </Stack>
            {result.expenses > 0 && (
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography color="text.secondary">Расходы</Typography>
                <Typography fontWeight={900}>{formatTariff(result.expenses)}</Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography color="text.secondary">После налогов</Typography>
              <Typography fontWeight={900} color="secondary.dark">
                {formatTariff(result.net)}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1.25}>
            {result.breakdown.map((item: TaxBreakdownItem) => (
              <Stack key={`${item.label}-${item.amount}`} direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                <Box>
                  <Typography fontWeight={800}>{item.label}</Typography>
                  {item.hint && (
                    <Typography variant="caption" color="text.secondary">
                      {item.hint}
                    </Typography>
                  )}
                </Box>
                <Typography fontWeight={900} color="secondary.dark" sx={{ whiteSpace: "nowrap" }}>
                  {formatTariff(item.amount)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {result.warnings.length > 0 && (
            <Alert severity="warning">
              <Stack spacing={0.75}>
                {result.warnings.map((warning: string) => (
                  <Typography key={warning} variant="body2">
                    {warning}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          <Alert severity="info">
            Расчет справочный. Перед сдачей отчетности бухгалтер сверяет ставки, лимиты, льготы и статус налогоплательщика.
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}

function calculateEmployeePayroll(
  grossSalary: number,
  options: {
    entityType: "ip" | "too";
    pensioner: boolean;
    student: boolean;
    nonResident: boolean;
    useUnifiedPayment: boolean;
  }
) {
  if (options.useUnifiedPayment) {
    return {
      opv: 0,
      vosms: 0,
      pit: 0,
      socialContribution: 0,
      socialTax: 0,
      oosms: 0,
      opvr: 0
    };
  }

  const exemptSocial = options.pensioner || options.student;
  const opv = exemptSocial ? 0 : Math.min(grossSalary * taxConstants.opvRate, taxLimits.opvMax);
  const vosms = exemptSocial ? 0 : Math.min(grossSalary * taxConstants.vosmsRate, taxLimits.vosmsMax);
  const taxableIncome = Math.max(0, grossSalary - opv - vosms - taxLimits.standardDeduction);
  const pit = options.nonResident ? Math.max(0, grossSalary - opv - vosms) * taxConstants.highPitRate : progressivePit(taxableIncome);
  const socialContributionBase = Math.max(0, grossSalary - opv);
  const socialContribution = exemptSocial
    ? 0
    : clamp(socialContributionBase * taxConstants.socialContributionRate, taxLimits.socialContributionMin, taxLimits.socialContributionMax);
  const oosms = exemptSocial ? 0 : Math.min(grossSalary * taxConstants.oosmsRate, taxLimits.oosmsMax);
  const opvr = exemptSocial ? 0 : clamp(grossSalary * taxConstants.opvrRate, taxLimits.opvrMin, taxLimits.opvrMax);
  const socialTax =
    options.entityType === "ip"
      ? taxConstants.mrp
      : Math.max(0, (grossSalary - opv - vosms) * taxConstants.socialTaxRate - socialContribution);

  return {
    opv,
    vosms,
    pit,
    socialContribution,
    socialTax,
    oosms,
    opvr
  };
}

function calculateGph(grossAmount: number, nonResident: boolean, exemptSocial: boolean) {
  const opv = exemptSocial ? 0 : Math.min(grossAmount * taxConstants.opvRate, taxLimits.opvMax);
  const vosms = exemptSocial ? 0 : Math.min(grossAmount * taxConstants.vosmsRate, taxLimits.vosmsMax);
  const pitBase = Math.max(0, grossAmount - opv - vosms);
  const pit = nonResident ? pitBase * taxConstants.highPitRate : progressivePit(pitBase);

  return {
    opv,
    vosms,
    pit
  };
}

function resolveReverseIncome(
  targetNet: number,
  calculate: (businessIncome: number) => { total: number; net: number }
) {
  if (targetNet <= 0) {
    return 0;
  }

  let low = targetNet;
  let high = targetNet * 2 + 100000;

  for (let index = 0; index < 24; index += 1) {
    const result = calculate(high);
    if (result.net >= targetNet) {
      break;
    }
    high *= 1.6;
  }

  for (let index = 0; index < 42; index += 1) {
    const middle = (low + high) / 2;
    const result = calculate(middle);
    if (result.net >= targetNet) {
      high = middle;
    } else {
      low = middle;
    }
  }

  return roundMoney(high);
}

function LeadQuiz() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({
    businessType: "",
    employees: "",
    services: [] as string[],
    name: "",
    phone: ""
  });

  const toggleService = (service: string) => {
    setAnswers((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service]
    }));
  };

  const progress = (step / 5) * 100;
  const phoneIsValid = isValidPhone(answers.phone);
  const showPhoneError = answers.phone.trim().length > 0 && !phoneIsValid;
  const canContinue =
    (step === 1 && answers.businessType) ||
    (step === 2 && answers.employees) ||
    (step === 3 && answers.services.length > 0) ||
    (step === 4 && answers.name) ||
    (step === 5 && phoneIsValid);

  const submitQuiz = async () => {
    if (!phoneIsValid) {
      setError(phoneHelperText);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/leads", {
        source: "landing_quiz",
        name: answers.name,
        phone: normalizePhoneDigits(answers.phone),
        businessType: answers.businessType,
        employees: answers.employees,
        services: answers.services
      });
      setSubmitted(true);
    } catch {
      setError("Не удалось отправить заявку. Попробуйте еще раз или напишите нам в WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box id="quiz" component="section" sx={{ py: { xs: 8, md: 10 }, background: "linear-gradient(135deg, #2563EB 0%, #172554 100%)" }}>
        <Container maxWidth="md">
          <Card sx={{ textAlign: "center" }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Stack spacing={3} alignItems="center">
                <IconTile>
                  <SendIcon />
                </IconTile>
                <Typography variant="h4">Спасибо за вашу заявку!</Typography>
                <Typography color="text.secondary">
                  Специалист свяжется с вами и предложит подходящий формат сопровождения.
                </Typography>
                <Button onClick={() => setSubmitted(false)}>Начать заново</Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box id="quiz" component="section" sx={{ py: { xs: 8, md: 10 }, background: "linear-gradient(135deg, #2563EB 0%, #172554 100%)" }}>
      <Container maxWidth="md">
        <SectionTitle
          title="Подберем решение для вашего бизнеса"
          subtitle="Ответьте на 5 вопросов и получите индивидуальное предложение"
          light
        />
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <Stack spacing={4}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">Шаг {step} из 5</Typography>
                  <Typography color="primary" fontWeight={800}>
                    {Math.round(progress)}%
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 99 }} />
              </Box>

              {step === 1 && (
                <QuizOptions
                  title="Тип вашего бизнеса"
                  options={["ИП", "ТОО"]}
                  selected={[answers.businessType]}
                  onSelect={(value) => setAnswers((current) => ({ ...current, businessType: value }))}
                />
              )}
              {step === 2 && (
                <QuizOptions
                  title="Количество сотрудников"
                  options={["Без сотрудников", "1-5 человек", "6-20 человек", "Более 20 человек"]}
                  selected={[answers.employees]}
                  onSelect={(value) => setAnswers((current) => ({ ...current, employees: value }))}
                />
              )}
              {step === 3 && (
                <QuizOptions
                  title="Какие услуги вам нужны?"
                  options={[
                    "Бухгалтерское сопровождение",
                    "Кадровый учет",
                    "Налоговая отчетность",
                    "Восстановление учета",
                    "Первичная документация",
                    "Консультации"
                  ]}
                  selected={answers.services}
                  multi
                  onSelect={toggleService}
                />
              )}
              {step === 4 && (
                <Stack spacing={2}>
                  <Typography variant="h5">Как к вам обращаться?</Typography>
                  <TextField
                    placeholder="Ваше имя"
                    value={answers.name}
                    onChange={(event) => setAnswers((current) => ({ ...current, name: event.target.value }))}
                    fullWidth
                  />
                </Stack>
              )}
              {step === 5 && (
                <Stack spacing={2}>
                  <Typography variant="h5">Номер телефона</Typography>
                  <TextField
                    placeholder="+7 (___) ___-__-__"
                    value={answers.phone}
                    onChange={(event) => setAnswers((current) => ({ ...current, phone: event.target.value }))}
                    error={showPhoneError}
                    helperText={showPhoneError ? phoneHelperText : " "}
                    fullWidth
                  />
                </Stack>
              )}

              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction="row" justifyContent="space-between">
                {step > 1 ? <Button onClick={() => setStep((current) => current - 1)}>Назад</Button> : <Box />}
                {step < 5 ? (
                  <Button variant="contained" endIcon={<ArrowForwardIcon />} disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
                    Далее
                  </Button>
                ) : (
                  <Button color="secondary" variant="contained" disabled={!canContinue || submitting} onClick={submitQuiz}>
                    {submitting ? <CircularProgress size={22} color="inherit" /> : "Получить решение"}
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

function QuizOptions({
  title,
  options,
  selected,
  onSelect,
  multi = false
}: {
  title: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">{title}</Typography>
      {multi && <Typography color="text.secondary">Можно выбрать несколько вариантов</Typography>}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)" }} gap={2}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Button
              key={option}
              onClick={() => onSelect(option)}
              variant="outlined"
              startIcon={active ? <CheckIcon /> : undefined}
              sx={{
                justifyContent: "flex-start",
                minHeight: 64,
                borderWidth: 2,
                bgcolor: active ? "primary.light" : "white",
                borderColor: active ? "primary.main" : "#E5E7EB",
                color: "text.primary",
                "&:hover": { borderWidth: 2 }
              }}
            >
              {option}
            </Button>
          );
        })}
      </Box>
    </Stack>
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Бухгалтерское сопровождение":
      return <ArticleIcon />;
    case "Первичная документация":
      return <ReceiptLongIcon />;
    case "Проверка контрагентов":
      return <SecurityIcon />;
    case "Налоговая отчетность":
      return <CalculateIcon />;
    case "Электронный документооборот":
      return <ReceiptLongIcon />;
    case "Лицензирование":
      return <BusinessIcon />;
    case "Регистрация и изменения":
      return <CalculateIcon />;
    case "Кадровый учет":
      return <GroupsIcon />;
    case "Статистическая отчетность":
      return <BarChartIcon />;
    case "Кассовое оборудование":
      return <CalculateIcon />;
    default:
      return <ArticleIcon />;
  }
}

function formatServicePrice(service: any) {
  const basePrice = service.pricing?.basePrice ?? 0;
  const hasParams = service.parameters && service.parameters.length > 0;
  const hasRules = service.pricing?.rules && service.pricing.rules.length > 0;
  
  const formatted = new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0
  }).format(basePrice);

  if (hasParams || hasRules || service.slug.includes("once") || service.slug.includes("import")) {
    return `от ${formatted}`;
  }
  return formatted;
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    message: ""
  });
  const contactPhoneIsValid = isValidPhone(contactForm.phone);
  const showContactPhoneError = contactForm.phone.trim().length > 0 && !contactPhoneIsValid;

  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbServicesLoading, setDbServicesLoading] = useState(true);

  useEffect(() => {
    api.get("/services")
      .then((response) => {
        if (response.data?.services && response.data.services.length > 0) {
          setDbServices(response.data.services);
        }
      })
      .catch((error) => {
        console.error("Ошибка загрузки услуг с бэкенда, используем локальный список:", error);
      })
      .finally(() => {
        setDbServicesLoading(false);
      });
  }, []);

  const handleContact = async (event: FormEvent) => {
    event.preventDefault();
    if (!contactPhoneIsValid) {
      setContactError(phoneHelperText);
      return;
    }
    setContactSubmitting(true);
    setContactError("");
    try {
      await api.post("/leads", {
        source: "landing_contact",
        name: contactForm.name,
        phone: normalizePhoneDigits(contactForm.phone),
        message: contactForm.message
      });
      setContactSubmitted(true);
      setContactForm({ name: "", phone: "", message: "" });
      window.setTimeout(() => setContactSubmitted(false), 3000);
    } catch {
      setContactError("Не удалось отправить заявку. Попробуйте позже или напишите нам в WhatsApp.");
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleNav = (target: string) => {
    scrollToSection(target);
    setMobileMenuOpen(false);
  };

  const displayPriceList = dbServices.length > 0
    ? Object.keys(
        dbServices.reduce((acc: any, service: any) => {
          const cat = service.category || "Другие услуги";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(service);
          return acc;
        }, {})
      ).map((catName) => {
        const items = dbServices.filter((s) => s.category === catName);
        return {
          title: catName,
          icon: getCategoryIcon(catName),
          items: items.map((s) => ({
            name: s.name,
            price: formatServicePrice(s)
          }))
        };
      })
    : priceList;

  return (
    <Box id="top" bgcolor="white">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #E5E7EB" }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 64 }}>
            <Box
              onClick={() => scrollToSection("top")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                flex: { xs: 1, md: "initial" },
                mr: 5
              }}
            >
              <img src="/logo.svg" alt="Logo" style={{ width: 32, height: 32 }} />
              <Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>
                {brandName}
              </Typography>
            </Box>
            <Stack direction="row" spacing={4} sx={{ display: { xs: "none", md: "flex" }, flex: 1 }}>
              {navItems.map((item) => (
                <Button key={item.target} color="inherit" onClick={() => handleNav(item.target)}>
                  {item.label}
                </Button>
              ))}
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
              <Link href={contactPhoneHref} color="text.secondary" underline="none" display="flex" alignItems="center">
                <PhoneIcon sx={{ fontSize: 18, mr: 1 }} />
                {contactPhoneDisplay}
              </Link>
              <Button variant="contained" onClick={() => handleNav("contact")}>
                Консультация
              </Button>
              <Button component={RouterLink} to="/login" variant="outlined">
                Войти
              </Button>
            </Stack>
            <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setMobileMenuOpen((value) => !value)}>
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>
        </Container>
        {mobileMenuOpen && (
          <Box sx={{ display: { xs: "block", md: "none" }, bgcolor: "white", borderTop: "1px solid #E5E7EB" }}>
            <Container sx={{ py: 2 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2} px={1}>
                <img src="/logo.svg" alt="Logo" style={{ width: 32, height: 32 }} />
                <Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>
                  {brandName}
                </Typography>
              </Box>
              <Stack spacing={1}>
                {navItems.map((item) => (
                  <Button key={item.target} color="inherit" onClick={() => handleNav(item.target)} sx={{ justifyContent: "flex-start" }}>
                    {item.label}
                  </Button>
                ))}
                <Button variant="contained" onClick={() => handleNav("contact")}>
                  Консультация
                </Button>
                <Button component={RouterLink} to="/login" variant="outlined">
                  Войти
                </Button>
              </Stack>
            </Container>
          </Box>
        )}
      </AppBar>

      <Box
        component="section"
        sx={{
          overflow: "hidden",
          py: { xs: 8, md: 14 },
          background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 68%)"
        }}
      >
        <Container maxWidth="xl">
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 0.9fr" }} gap={{ xs: 6, md: 10 }} alignItems="center">
            <Stack spacing={4}>
              <Chip label="Для ИП и ТОО" color="primary" sx={{ alignSelf: "flex-start", bgcolor: "primary.light", color: "primary.main" }} />
              <Typography variant="h1" sx={{ fontSize: { xs: 38, md: 58 }, lineHeight: 1.05, maxWidth: 760 }}>
                Передайте бухгалтерию на аутсорс и сосредоточьтесь на бизнесе
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 18, lineHeight: 1.7, maxWidth: 700 }}>
                Полное ведение бухгалтерского и налогового учета с минимизацией рисков.
                Клиент оплачивает подписку, рассчитывает услуги и передает документы онлайн.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button component={RouterLink} to="/register" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                  Получить консультацию
                </Button>
                <Button
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="secondary"
                  variant="contained"
                  size="large"
                  startIcon={<WhatsAppIcon />}
                >
                  Написать в WhatsApp
                </Button>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={{ xs: 3, md: 5 }} pt={1}>
                {[
                  ["7+", "лет опыта"],
                  ["100+", "клиентов"],
                  ["до 70%", "экономии"]
                ].map(([value, label]) => (
                  <Box key={label}>
                    <Typography variant="h4" color="primary">
                      {value}
                    </Typography>
                    <Typography color="text.secondary">{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: "1px solid #F3F4F6", boxShadow: "0 25px 50px -12px rgba(17, 24, 39, 0.18)" }}>
              <Stack spacing={2.5}>
                {[
                  ["Защита от налоговых рисков", "Проверка каждой операции", "primary"],
                  ["Экономия времени", "Полный цикл учета", "secondary"],
                  ["Персональный бухгалтер", "Всегда на связи", "primary"]
                ].map(([title, subtitle, color]) => (
                  <Stack
                    key={title}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, bgcolor: color === "secondary" ? "#FFFBEB" : "#EFF6FF", borderRadius: 2 }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: color === "secondary" ? "secondary.main" : "primary.main",
                        color: "white"
                      }}
                    >
                      <CheckIcon />
                    </Box>
                    <Box>
                      <Typography fontWeight={800}>{title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
                <Divider />
                <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
                  {["Подписка", "Калькулятор", "Документы"].map((item) => (
                    <Box key={item} textAlign="center">
                      <Typography color="primary" fontWeight={900}>
                        ✓
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      <LeadQuiz />

      <ClientNeedsSection />

      <SeasonalServicesSection />

      <ServiceCostCalculator dbServices={dbServices} loading={dbServicesLoading} />

      <FrequentServicesSection />

      <Box component="section" sx={{ py: { xs: 8, md: 10 }, background: "var(--grad-brand)" }}>
        <Container maxWidth="xl">
          <SectionTitle title="Почему выбирают нас" subtitle="Цифры, которые говорят о надежности сервиса" light />
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={3}>
            {stats.map((stat) => (
              <Paper key={stat.label} elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                <Stack spacing={2} alignItems="center">
                  <Box sx={{ width: 64, height: 64, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.18)" }}>{stat.icon}</Box>
                  <Typography variant="h3">{stat.value}</Typography>
                  <Typography sx={{ color: "var(--gold)", fontSize: 20 }}>{stat.label}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                    {stat.description}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      <Box id="price-list" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
        <Container maxWidth="xl">
          <SectionTitle title="Прайс-лист услуг" subtitle="Прозрачные цены на все виды бухгалтерских услуг" />
          <Stack spacing={3}>
            {displayPriceList.map((category) => (
              <Card key={category.title} sx={{ overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(54, 57, 56, 0.1)", "&:hover": { borderColor: "primary.main" } }}>
                <Box sx={{ p: 3, background: "var(--grad-brand)", color: "white" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center" }}>
                      {category.icon}
                    </Box>
                    <Typography variant="h5" color="white">
                      {category.title}
                    </Typography>
                  </Stack>
                </Box>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={0.5}>
                    {category.items.map((item) => (
                      <Stack
                        key={`${category.title}-${item.name}`}
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "flex-start" }}
                        gap={1.5}
                        sx={{
                          px: 2,
                          py: 1.75,
                          borderBottom: "1px solid #F3F4F6",
                          borderRadius: 2,
                          transition: "0.15s",
                          "&:hover": { bgcolor: "background.default" },
                          "&:last-child": { borderBottom: 0 }
                        }}
                      >
                        <Typography color="text.secondary" sx={{ pr: { sm: 3 }, lineHeight: 1.55 }}>
                          {item.name}
                        </Typography>
                        <Typography color="secondary.dark" fontWeight={900} sx={{ whiteSpace: "nowrap" }}>
                          {item.price}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Paper elevation={0} sx={{ mt: 5, p: { xs: 4, md: 6 }, textAlign: "center", color: "white", background: "var(--grad-brand)" }}>
            <Typography variant="h4">Нужна консультация по ценам?</Typography>
            <Typography sx={{ color: "var(--gold)", mt: 2, mb: 3 }}>
              Свяжитесь с нами, и мы подберем оптимальное решение для вашего бизнеса.
            </Typography>
            <Button color="secondary" variant="contained" size="large" onClick={() => scrollToSection("contact")}>
              Получить консультацию
            </Button>
          </Paper>
        </Container>
      </Box>

      <Box id="pricing" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <SectionTitle title="Тарифы" subtitle="Выберите подходящий формат бухгалтерского сопровождения" />
          <TariffCalculator />
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "repeat(3, 1fr)" }} gap={3}>
            {pricing.map((plan) => (
              <Card key={plan.name} sx={{ position: "relative", overflow: "hidden", borderColor: plan.highlighted ? "primary.main" : "#F3F4F6", transform: { lg: plan.highlighted ? "scale(1.035)" : "none" } }}>
                {plan.highlighted && (
                  <Box sx={{ position: "absolute", top: 0, right: 0, px: 2, py: 0.5, bgcolor: "secondary.main", color: "white", fontWeight: 800 }}>
                    Популярный
                  </Box>
                )}
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h5">{plan.name}</Typography>
                      <Typography color="text.secondary" mt={1}>
                        {plan.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography component="span" variant="h3">
                        {plan.price}
                      </Typography>
                      <Typography component="span" color="text.secondary">
                        {" "}
                        ₸/мес
                      </Typography>
                    </Box>
                    <Stack spacing={1.5}>
                      {plan.features.map((feature) => (
                        <Stack key={feature} direction="row" spacing={1.5} alignItems="flex-start">
                          <CheckIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
                          <Typography color="text.secondary">{feature}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Button component={RouterLink} to="/register" variant={plan.highlighted ? "contained" : "outlined"}>
                      Выбрать тариф
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box id="how-it-works" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
        <Container maxWidth="xl">
          <SectionTitle title="Как мы работаем" subtitle="Простой процесс от заявки до полного ведения учета" />
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={3}>
            {workflow.map((step) => (
              <Card key={step.number} sx={{ "&:hover": { borderColor: "primary.main" } }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <IconTile>{step.icon}</IconTile>
                      <Typography variant="h2" color="primary.light">
                        {step.number}
                      </Typography>
                    </Stack>
                    <Typography variant="h5">{step.title}</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {step.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
          <Paper elevation={0} sx={{ mt: 6, p: { xs: 4, md: 6 }, textAlign: "center", bgcolor: "primary.light" }}>
            <Typography variant="h4">Начнем работу уже сегодня</Typography>
            <Typography color="text.secondary" mt={2} mb={3}>
              Зарегистрируйтесь, подключите подписку и создайте первый заказ в кабинете.
            </Typography>
            <Button component={RouterLink} to="/register" variant="contained" size="large">
              Открыть кабинет
            </Button>
          </Paper>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <SectionTitle title="Отзывы клиентов" subtitle="Нам доверяют предприниматели из разных сфер бизнеса" />
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} gap={3}>
            {reviews.map((review) => (
              <Card key={review.name}>
                <CardContent sx={{ p: 4, position: "relative" }}>
                  <FormatQuoteIcon sx={{ position: "absolute", top: 24, right: 24, color: "primary.light", fontSize: 48 }} />
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={0.5}>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <StarIcon key={item} color="secondary" fontSize="small" />
                      ))}
                    </Stack>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      "{review.text}"
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "primary.main", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>
                        {review.name.charAt(0)}
                      </Box>
                      <Box>
                        <Typography fontWeight={800}>{review.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {review.position}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box id="faq" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
        <Container maxWidth="md">
          <SectionTitle title="Частые вопросы" subtitle="Ответы на популярные вопросы о сервисе" />
          <Stack spacing={2}>
            {faq.map((item) => (
              <Accordion key={item.question} disableGutters elevation={0} sx={{ border: "2px solid #F3F4F6", borderRadius: "12px !important", overflow: "hidden", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />}>
                  <Typography fontWeight={800}>{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box id="contact" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <SectionTitle title="Свяжитесь с нами" subtitle="Оставьте заявку и получите бесплатную консультацию" />
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }} gap={4}>
            <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, color: "white", background: "var(--grad-brand)" }}>
              <Stack spacing={4}>
                <Typography variant="h4">Готовы начать сотрудничество?</Typography>
                {[
                  [<PhoneIcon />, "Телефон", contactPhoneDisplay],
                  [<MailIcon />, "Email", contactEmail],
                  [<PlaceIcon />, "Офис", contactAddress],
                  [<WhatsAppIcon />, "WhatsApp", contactPhoneDisplay]
                ].map(([icon, label, value]) => (
                  <Stack key={label as string} direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ mt: 0.3 }}>{icon as ReactNode}</Box>
                    <Box>
                      <Typography fontWeight={800}>{label}</Typography>
                      <Typography sx={{ color: "var(--gold)" }}>{value}</Typography>
                    </Box>
                  </Stack>
                ))}
                <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
                <Typography sx={{ color: "var(--gold)" }}>Пн-Пт: 9:00 - 18:00</Typography>
              </Stack>
            </Paper>

            <Card>
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                {contactSubmitted ? (
                  <Stack spacing={3} alignItems="center" textAlign="center" py={4}>
                    <IconTile>
                      <SendIcon />
                    </IconTile>
                    <Typography variant="h4">Спасибо за заявку!</Typography>
                    <Typography color="text.secondary">Мы свяжемся с вами в ближайшее время.</Typography>
                  </Stack>
                ) : (
                  <Stack component="form" spacing={2.5} onSubmit={handleContact}>
                    {contactError && <Alert severity="error">{contactError}</Alert>}
                    <TextField
                      label="Ваше имя"
                      placeholder="Иван Иванов"
                      value={contactForm.name}
                      onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Телефон"
                      placeholder="+7 (___) ___-__-__"
                      value={contactForm.phone}
                      onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                      error={showContactPhoneError}
                      helperText={showContactPhoneError ? phoneHelperText : " "}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Сообщение"
                      placeholder="Расскажите о вашем бизнесе..."
                      value={contactForm.message}
                      onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                      multiline
                      minRows={4}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" size="large" disabled={!contactPhoneIsValid || contactSubmitting}>
                      {contactSubmitting ? <CircularProgress size={22} color="inherit" /> : "Отправить заявку"}
                    </Button>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 6, bgcolor: "#111827", color: "white" }}>
        <Container maxWidth="xl">
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "2fr 1fr 1fr 1.5fr" }} gap={4}>
            <Box>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <img src="/logo.svg" alt="Logo" style={{ width: 32, height: 32 }} />
                <Typography variant="h6" color="primary.light">
                  {brandName}
                </Typography>
              </Box>
              <Typography sx={{ color: "#9CA3AF", maxWidth: 320 }}>
                Профессиональные бухгалтерские услуги для ИП и ТОО с онлайн-кабинетом.
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={800} mb={2}>
                Услуги
              </Typography>
              <Stack spacing={1} sx={{ color: "#9CA3AF" }}>
                <Typography>Бухгалтерское сопровождение</Typography>
                <Typography>Кадровый учет</Typography>
                <Typography>Налоговая отчетность</Typography>
              </Stack>
            </Box>
            <Box>
              <Typography fontWeight={800} mb={2}>
                Компания
              </Typography>
              <Stack spacing={1} sx={{ color: "#9CA3AF" }}>
                <Button color="inherit" onClick={() => scrollToSection("how-it-works")} sx={{ justifyContent: "flex-start", p: 0 }}>
                  Как мы работаем
                </Button>
                <Button color="inherit" onClick={() => scrollToSection("pricing")} sx={{ justifyContent: "flex-start", p: 0 }}>
                  Тарифы
                </Button>
                <Button color="inherit" onClick={() => scrollToSection("price-list")} sx={{ justifyContent: "flex-start", p: 0 }}>
                  Прайс
                </Button>
                <Button color="inherit" onClick={() => scrollToSection("faq")} sx={{ justifyContent: "flex-start", p: 0 }}>
                  FAQ
                </Button>
              </Stack>
            </Box>
            <Box>
              <Typography fontWeight={800} mb={2}>
                Контакты
              </Typography>
              <Stack spacing={1.5} sx={{ color: "#9CA3AF" }}>
                <Typography>{contactPhoneDisplay}</Typography>
                <Typography>{contactEmail}</Typography>
                <Typography>{contactAddress}</Typography>
              </Stack>
            </Box>
          </Box>
          <Divider sx={{ borderColor: "#1F2937", my: 4 }} />
          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
            © 2026 {brandName}. Все права защищены.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
