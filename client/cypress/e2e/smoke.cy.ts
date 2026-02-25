describe("App smoke test", () => {
	it("loads the home page", () => {
		cy.visit("/");
		cy.location("pathname").should("eq", "/");
		cy.get("body").should("be.visible");
	});
});
