import { Box, Button, Container, Typography } from "@mui/material";

const Home = () => {
  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ display: "grid", gap: 2, maxWidth: 640 }}>
        <Typography variant="h3">LuminaBooks</Typography>
        <Typography variant="body1">
          Discover your next favorite read with curated collections and quick
          delivery.
        </Typography>
        <Button variant="contained">Browse Catalog</Button>
      </Box>
    </Container>
  );
};

export default Home;
