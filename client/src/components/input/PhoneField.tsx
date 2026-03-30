import { COUNTRY_CODES } from "@constants/CountryCodes";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";
import { Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * Chuẩn hóa một phần của số điện thoại bằng cách loại bỏ khoảng trắng.
 *
 * Hàm này hữu ích khi người dùng nhập mã quốc gia có khoảng trắng
 * (ví dụ: `+84 ` hoặc `+1  `).
 *
 * @param value Chuỗi đầu vào cần chuẩn hóa.
 * @returns Chuỗi đã được bỏ toàn bộ khoảng trắng.
 *
 * @example
 * ```ts
 * normalizePhonePart("+84 "); // "+84"
 * normalizePhonePart(" +1 234 "); // "+1234"
 * ```
 */
export function normalizePhonePart(value: string) {
    return value.replace(/\s+/g, "");
}

/**
 * Tách số điện thoại đầy đủ thành `mã quốc gia` và `số nội địa`.
 *
 * Cách hoạt động:
 * 1. Chuẩn hóa chuỗi đầu vào (bỏ khoảng trắng).
 * 2. So khớp mã quốc gia dài nhất trong danh sách `COUNTRY_CODES`.
 * 3. Nếu không tìm thấy, dùng mặc định `+84`.
 *
 * @param fullPhone Số điện thoại đầy đủ, ví dụ `+84901123456`.
 * @returns Object gồm `code` và `local`.
 *
 * @example
 * ```ts
 * splitPhone("+84901123456");
 * // { code: "+84", local: "901123456" }
 *
 * splitPhone("+1 2025550123");
 * // { code: "+1", local: "2025550123" }
 * ```
 */
export function splitPhone(fullPhone: string) {
    const normalizedPhone = normalizePhonePart(fullPhone ?? "");
    const defaultCode = "+84";

    const bestMatch = COUNTRY_CODES.map((item) => normalizePhonePart(item.code))
        .sort((a, b) => b.length - a.length)
        .find((code) => normalizedPhone.startsWith(code));

    const code = bestMatch ?? defaultCode;
    return {
        code,
        local: normalizedPhone.startsWith(code)
            ? normalizedPhone.slice(code.length)
            : normalizedPhone,
    };
}

/**
 * Ghép mã quốc gia và số nội địa thành số điện thoại đầy đủ.
 *
 * Hàm sẽ:
 * - Chuẩn hóa `countryCode` bằng cách bỏ khoảng trắng.
 * - Chỉ giữ chữ số trong `localNumber`.
 *
 * @param countryCode Mã quốc gia, ví dụ `+84`.
 * @param localNumber Số nội địa, có thể chứa ký tự không phải số.
 * @returns Số điện thoại đầy đủ, ví dụ `+84901123456`.
 *
 * @example
 * ```ts
 * buildFullPhone("+84", "901-123-456"); // "+84901123456"
 * ```
 */
export function buildFullPhone(countryCode: string, localNumber: string) {
    return `${normalizePhonePart(countryCode)}${localNumber.replace(/\D/g, "").replace(/^0+/, "")}`;
}

/**
 * Giá trị chuẩn của PhoneField (controlled value).
 *
 * `fullNumber` giúp form cha gửi payload trực tiếp lên API,
 * còn `countryCode` và `localNumber` phục vụ hiển thị/validate.
 */
export interface PhoneValue {
    countryCode: string;
    localNumber: string;
    fullNumber: string;
}

// ─── PhoneField ──────────────────────────────────────────────────────────────

/**
 * Props cho PhoneField.
 *
 * Component này là controlled component:
 * - Nhận dữ liệu qua `value`.
 * - Trả dữ liệu mới qua `onChange`.
 *
 * Nhờ đó có thể tái sử dụng trong nhiều form khác nhau
 * (đăng ký, hồ sơ, checkout...) mà không phụ thuộc business logic cụ thể.
 */
export interface PhoneFieldProps {
    value: PhoneValue;
    onChange: (value: PhoneValue) => void;
    onBlur?: () => void;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
    codeLabel?: string;
    clearOnBlur?: boolean
    numberLabel?: string;
    countryOptions?: Array<{ name: string; code: string }>;
    size?: "small" | "medium";
    variant?: "outlined" | "filled" | "standard";
    localPlaceholder?: string;
    showIcon?: boolean;
    className?: string;
}

/**
 * Trường nhập số điện thoại có tách mã quốc gia + số nội địa.
 *
 * Cách hoạt động:
 * 1. `Autocomplete` chọn quốc gia và cập nhật `countryCode`.
 * 2. `TextField` số điện thoại chỉ giữ chữ số cho `localNumber`.
 * 3. Mỗi lần thay đổi sẽ phát sinh object mới qua `onChange`,
 *    bao gồm cả `fullNumber` đã chuẩn hóa để gửi API.
 *
 * @param props Xem chi tiết tại {@link PhoneFieldProps}.
 * @returns UI nhập số điện thoại có thể tái sử dụng.
 *
 * @example
 * ```tsx
 * import { useState } from "react";
 * import { PhoneField, type PhoneValue } from "@components/input/PhoneField";
 *
 * function RegisterPhone() {
 *   const [phone, setPhone] = useState<PhoneValue>({
 *     countryCode: "+84",
 *     localNumber: "",
 *     fullNumber: "+84",
 *   });
 *
 *   return (
 *     <PhoneField
 *       value={phone}
 *       onChange={setPhone}
 *       required
 *       error={phone.localNumber.length > 0 && phone.localNumber.length < 6}
 *       helperText={
 *         phone.localNumber.length > 0 && phone.localNumber.length < 6
 *           ? "Số điện thoại phải có ít nhất 6 chữ số"
 *           : undefined
 *       }
 *     />
 *   );
 * }
 * ```
 */
export function PhoneField({
    value,
    onChange,
    onBlur,
    error = false,
    helperText,
    disabled = false,
    required = false,
    label = "Phone",
    codeLabel = "Code",
    numberLabel = "Phone Number",
    countryOptions = COUNTRY_CODES,
    clearOnBlur = false,
    size = "small",
    variant = "filled",
    localPlaceholder = "901123456",
    showIcon = true,
    className,
}: PhoneFieldProps) {
    const normalizedCode = normalizePhonePart(value.countryCode || "");
    const localDigits = value.localNumber.replace(/\D/g, "");
    const [codeInputValue, setCodeInputValue] = useState(normalizedCode);

    useEffect(() => {
        setCodeInputValue(normalizedCode);
    }, [normalizedCode]);

    const selectedCountry = useMemo(
        () =>
            countryOptions.find(
                (item) => normalizePhonePart(item.code) === normalizedCode
            ) ?? null,
        [countryOptions, normalizedCode]
    );

    const sharedHelperText = helperText ?? " ";

    return (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }} className={className}>
            {showIcon && (
                <Box
                    sx={{
                        mt: 0.5,
                        color: "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    <Phone size={16} />
                </Box>
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        display: "block",
                    }}
                >
                    {label}
                </Typography>

                <Stack direction="row" gap={1} width="100%" sx={{ mt: 0.25 }} alignItems="flex-start">
                    <Autocomplete
                        options={countryOptions}
                        getOptionLabel={(option) => `${option.name} (${option.code})`}
                        value={selectedCountry}
                        disabled={disabled}
                        onChange={(_, newValue, reason) => {
                            if (reason === "clear") {
                                onChange({
                                    countryCode: "",
                                    localNumber: "",
                                    fullNumber: "",
                                });
                                return;
                            }
                            const nextCode = normalizePhonePart(newValue?.code ?? normalizedCode);
                            onChange({
                                countryCode: nextCode,
                                localNumber: localDigits,
                                fullNumber: buildFullPhone(nextCode, localDigits),
                            });
                        }}
                        clearOnBlur={clearOnBlur}
                        inputValue={codeInputValue}
                        onInputChange={(_, value, reason) => {
                            if (reason === "input" || reason === "clear") {
                                setCodeInputValue(normalizePhonePart(value));
                            }

                            if (reason === "clear") {
                                onChange({
                                    countryCode: "",
                                    localNumber: "",
                                    fullNumber: "",
                                });
                            }
                        }}
                        filterOptions={(options, { inputValue }) =>
                            options.filter(
                                (o) =>
                                    o.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                    o.code.includes(inputValue)
                            )
                        }
                        sx={{ minWidth: 140 }}
                        slotProps={{ paper: { sx: { minWidth: 260 } } }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant={variant}
                                size={size}
                                label={codeLabel}
                                error={error}
                                helperText={sharedHelperText}
                                autoComplete="off"
                                required={required}
                                onBlur={onBlur}
                            />
                        )}
                        renderOption={(props, option) => (
                            <li {...props} key={`${option.code}-${option.name}`}>
                                {option.name} ({option.code})
                            </li>
                        )}
                    />

                    <TextField
                        name="phone"
                        variant={variant}
                        size={size}
                        label={numberLabel}
                        type="tel"
                        autoComplete="tel-national"
                        fullWidth
                        disabled={disabled}
                        required={required}
                        error={error}
                        helperText={sharedHelperText}
                        value={localDigits}
                        onBlur={onBlur}
                        onChange={(e) => {
                            const nextLocal = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
                            onChange({
                                countryCode: normalizedCode,
                                localNumber: nextLocal,
                                fullNumber: buildFullPhone(normalizedCode, nextLocal),
                            });
                        }}
                        placeholder={localPlaceholder}
                    />
                </Stack>
            </Box>
        </Box>
    );
}