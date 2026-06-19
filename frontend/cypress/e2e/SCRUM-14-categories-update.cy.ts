describe('SCRUM-14 Categories match real club divisions', () => {
  const expectedCategories = ['Sub 14', 'Sub 16', 'Sub 19', 'Primera', 'Intermedia', 'Caballeros'];

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  describe('Dashboard — 6 category charts', () => {
    it('should display exactly 6 donut chart cards', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="chart-card"]').should('have.length', 6);
    });

    it('should show all 6 category names as chart titles', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="chart-card"]').should('have.length', 6);
      expectedCategories.forEach((name) => {
        cy.contains('[data-testid="chart-title"]', name).should('exist');
      });
    });
  });

  describe('Players — 6 categories in dropdown', () => {
    it('should show all 6 categories in the dropdown', () => {
      cy.visit('/players');
      cy.get('[data-testid="category-select"]').should('be.visible');
      cy.get('[data-testid="category-select"] option').should('have.length', 6);
      expectedCategories.forEach((name) => {
        cy.get('[data-testid="category-select"]').contains(name);
      });
    });

    it('should load players when selecting any category', () => {
      cy.visit('/players');
      cy.get('[data-testid="category-select"]').select('Primera');
      cy.get('[data-testid="player-row"]').should('have.length.gte', 1);
    });
  });

  describe('Admin users — 6 categories in create form', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/users', {
        statusCode: 200,
        body: { data: [{ id: 'u1', email: 'admin@cec.com', role: 'admin', firstName: 'Admin', lastName: 'CEC', categoryId: null }] },
      }).as('getUsers');
      cy.visit('/admin/users');
      cy.wait('@getUsers');
    });

    it('should show all 6 categories when creating a player user', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="role-select"]').should('have.value', 'player');
      cy.get('[data-testid="category-select"]').should('be.visible');
      cy.get('[data-testid="category-select"] option').should('have.length.gte', 6);
      expectedCategories.forEach((name) => {
        cy.get('[data-testid="category-select"]').contains(name);
      });
    });
  });

  describe('Edge case — no old category names remain', () => {
    it('should not show any old placeholder category names on dashboard', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="chart-card"]').should('have.length', 6);
      cy.contains('Mixto Sub 14 A').should('not.exist');
      cy.contains('Mixto Sub 14 B').should('not.exist');
    });
  });
});
