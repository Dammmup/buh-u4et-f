import { Button, Paper, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { Link as RouterLink } from "react-router-dom";

interface EmptyStateProps {
  icon: ReactElement;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, md: 6 },
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
        bgcolor: "background.paper"
      }}
    >
      <Stack spacing={2.5} alignItems="center">
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            bgcolor: "primary.light",
            color: "primary.main",
            "& svg": { fontSize: 32 }
          }}
        >
          {icon}
        </Stack>
        <Stack spacing={1} maxWidth={520}>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Stack>
        {actionLabel && actionTo && (
          <Button component={RouterLink} to={actionTo} variant="contained">
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
