import { Box, Button, Container, TextField, Typography } from "@mui/material";

const Login = () => {
  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ display: "grid", gap: 2, maxWidth: 420 }}>
        <Typography variant="h4">Welcome back</Typography>
        <TextField label="Email" type="email" fullWidth />
        <TextField label="Password" type="password" fullWidth />
        <Button variant="contained">Sign in</Button>
      </Box>
    </Container>
  );
};

export default Login;
