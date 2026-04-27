import { Chip } from "@mui/material";
import type { OrderStatus } from "../../entities/order/model";

const statusMap: Record<OrderStatus, { label: string; color: "default" | "primary" | "warning" | "success" }> = {
  new: { label: "Новый", color: "default" },
  in_progress: { label: "В работе", color: "primary" },
  need_info: { label: "Нужна информация", color: "warning" },
  done: { label: "Готово", color: "success" }
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const view = statusMap[status];
  return <Chip size="small" label={view.label} color={view.color} />;
}
