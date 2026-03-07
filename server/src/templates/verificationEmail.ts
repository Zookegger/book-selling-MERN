/**
 * Template email cho xác minh email.
 * Trả về chuỗi HTML với nội dung cá nhân hóa và liên kết xác minh.
 * @param name - Tên của người dùng
 * @param verificationLink - URL đầy đủ để xác minh email
 * @returns Template email HTML dưới dạng chuỗi
 */
export function verificationEmailTemplate(name: string, verificationLink: string): string {
	return `
        <!doctype html>
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
                        background-color: #2c3e50;
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
                        background-color: #3498db;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #2980b9;
                    }
                    .button#verify {
                        align-self: center;
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
                        color: #3498db;
                    }
                    p {
                        font-size: large;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Book Store</h1>
                    </div>
                    <div class="content">
                        <h2>Verify Your Email</h2>
                        <p>Hello ${name || "there"},</p>
                        <p>
                            Thank you for registering with Book Store. To complete your registration and start exploring our
                            collection of books, please verify your email address.
                        </p>

                        <div style="display: flex; flex-direction: column">
                            <a
                                href="${verificationLink}"
                                class="button"
                                id="verify"
                            >
                                Verify Email
                            </a>
                        </div>

                        <p>Or copy and paste this link in your browser:</p>
                        <p class="link-text">${verificationLink}</p>

                        <p>This verification link will expire in 1 hour.</p>

                        <p>If you did not create an account with Book Store, please ignore this email.</p>
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
