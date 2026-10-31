import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus, UploadedDocument } from "../../entities/order/model";
import { api, formatDateTime, formatMoney, getApiErrorMessage, getApiErrorStatus } from "../../shared/api/client";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatusChip } from "../../shared/components/StatusChip";

const statusOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В работе" },
  { value: "need_info", label: "Нужна информация" },
  { value: "done", label: "Готовые" }
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [documentsByOrder, setDocumentsByOrder] = useState<Record<string, UploadedDocument[]>>({});
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  const loadOrders = useCallback(async () => {
    const response = await api.get<{ orders: Order[] }>("/orders");
    setOrders(response.data.orders);
  }, []);

  useEffect(() => {
    loadOrders()
      .catch(() => setError("Не удалось загрузить заказы."))
      .finally(() => setLoading(false));
  }, [loadOrders]);

  const filteredOrders = useMemo(
    () => (status === "all" ? orders : orders.filter((order) => order.status === status)),
    [orders, status]
  );

  const loadDocuments = async (orderId: string) => {
    setDocumentsLoading((current) => ({ ...current, [orderId]: true }));
    try {
      const response = await api.get<{ documents: UploadedDocument[] }>(`/uploads/orders/${orderId}`);
      setDocumentsByOrder((current) => ({ ...current, [orderId]: response.data.documents }));
    } catch {
      setError("Не удалось загрузить документы.");
    } finally {
      setDocumentsLoading((current) => ({ ...current, [orderId]: false }));
    }
  };

  const uploadFiles = async (orderId: string, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setMessage("");
    setError("");
    setDocumentsLoading((current) => ({ ...current, [orderId]: true }));
    try {
      const response = await api.post<{ documents: UploadedDocument[] }>(`/uploads/orders/${orderId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocumentsByOrder((current) => ({ ...current, [orderId]: response.data.documents }));
      setMessage("Документы загружены и привязаны к заказу.");
      event.target.value = "";
    } catch (uploadError) {
      const statusCode = getApiErrorStatus(uploadError);
      setError(
        statusCode === 402
          ? "Для загрузки документов нужна активная подписка."
          : statusCode === 403
            ? "Лимит загрузки документов по вашему тарифу исчерпан."
            : getApiErrorMessage(uploadError, "Не удалось загрузить документы.")
      );
    } finally {
      setDocumentsLoading((current) => ({ ...current, [orderId]: false }));
    }
  };

  const openDocument = async (item: UploadedDocument) => {
    setError("");
    setDownloadingId(item._id);
    try {
      // Documents are private, so the bytes come back over an authenticated request
      // rather than a public link.
      const response = await api.get<Blob>(`/uploads/documents/${item._id}`, {
        responseType: "blob"
      });

      const objectUrl = URL.createObjectURL(response.data);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = item.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (downloadError) {
      // The response body is a Blob here, so the server's JSON message is not readable.
      const statusCode = getApiErrorStatus(downloadError);
      setError(
        statusCode === 404
          ? "Документ не найден или больше недоступен."
          : statusCode === 403
            ? "Нет доступа к этому документу."
            : "Не удалось скачать документ."
      );
    } finally {
      setDownloadingId("");
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.calculation.total, 0);
  const activeOrders = orders.filter((order) => order.status !== "done").length;

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="Заказы"
        title="Мои заказы"
        description="История расчетов, статусы выполнения и документы по бухгалтерским услугам."
        metrics={[
          { label: "всего", value: orders.length },
          { label: "активных", value: activeOrders },
          { label: "сумма", value: formatMoney(totalAmount) }
        ]}
      />

      {loading && <LinearProgress />}
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && orders.length > 0 && (
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider" }}>
          <TextField
            select
            label="Статус"
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)}
            sx={{ minWidth: { xs: "100%", sm: 260 } }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Paper>
      )}

      {!loading && orders.length === 0 && (
        <EmptyState
          icon={<FolderOpenIcon />}
          title="Заказов пока нет"
          description="Выберите услугу и создайте первый заказ с детальным расчетом."
          actionLabel="Открыть услуги"
          actionTo="/services"
        />
      )}

      {!loading && orders.length > 0 && filteredOrders.length === 0 && (
        <EmptyState
          icon={<ReceiptLongIcon />}
          title="Нет заказов с таким статусом"
          description="Выберите другой статус в фильтре."
        />
      )}

      <Stack spacing={2}>
        {filteredOrders.map((order) => {
          const documents = documentsByOrder[order._id];
          const docsAreLoading = documentsLoading[order._id];

          return (
            <Accordion
              key={order._id}
              disableGutters
              elevation={0}
              onChange={(_event, expanded) => {
                if (expanded && !documents) {
                  loadDocuments(order._id);
                }
              }}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                "&:before": { display: "none" }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  width="100%"
                  pr={2}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{order.serviceSnapshot.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(order.createdAt)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <StatusChip status={order.status} />
                    <Chip label={formatMoney(order.calculation.total)} color="secondary" />
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 3 }} />
                <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "0.9fr 1.1fr" }} gap={3}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={900}>
                      Параметры
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                      {Object.keys(order.params ?? {}).length === 0 ? (
                        <Typography color="text.secondary">Без дополнительных параметров</Typography>
                      ) : (
                        <Stack spacing={1}>
                          {Object.entries(order.params ?? {}).map(([key, value]) => (
                            <Stack key={key} direction="row" justifyContent="space-between" gap={2}>
                              <Typography color="text.secondary">{key}</Typography>
                              <Typography fontWeight={800}>{String(value)}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Paper>

                    {order.comment && (
                      <Alert severity="info" icon={false}>
                        {order.comment}
                      </Alert>
                    )}

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={docsAreLoading}>
                        Загрузить файлы
                        <input
                          hidden
                          type="file"
                          multiple
                          onChange={(event) => uploadFiles(order._id, event)}
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                        />
                      </Button>
                      <Button
                        variant="text"
                        startIcon={docsAreLoading ? <CircularProgress size={18} /> : <AttachFileIcon />}
                        onClick={() => loadDocuments(order._id)}
                        disabled={docsAreLoading}
                      >
                        Обновить документы
                      </Button>
                    </Stack>

                    {docsAreLoading && <LinearProgress />}
                    {documents && (
                      <Stack spacing={1}>
                        {documents.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            Документы еще не загружены.
                          </Typography>
                        ) : (
                          documents.map((document) => (
                            <Paper
                              key={document._id}
                              elevation={0}
                              sx={{ p: 1.5, border: "1px solid", borderColor: "divider" }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <DescriptionIcon color="primary" />
                                <Box flex={1} minWidth={0}>
                                  <Link
                                    component="button"
                                    type="button"
                                    textAlign="left"
                                    disabled={downloadingId === document._id}
                                    onClick={() => openDocument(document)}
                                  >
                                    {document.originalName}
                                  </Link>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {(document.size / 1024).toFixed(1)} KB
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          ))
                        )}
                      </Stack>
                    )}
                  </Stack>

                  <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={900}>
                      Расчет
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Позиция</TableCell>
                          <TableCell align="right">Кол-во</TableCell>
                          <TableCell align="right">Сумма</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.calculation.breakdown.map((item) => (
                          <TableRow key={item.key}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={800}>
                                {item.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatMoney(item.unitPrice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={2}>
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
                        <Stack spacing={1.5}>
                          <Typography fontWeight={900}>{order.calculation.domain.label}</Typography>
                          {order.calculation.domain.warnings?.map((warning) => (
                            <Alert key={warning} severity="warning">
                              {warning}
                            </Alert>
                          ))}
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
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Stack>
  );
}
