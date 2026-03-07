export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "customer" | "admin";
}

export interface AuthResponseDto {
  user: AuthUserDto;
  token: string;
}
