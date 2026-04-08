import { useState } from "react";
import { Box, TextField, Button, Stack, Typography } from "@mui/material";
import userService from "@services/user.services";

interface Props {
  onSnack: (msg: string, severity: "success" | "error") => void;
}

export default function ChangePasswordTab({ onSnack }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      return onSnack("Please fill out all fields.", "error");
    }

    if (newPassword.length < 6) {
      return onSnack("Password must be at least 6 characters.", "error");
    }

    if (newPassword !== confirmPassword) {
      return onSnack("Passwords do not match.", "error");
    }

    try {
      setLoading(true);

      // ✅ use correct DTO
      await userService.changePassword({
        currentPassword: oldPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      onSnack("Password changed successfully.", "success");

      // reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      onSnack(err.message || "Password change failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>
        Change Password
      </Typography>

      <Stack spacing={2} maxWidth={400}>
        <TextField
          label="Current password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          fullWidth
        />

        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
        />

        <TextField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
        >
          {loading ? "Processing..." : "Change Password"}
        </Button>
      </Stack>
    </Box>
  );
}