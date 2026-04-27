import { Box, Chip, Paper, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  metrics?: Array<{ label: string; value: string | number }>;
  sx?: SxProps<Theme>;
}

export function PageHeader({ eyebrow, title, description, actions, metrics = [], sx }: PageHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        ...(sx && !Array.isArray(sx) && typeof sx === "object" ? sx : {})
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
        <Stack spacing={1.5} maxWidth={760}>
          {eyebrow && (
            <Chip
              label={eyebrow}
              color="primary"
              variant="outlined"
              sx={{ alignSelf: "flex-start", bgcolor: "primary.light" }}
            />
          )}
          <Typography variant="h4">{title}</Typography>
          {description && (
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {description}
            </Typography>
          )}
        </Stack>

        {(actions || metrics.length > 0) && (
          <Stack spacing={2} alignItems={{ xs: "stretch", md: "flex-end" }} justifyContent="space-between">
            {actions}
            {metrics.length > 0 && (
              <Box display="grid" gridTemplateColumns={`repeat(${metrics.length}, minmax(96px, 1fr))`} gap={1.5}>
                {metrics.map((metric) => (
                  <Box
                    key={metric.label}
                    sx={{
                      px: 2,
                      py: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.default"
                    }}
                  >
                    <Typography variant="h6">{metric.value}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metric.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
