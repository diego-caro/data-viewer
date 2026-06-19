describe('SCRUM-6 Players List by Category', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/players');
  });

  it('should display the players page with a category selector', () => {
    cy.get('h1').should('contain.text', 'Players');
    cy.get('[data-testid="category-select"]').should('exist');
  });

  it('should display a list of players for the default category', () => {
    cy.get('[data-testid="player-row"]').should('have.length.greaterThan', 0);
  });

  it('should show numbered badge with player number, last name, and first name', () => {
    cy.get('[data-testid="player-row"]')
      .first()
      .within(() => {
        cy.get('[data-testid="badge-active"], [data-testid="badge-inactive"]')
          .should('exist')
          .and('not.be.empty');
      });
  });

  it('should show green badges for active players and red for inactive', () => {
    cy.get('[data-testid="badge-active"]').should('have.class', 'bg-green-500');
    cy.get('[data-testid="badge-inactive"]').should('have.class', 'bg-red-500');
  });

  it('should display players sorted alphabetically by last name', () => {
    cy.get('[data-testid="player-row"]').then(($rows) => {
      const lastNames = [...$rows].map(
        (row) => row.querySelector('.font-semibold')?.textContent?.trim() ?? ''
      );
      const sorted = [...lastNames].sort((a, b) => a.localeCompare(b));
      expect(lastNames).to.deep.equal(sorted);
    });
  });

  it('should update player list when selecting a different category', () => {
    cy.get('[data-testid="player-row"]')
      .its('length')
      .then((initialCount) => {
        cy.get('[data-testid="category-select"]')
          .select(1)
          .then(() => {
            cy.get('[data-testid="player-row"]').should('exist');
            cy.get('[data-testid="player-row"]')
              .its('length')
              .should('not.equal', initialCount);
          });
      });
  });

  it('should be responsive on mobile viewport', () => {
    cy.viewport('iphone-6');
    cy.get('[data-testid="player-row"]').should('be.visible');
    cy.get('[data-testid="category-select"]').should('be.visible');
  });
});
