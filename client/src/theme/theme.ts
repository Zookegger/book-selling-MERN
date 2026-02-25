import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f3a93"
    },
    secondary: {
      main: "#f2b705"
    },
    background: {
      default: "#f6f4ef",
      paper: "#ffffff"
    }
  },
  typography: {
    fontFamily: "\"Space Grotesk\", \"IBM Plex Sans\", system-ui, sans-serif",
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.02em"
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.02em"
    }
  }
});

export default theme;
