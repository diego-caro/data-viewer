describe('SCRUM-8 Tournament Fixture Page', () => {
  beforeEach(() => {
    cy.visit('/fixture');
  });

  it('should display the fixture page with title', () => {
    cy.get('h1').should('contain.text', 'Fixture');
  });

  it('should show matches grouped by round headers', () => {
    cy.get('[data-testid="round-header"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="round-header"]')
      .first()
      .should('contain.text', 'Fecha');
  });

  it('should display completed matches with scores', () => {
    cy.get('[data-testid="match-card-completed"]').should(
      'have.length.greaterThan',
      0
    );
    cy.get('[data-testid="match-score"]')
      .first()
      .should('contain.text', '-');
  });

  it('should display pending matches with scheduled date', () => {
    cy.get('[data-testid="match-card-pending"]').should(
      'have.length.greaterThan',
      0
    );
    cy.get('[data-testid="match-date-pending"]').should(
      'have.length.greaterThan',
      0
    );
  });

  it('should display team names on each match card', () => {
    cy.get('[data-testid="team-name"]').should('have.length.greaterThan', 0);
  });

  it('should display team logos or placeholders', () => {
    cy.get(
      '[data-testid="team-logo"], [data-testid="team-logo-placeholder"]'
    ).should('have.length.greaterThan', 0);
  });

  it('should display venue name on each match card', () => {
    cy.get('[data-testid="match-venue"]').should(
      'have.length.greaterThan',
      0
    );
    cy.get('[data-testid="match-venue"]')
      .first()
      .should('not.be.empty');
  });

  it('should visually distinguish completed from pending matches', () => {
    cy.get('[data-testid="match-card-completed"]')
      .first()
      .should('have.class', 'border-gray-200');
    cy.get('[data-testid="match-card-pending"]')
      .first()
      .should('have.class', 'border-blue-200');
  });

  it('should be responsive on mobile viewport', () => {
    cy.viewport('iphone-6');
    cy.get('[data-testid="match-card-completed"], [data-testid="match-card-pending"]')
      .first()
      .should('be.visible');
    cy.get('[data-testid="team-name"]').first().should('be.visible');
  });

  it('should sort rounds in ascending order', () => {
    cy.get('[data-testid="round-header"]').then(($headers) => {
      const roundNumbers = [...$headers].map((header) => {
        const match = header.textContent?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      const sorted = [...roundNumbers].sort((a, b) => a - b);
      expect(roundNumbers).to.deep.equal(sorted);
    });
  });
});
