// it("admin có thể query/search/filter danh sách địa chỉ", async () => {
// 	const queryAddressesForAdmin = (userServiceModule as any).queryAddressesForAdmin;
// 	expect(typeof queryAddressesForAdmin).toBe("function");

// 	const userA = await makeUser({ email: "admin-view-a@example.com" });
// 	const userB = await makeUser({ email: "admin-view-b@example.com" });

// 	await updateProfile(userA._id.toString(), {
// 		addresses: [{ ...sampleAddress, streetDetails: "District 1 Searchable", country: "Vietnam" }],
// 	});
// 	await updateProfile(userB._id.toString(), {
// 		addresses: [{ ...sampleAddress, streetDetails: "Bangkok Central", country: "Thailand" }],
// 	});

// 	const queriedByUser = await queryAddressesForAdmin({ userId: userA._id.toString() });
// 	expect(Array.isArray(queriedByUser)).toBe(true);
// 	expect(queriedByUser.every((a: { userId: string }) => a.userId === userA._id.toString())).toBe(true);

// 	const searched = await queryAddressesForAdmin({ search: "searchable" });
// 	expect(searched.some((a: { streetDetails: string }) => a.streetDetails.toLowerCase().includes("searchable"))).toBe(
// 		true,
// 	);

// 	const filtered = await queryAddressesForAdmin({ country: "Vietnam" });
// 	expect(filtered.every((a: { country: string }) => a.country === "Vietnam")).toBe(true);
// });
