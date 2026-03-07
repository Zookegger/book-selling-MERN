/**
 * Template email cho đặt lại mật khẩu.
 * Trả về chuỗi HTML với nội dung cá nhân hóa và liên kết đặt lại mật khẩu.
 * @param name - Tên của người dùng
 * @param resetLink - URL đầy đủ để đặt lại mật khẩu
 * @returns Template email HTML dưới dạng chuỗi
 */
export function resetPasswordEmailTemplate(name: string, resetLink: string): string {
	return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <style>
                    body {
                        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        background-color: #3c8ce7;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px 5px 0 0;
                    }
                    .content {
                        background-color: white;
                        padding: 30px;
                        border-radius: 0 0 5px 5px;
                    }
                    .button {
                        display: inline-block;
                        background-color: #3c8ce7;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #3c8ce7;
                    }
                    .alert {
                        background-color: #eef5fc;
                        border-left: 4px solid #3c8ce7;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 3px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 12px;
                        color: #999;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }
                    .link-text {
                        word-break: break-all;
                        font-size: large;
                        color: #3c8ce7;
                    }
                    p {
                        font-size: large;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Reset Your Password</h2>
                        <p>Hello ${name || "there"},</p>
                        <p>
                            We received a request to reset your password. If you did not make this request, you can ignore this
                            email.
                        </p>

                        <div class="alert">
                            <strong>Security Notice:</strong> Never share this link with anyone. This link will expire in 1
                            hour.
                        </div>

                        <p>To reset your password, click the button below:</p>

                        <a
                            href="${resetLink}"
                            class="button"
                            >Reset Password</a
                        >

                        <p>Or copy and paste this link in your browser:</p>
                        <p class="link-text">${resetLink}</p>

                        <p>If you need further assistance, please contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Book Store. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply to this address.</p>
                    </div>
                </div>
            </body>
        </html>
  `;
}
