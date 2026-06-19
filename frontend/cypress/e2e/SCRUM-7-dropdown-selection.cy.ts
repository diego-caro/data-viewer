describe('SCRUM-7 Dropdown Selection Bug', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/players');
  });

  it('should show the first category selected in the dropdown on initial load', () => {
    cy.get('[data-testid="category-select"]')
      .should('exist')
      .find('option:selected')
      .should('exist');

    cy.get('[data-testid="category-select"]')
      .invoke('val')
      .should('not.be.empty');
  });

  it('should reflect the selected category in the dropdown after changing', () => {
    cy.get('[data-testid="category-select"]')
      .find('option')
      .eq(1)
      .invoke('val')
      .then((secondValue) => {
        cy.get('[data-testid="category-select"]').select(String(secondValue));
        cy.get('[data-testid="category-select"]').should('have.value', secondValue);
      });
  });

  it('should not show a loading spinner when changing categories', () => {
    cy.get('[data-testid="category-select"]').select(1);
    cy.get('.animate-spin').should('not.exist');
  });

  it('should keep the dropdown visible while players load after selection', () => {
    cy.get('[data-testid="category-select"]').select(1);
    cy.get('[data-testid="category-select"]').should('be.visible');
  });

  it('should maintain correct selection after switching categories multiple times', () => {
    cy.get('[data-testid="category-select"]')
      .find('option')
      .then(($options) => {
        if ($options.length < 2) return;

        const secondValue = $options.eq(1).val() as string;
        const firstValue = $options.eq(0).val() as string;

        cy.get('[data-testid="category-select"]').select(secondValue);
        cy.get('[data-testid="category-select"]').should('have.value', secondValue);

        cy.get('[data-testid="category-select"]').select(firstValue);
        cy.get('[data-testid="category-select"]').should('have.value', firstValue);
      });
  });

  it('should update the player list when selecting a different category', () => {
    cy.get('[data-testid="player-row"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="category-select"]').select(1);
    cy.get('[data-testid="player-row"]').should('exist');
  });
});
