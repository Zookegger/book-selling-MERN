import { RouterProvider } from "react-router-dom";
import "./App.css";
import router from "@components/common/Router";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "@contexts/AuthContext";

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px #dbf5ffc5 inset', // Change background color
            WebkitTextFillColor: '#000000', // Change text color
            caretColor: "#000",
          },
        },
      },
    },
  },
});

function App() {

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
