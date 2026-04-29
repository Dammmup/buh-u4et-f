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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/store/AuthContext";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Регистрация не прошла. Возможно, email уже используется.");
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
              <Chip label="Для ИП и ТОО" sx={{ alignSelf: "flex-start", bgcolor: "rgba(255,255,255,0.16)", color: "white" }} />
              <Typography variant="h3">Начните работу с бухгалтером уже сегодня</Typography>
              <Typography sx={{ color: "#DBEAFE", lineHeight: 1.7 }}>
                Создайте аккаунт, подключите monthly-подписку и оформите первый заказ через калькулятор.
              </Typography>
            </Stack>
          </Paper>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h4">Создать аккаунт</Typography>
                  <Typography color="text.secondary" mt={1}>
                    После регистрации можно подключить подписку и оформить первый заказ.
                  </Typography>
                </Box>

              {error && <Alert severity="error">{error}</Alert>}

              <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                <TextField
                  label="Имя"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  fullWidth
                />
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
                  helperText="Минимум 8 символов"
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Зарегистрироваться"}
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Уже есть аккаунт?{" "}
                <Link component={RouterLink} to="/login">
                  Войти
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
