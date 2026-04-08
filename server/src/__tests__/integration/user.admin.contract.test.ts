import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";
import { EmailService } from "@services/email.service";

describe("Contract Tests: Admin User Management", () => {
	const REGISTER = "/api/auth/register";
	const LOGIN = "/api/auth/login";
	const ADMIN_USERS = "/api/users/admin";

	let sendVerificationEmailSpy: jest.SpyInstance;

	const verifyUserEmail = async (email: string) => {
		await User.findOneAndUpdate(
			{ email: email.toLowerCase() },
			{
				isEmailVerified: true,
				emailVerificationToken: undefined,
				emailVerificationExpires: undefined,
			},
		);
	};

	const registerAndLogin = async (email: string, role: "customer" | "admin" = "customer") => {
		const payload = {
			firstName: role === "admin" ? "Admin" : "User",
			lastName: "Test",
			phone: "+84901234567",
			email,
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		await request(app).post(REGISTER).send(payload);
		await verifyUserEmail(payload.email);

		if (role === "admin") {
			await User.findOneAndUpdate({ email: payload.email.toLowerCase() }, { role: "admin" });
		}

		const loginRes = await request(app).post(LOGIN).send({
			email: payload.email,
			password: payload.password,
		});

		return {
			token: loginRes.body.token as string,
			userId: (loginRes.body.user?.id ?? loginRes.body.user?.userId ?? loginRes.body.user?._id) as string,
		};
	};

	beforeAll(async () => {
		await connectTestDB();
		sendVerificationEmailSpy = jest
			.spyOn(EmailService.prototype, "sendVerificationEmail")
			.mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await clearTestDB();
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await closeTestDB();
		jest.restoreAllMocks();
	});

	describe("GET /api/users/admin", () => {
		it("returns paginated users for admin", async () => {
			const { token: adminToken } = await registerAndLogin("admin-users@example.com", "admin");
			await registerAndLogin("customer-one@example.com", "customer");
			await registerAndLogin("customer-two@example.com", "customer");

			const res = await request(app)
				.get(`${ADMIN_USERS}?page=1&limit=10&search=customer`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.total).toBeGreaterThanOrEqual(2);
			expect(res.body.data[0]).toHaveProperty("id");
			expect(res.body.data[0]).not.toHaveProperty("password");
			expect(sendVerificationEmailSpy).toHaveBeenCalled();
		});

		it("returns 403 for non-admin user", async () => {
			const { token } = await registerAndLogin("customer-no-admin@example.com", "customer");

			const res = await request(app).get(ADMIN_USERS).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(403);
		});
	});

	describe("PATCH /api/users/admin/:userId/role", () => {
		it("allows admin to update a user role", async () => {
			const { token: adminToken } = await registerAndLogin("admin-role-change@example.com", "admin");
			const { userId: targetUserId } = await registerAndLogin("target-role-change@example.com", "customer");

			const res = await request(app)
				.patch(`${ADMIN_USERS}/${targetUserId}/role`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ role: "admin" });

			expect(res.status).toBe(200);
			expect(res.body.role).toBe("admin");
		});

		it("prevents admin from removing own admin role", async () => {
			const { token: adminToken, userId } = await registerAndLogin("admin-self-demote@example.com", "admin");

			const res = await request(app)
				.patch(`${ADMIN_USERS}/${userId}/role`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ role: "customer" });

			expect(res.status).toBe(400);
		});
	});

	describe("DELETE /api/users/admin/:userId", () => {
		it("allows admin to delete another user", async () => {
			const { token: adminToken } = await registerAndLogin("admin-delete-user@example.com", "admin");
			const { userId: targetUserId } = await registerAndLogin("delete-target@example.com", "customer");

			const res = await request(app)
				.delete(`${ADMIN_USERS}/${targetUserId}`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.message).toMatch(/deleted/i);
		});

		it("prevents admin from deleting own account from admin endpoint", async () => {
			const { token: adminToken, userId } = await registerAndLogin("admin-self-delete@example.com", "admin");

			const res = await request(app)
				.delete(`${ADMIN_USERS}/${userId}`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(400);
		});
	});
});
