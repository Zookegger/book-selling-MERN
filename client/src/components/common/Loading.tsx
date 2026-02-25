import { Box, CircularProgress } from "@mui/material";

const Loading = () => {
  return (
    <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
};

export default Loading;
