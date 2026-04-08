Dưới đây là bản dịch tiếng Việt cho phần hướng dẫn sử dụng các tập lệnh (scripts) và thiết lập kiểm thử cho dự án của bạn.

---

# Hướng dẫn Sử dụng & Các câu lệnh trong Dự án

Tài liệu này hướng dẫn các câu lệnh thiết yếu để chạy, xây dựng (build), khởi tạo dữ liệu (seed) và kiểm thử ứng dụng **book-selling-MERN**.

## Chạy Server

Hãy đảm bảo bạn đang ở trong thư mục `server` (hoặc thư mục gốc nơi chứa file `package.json`) trước khi thực hiện các lệnh này.

- **Chế độ Phát triển (Development):**

    ```bash
    npm run dev
    ```

    Khởi chạy server phát triển cục bộ bằng `ts-node-dev`. Nó sẽ tự động theo dõi các thay đổi trong file và khởi động lại server, giúp bạn không cần phải biên dịch TypeScript thủ công.

- **Xây dựng để Triển khai (Production Build):**

    ```bash
    npm run build
    ```

    Xóa thư mục `/dist` cũ và biên dịch mã nguồn TypeScript thành JavaScript thuần để chạy trên môi trường thực tế.

- **Chạy Server Production:**
    ```bash
    npm start
    ```
    Chạy ứng dụng đã được biên dịch từ thư mục `/dist`. **Lưu ý:** Bạn phải chạy lệnh `npm run build` trước khi thực hiện lệnh này.

## Quản lý Cơ sở dữ liệu

- **Khởi tạo Dữ liệu (Seed DB):**

    ```bash
    npm run db:seed
    ```

    Đổ dữ liệu mẫu ban đầu vào MongoDB (Danh mục, Tác giả, Nhà xuất bản, Sách và Người dùng).

    _Mẹo: Nếu bộ seeder của bạn chấp nhận các tham số dòng lệnh (như `--append` hoặc `--books`), bạn có thể truyền chúng qua npm bằng cách thêm dấu `--` trước các tham số đó:_

    ```bash
    # Ví dụ: Thêm dữ liệu mới thay vì xóa hết làm lại, và tạo 50 cuốn sách
    npm run db:seed -- --append --books=50
    ```

---

## Thiết lập Kiểm thử (Testing)

Kiến trúc kiểm thử được chia làm hai phần: Backend (Jest) và Frontend (Cypress).

### Kiểm thử Server (Jest)

Backend sử dụng Jest để kiểm thử đơn vị (Unit Test) và kiểm thử tích hợp (Integration Test).

- **Cấu hình:** `server/jest.config.ts`
- **File thiết lập (Setup):** `server/src/__tests__/setup.ts`

**Các câu lệnh:**
Di chuyển vào thư mục `server` (`cd server`) để chạy các lệnh sau:

- `npm test`: Chạy toàn bộ bộ kiểm thử một lần.
- `npm run test:watch`: Chạy kiểm thử ở chế độ theo dõi tương tác (rất hữu ích khi đang viết code).
- `npm run test:coverage`: Chạy kiểm thử và tạo báo cáo về độ bao phủ mã nguồn (code coverage).
- `npm run test:ci`: Tối ưu hóa cho môi trường Tích hợp liên tục (CI); tự động dừng khi có lỗi và tạo báo cáo coverage.

### Kiểm thử Client (Cypress)

Frontend sử dụng Cypress để kiểm thử toàn trình (End-to-End - E2E).

- **Cấu hình:** `client/cypress.config.ts`
- **File hỗ trợ:** `client/cypress/support/e2e.ts`

**Các câu lệnh:**
Di chuyển vào thư mục `client` (`cd client`) để chạy các lệnh sau:

- `npm test`: Chạy bộ kiểm thử mặc định của client.
- `npm run test:e2e`: Chạy kiểm thử Cypress E2E trong terminal (chế độ headless).
- `npm run test:e2e:open`: Mở giao diện người dùng (UI) tương tác của Cypress để theo dõi quá trình test.
- `npm run test:e2e:ci`: Chạy kiểm thử E2E được tối ưu hóa cho các luồng CI/CD.

***Lưu ý quan trọng cho người dùng Linux / CI:***
_Để chạy Cypress trên Linux (hoặc trong các container Docker/CI dựa trên Linux), bạn cần cài đặt các thư viện hệ thống tiên quyết sau:_

```bash
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libgtk-3-0 libgbm1 libasound2t64
 ```
