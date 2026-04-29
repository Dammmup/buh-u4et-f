import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { FormEvent, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/store/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("client@bukhuchet.kz");
  const [password, setPassword] = useState("Client12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      setError("Не удалось войти. Проверьте email и пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" bgcolor="background.default" display="flex" alignItems="center" py={4}>
      <Container maxWidth="lg">
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "0.9fr 1fr" }} gap={3} alignItems="stretch">
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, color: "white", background: "linear-gradient(135deg, #1E3A8A 0%, #172554 100%)" }}>
            <Stack spacing={3} height="100%" justifyContent="center">
              <Box display="flex" alignItems="center" gap={1.5}>
                <img src="/logo.svg" alt="Logo" style={{ width: 40, height: 40, filter: "brightness(0) invert(1)" }} />
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Bukhuchet.kz</Typography>
              </Box>
              <Chip label="Личный кабинет" sx={{ alignSelf: "flex-start", bgcolor: "rgba(255,255,255,0.16)", color: "white" }} />
              <Typography variant="h3">Бухгалтерия онлайн без лишних переписок</Typography>
              <Typography sx={{ color: "#DBEAFE", lineHeight: 1.7 }}>
                Заказы, расчеты, документы и статусы собраны в одном SaaS-кабинете.
              </Typography>
            </Stack>
          </Paper>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h4">Вход в кабинет</Typography>
                  <Typography color="text.secondary" mt={1}>
                    Управляйте заказами, документами и подпиской в одном месте.
                  </Typography>
                </Box>

              {error && <Alert severity="error">{error}</Alert>}

              <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Войти"}
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Нет аккаунта?{" "}
                <Link component={RouterLink} to="/register">
                  Зарегистрироваться
                </Link>
              </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
