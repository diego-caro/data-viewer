const mockCategories = [
  { id: 'cat-1', name: 'Sub 14' },
  { id: 'cat-2', name: 'Sub 16' },
];

const mockUsers = [
  { id: 'u1', email: 'admin@cec.com', role: 'admin' as const, firstName: 'Admin', lastName: 'CEC', categoryId: null },
  { id: 'u2', email: 'player@cec.com', role: 'player' as const, firstName: 'Player', lastName: 'One', categoryId: 'cat-1' },
  { id: 'u3', email: 'captain@cec.com', role: 'captain' as const, firstName: 'Captain', lastName: 'Cat1', categoryId: 'cat-1' },
];

function interceptApis() {
  cy.intercept('GET', '**/api/users', {
    statusCode: 200,
    body: { data: mockUsers },
  });
  cy.intercept('GET', '**/api/categories', {
    statusCode: 200,
    body: { data: mockCategories },
  });
}

describe('SCRUM-22: Admin edit and delete users', () => {
  describe('Edit/Delete buttons in table', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/admin/users');
    });

    it('should show edit and delete buttons for each user row', () => {
      cy.get('[data-testid="edit-user-button"]').should('have.length', 3);
      cy.get('[data-testid="delete-user-button"]').should('have.length', 3);
    });
  });

  describe('Edit user flow', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/admin/users');
    });

    it('should open pre-filled form when edit is clicked', () => {
      cy.get('[data-testid="edit-user-button"]').eq(1).click();
      cy.get('[data-testid="user-form"]').should('exist');
      cy.get('[data-testid="user-form"]').should('contain.text', 'Edit User');
      cy.get('[data-testid="email-input"]').should('have.value', 'player@cec.com');
      cy.get('[data-testid="first-name-input"]').should('have.value', 'Player');
      cy.get('[data-testid="last-name-input"]').should('have.value', 'One');
    });

    it('should submit updated user data', () => {
      cy.intercept('PUT', '**/api/users/u2', {
        statusCode: 200,
        body: { user: { ...mockUsers[1], firstName: 'Updated' } },
      }).as('updateUser');

      cy.get('[data-testid="edit-user-button"]').eq(1).click();
      cy.get('[data-testid="first-name-input"]').clear().type('Updated');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@updateUser');
      cy.get('[data-testid="user-form"]').should('not.exist');
    });

    it('should show error on duplicate email', () => {
      cy.intercept('PUT', '**/api/users/u2', {
        statusCode: 409,
        body: { error: 'Email already exists' },
      }).as('updateUser');

      cy.get('[data-testid="edit-user-button"]').eq(1).click();
      cy.get('[data-testid="email-input"]').clear().type('admin@cec.com');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@updateUser');
      cy.get('[data-testid="form-error"]').should('contain.text', 'Email already exists');
    });

    it('should cancel editing', () => {
      cy.get('[data-testid="edit-user-button"]').eq(1).click();
      cy.get('[data-testid="user-form"]').should('exist');
      cy.get('[data-testid="cancel-button"]').click();
      cy.get('[data-testid="user-form"]').should('not.exist');
    });
  });

  describe('Delete user flow', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/admin/users');
    });

    it('should show confirmation dialog with user name', () => {
      cy.get('[data-testid="delete-user-button"]').eq(1).click();
      cy.get('[data-testid="confirm-delete-modal"]').should('exist');
      cy.get('[data-testid="confirm-delete-modal"]').should('contain.text', 'Player');
      cy.get('[data-testid="confirm-delete-modal"]').should('contain.text', 'One');
    });

    it('should cancel deletion when cancel is clicked', () => {
      cy.get('[data-testid="delete-user-button"]').eq(1).click();
      cy.get('[data-testid="confirm-delete-modal"]').should('exist');
      cy.get('[data-testid="cancel-delete-button"]').click();
      cy.get('[data-testid="confirm-delete-modal"]').should('not.exist');
    });

    it('should delete user on confirmation', () => {
      cy.intercept('DELETE', '**/api/users/u2', {
        statusCode: 200,
        body: { message: 'User deleted' },
      }).as('deleteUser');

      cy.get('[data-testid="delete-user-button"]').eq(1).click();
      cy.get('[data-testid="confirm-delete-button"]').click();

      cy.wait('@deleteUser');
      cy.get('[data-testid="confirm-delete-modal"]').should('not.exist');
      cy.get('[data-testid="user-row"]').should('have.length', 2);
    });

    it('should not show modal initially', () => {
      cy.get('[data-testid="confirm-delete-modal"]').should('not.exist');
    });
  });

  describe('Create user still works', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/admin/users');
    });

    it('should show New User title in create mode', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="user-form"]').should('contain.text', 'New User');
    });
  });
});
