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
    // validate
    if (!oldPassword || !newPassword || !confirmPassword) {
      return onSnack("Nhập đầy đủ thông tin", "error");
    }

    if (newPassword.length < 6) {
      return onSnack("Mật khẩu phải ≥ 6 ký tự", "error");
    }

    if (newPassword !== confirmPassword) {
      return onSnack("Mật khẩu không khớp", "error");
    }

    try {
      setLoading(true);

      // ✅ FIX CHUẨN DTO
      await userService.changePassword({
        currentPassword: oldPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      onSnack("Đổi mật khẩu thành công", "success");

      // reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      onSnack(err.message || "Đổi mật khẩu thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>
        Đổi mật khẩu
      </Typography>

      <Stack spacing={2} maxWidth={400}>
        <TextField
          label="Mật khẩu cũ"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          fullWidth
        />

        <TextField
          label="Mật khẩu mới"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
        />

        <TextField
          label="Xác nhận mật khẩu"
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
          {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </Button>
      </Stack>
    </Box>
  );
}