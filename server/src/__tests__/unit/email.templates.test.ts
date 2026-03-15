import { resetPasswordEmailTemplate } from "@templates/resetPasswordEmail";
import { verificationEmailTemplate } from "@templates/verificationEmail";

describe("email templates", () => {
	describe("verificationEmailTemplate", () => {
		it("renders provided name and verification link", () => {
			const html = verificationEmailTemplate("Lan", "https://app.example.com/verify?token=abc");

			expect(html).toContain("Hello Lan");
			expect(html).toContain("https://app.example.com/verify?token=abc");
			expect(html).toContain("Verify Email");
		});

		it("falls back to 'there' when name is empty", () => {
			const html = verificationEmailTemplate("", "https://app.example.com/verify?token=xyz");

			expect(html).toContain("Hello there");
		});
	});

	describe("resetPasswordEmailTemplate", () => {
		it("renders provided name and reset link", () => {
			const html = resetPasswordEmailTemplate("Minh", "https://app.example.com/reset?token=abc");

			expect(html).toContain("Hello Minh");
			expect(html).toContain("https://app.example.com/reset?token=abc");
			expect(html).toContain("Reset Password");
		});

		it("falls back to 'there' when name is empty", () => {
			const html = resetPasswordEmailTemplate("", "https://app.example.com/reset?token=xyz");

			expect(html).toContain("Hello there");
		});
	});
});
