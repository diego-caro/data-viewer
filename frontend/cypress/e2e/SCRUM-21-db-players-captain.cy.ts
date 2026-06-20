const mockCategories = [
  { id: 'cat-1', name: 'Sub 14' },
  { id: 'cat-2', name: 'Sub 16' },
];

const mockPlayers = [
  { id: 'u1', number: 10, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1', role: 'player' },
  { id: 'u2', number: 7, firstName: 'Valentina', lastName: 'Bravo', status: 'active', categoryId: 'cat-1', role: 'captain' },
  { id: 'u3', number: null, firstName: 'Lucas', lastName: 'Castro', status: 'active', categoryId: 'cat-1', role: 'player' },
];

function interceptApis() {
  cy.intercept('GET', '**/api/categories', {
    statusCode: 200,
    body: { data: mockCategories },
  });
  cy.intercept('GET', '**/api/players?categoryId=cat-1', {
    statusCode: 200,
    body: { data: mockPlayers, category: mockCategories[0] },
  });
}

describe('SCRUM-21: DB-backed players, captain badge, jersey numbers', () => {
  describe('Players page — captain badge', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/players');
    });

    it('should display captain badge for captain players', () => {
      cy.get('[data-testid="captain-badge"]').should('have.length', 1);
      cy.get('[data-testid="captain-badge"]').should('contain.text', 'C');
    });

    it('should not show captain badge for regular players', () => {
      cy.get('[data-testid="player-row"]').first().within(() => {
        cy.get('[data-testid="captain-badge"]').should('not.exist');
      });
    });
  });

  describe('Players page — jersey number display', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/players');
    });

    it('should display jersey number in badge', () => {
      cy.get('[data-testid="badge-active"]').first().should('contain.text', '10');
    });

    it('should display dash for null jersey number', () => {
      cy.get('[data-testid="badge-active"]').eq(2).should('contain.text', '-');
    });
  });

  describe('Admin: edit jersey number', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/players');
    });

    it('should show edit number buttons for admin', () => {
      cy.get('[data-testid="edit-number-button"]').should('have.length', 3);
    });

    it('should show edit form when edit button clicked', () => {
      cy.get('[data-testid="edit-number-button"]').first().click();
      cy.get('[data-testid="edit-number-form"]').should('exist');
      cy.get('[data-testid="number-input"]').should('exist');
    });

    it('should save jersey number', () => {
      cy.intercept('PATCH', '**/api/users/u1/number', {
        statusCode: 200,
        body: { user: { ...mockPlayers[0], playerNumber: 99 } },
      }).as('saveNumber');

      cy.get('[data-testid="edit-number-button"]').first().click();
      cy.get('[data-testid="number-input"]').clear().type('99');
      cy.get('[data-testid="save-number-button"]').click();

      cy.wait('@saveNumber');
      cy.get('[data-testid="edit-number-form"]').should('not.exist');
    });

    it('should cancel editing', () => {
      cy.get('[data-testid="edit-number-button"]').first().click();
      cy.get('[data-testid="cancel-number-button"]').click();
      cy.get('[data-testid="edit-number-form"]').should('not.exist');
    });
  });

  describe('Admin: change captain', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptApis();
      cy.visit('/players');
    });

    it('should show Make Captain button for non-captain players', () => {
      cy.get('[data-testid="make-captain-button"]').should('have.length', 2);
    });

    it('should not show Make Captain button for current captain', () => {
      cy.get('[data-testid="player-row"]').eq(1).within(() => {
        cy.get('[data-testid="make-captain-button"]').should('not.exist');
      });
    });

    it('should change captain on button click', () => {
      cy.intercept('PUT', '**/api/categories/cat-1/captain', {
        statusCode: 200,
        body: {
          newCaptain: { id: 'u1', role: 'captain' },
          oldCaptain: { id: 'u2', role: 'player' },
        },
      }).as('changeCaptain');

      cy.get('[data-testid="make-captain-button"]').first().click();
      cy.wait('@changeCaptain');
    });
  });

  describe('Player role: no admin controls', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      interceptApis();
      cy.visit('/players');
    });

    it('should not show edit buttons for player role', () => {
      cy.get('[data-testid="edit-number-button"]').should('not.exist');
    });

    it('should not show Make Captain button for player role', () => {
      cy.get('[data-testid="make-captain-button"]').should('not.exist');
    });

    it('should still show captain badge', () => {
      cy.get('[data-testid="captain-badge"]').should('have.length', 1);
    });
  });

  describe('Admin user creation: jersey number field', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/users', {
        statusCode: 200,
        body: { data: [] },
      });
      cy.intercept('GET', '**/api/categories', {
        statusCode: 200,
        body: { data: mockCategories },
      });
      cy.visit('/admin/users');
    });

    it('should show jersey number field when role is player', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="role-select"]').select('player');
      cy.get('[data-testid="player-number-input"]').should('exist');
    });

    it('should not show jersey number field when role is admin', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="role-select"]').select('admin');
      cy.get('[data-testid="player-number-input"]').should('not.exist');
    });
  });
});
