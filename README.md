# book-selling-MERN

## Testing Setup

### Server (Jest)

- Config: `server/jest.config.ts`
- Setup file: `server/src/__tests__/setup.ts`
- Suggested structure:
	- `server/src/__tests__/unit/`
	- `server/src/__tests__/integration/`
	- `server/test/integration/` (optional external integration tests)

Commands:

- `cd server && npm test`
- `cd server && npm run test:watch`
- `cd server && npm run test:coverage`
- `cd server && npm run test:ci`

### Client (Cypress)

- Config: `client/cypress.config.ts`
- Support: `client/cypress/support/e2e.ts`
- Suggested structure:
	- `client/cypress/e2e/`
	- `client/cypress/fixtures/`
	- `client/cypress/screenshots/`
	- `client/cypress/videos/`

Commands:

- `cd client && npm test`
- `cd client && npm run test:e2e`
- `cd client && npm run test:e2e:open`
- `cd client && npm run test:e2e:ci`

Linux prerequisites (required to run Cypress Electron binary):

- `sudo apt-get update`
- `sudo apt-get install -y libnspr4 libnss3 libgtk-3-0 libgbm1 libasound2t64`
