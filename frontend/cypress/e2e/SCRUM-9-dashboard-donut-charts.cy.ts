describe('SCRUM-9 Dashboard with Donut Charts', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('should redirect "/" to "/dashboard"', () => {
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });

  it('should display the dashboard page title', () => {
    cy.visit('/dashboard');
    cy.get('h1').should('contain.text', 'Dashboard');
  });

  it('should display one donut chart card per category', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-card"]').should('have.length', 6);
  });

  it('should display category names as chart titles', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-card"]').should('have.length', 6);
    cy.contains('[data-testid="chart-title"]', 'Sub 14').should('exist');
    cy.contains('[data-testid="chart-title"]', 'Sub 16').should('exist');
    cy.contains('[data-testid="chart-title"]', 'Sub 19').should('exist');
    cy.contains('[data-testid="chart-title"]', 'Primera').should('exist');
    cy.contains('[data-testid="chart-title"]', 'Intermedia').should('exist');
    cy.contains('[data-testid="chart-title"]', 'Caballeros').should('exist');
  });

  it('should render canvas charts for categories with players', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-card"]').should('have.length', 6);
    cy.get('canvas').should('have.length.gte', 1);
  });

  it('should display active and inactive counts in the legend', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-legend"]').should('have.length.gte', 1);
    cy.get('[data-testid="chart-legend"]').first()
      .should('contain.text', 'Active:')
      .and('contain.text', 'Inactive:');
  });

  it('should use green for active and red for inactive in the legend', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-legend"]').should('have.length.gte', 1);
    cy.get('[data-testid="chart-legend"]').first().within(() => {
      cy.get('.bg-green-500').should('exist');
      cy.get('.bg-red-500').should('exist');
    });
  });

  it('should not show loading indicator after data loads', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-card"]').should('have.length', 6);
    cy.get('[data-testid="loading-state"]').should('not.exist');
  });

  it('should not show error state on successful load', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="chart-card"]').should('have.length', 6);
    cy.get('[data-testid="error-state"]').should('not.exist');
  });

  it('should show error state when API fails', () => {
    cy.intercept('GET', '**/api/categories', { statusCode: 500, body: {} }).as('categoriesFail');
    cy.visit('/dashboard');
    cy.wait('@categoriesFail');
    cy.get('[data-testid="error-state"]').should('exist');
    cy.get('[data-testid="error-state"]').should('contain.text', 'Unable to load dashboard data');
  });
});
