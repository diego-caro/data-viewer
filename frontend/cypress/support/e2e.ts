declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAsAdmin', () => {
  const mockUser = {
    id: 'user-1',
    email: 'admin@cec.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'CEC',
    categoryId: null,
  };

  localStorage.setItem('auth_token', 'mock-jwt-token');

  cy.intercept('GET', '**/api/auth/me', {
    statusCode: 200,
    body: { user: mockUser },
  });
});

export {};
