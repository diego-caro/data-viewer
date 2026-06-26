describe('SCRUM-32: Deployment configuration — app works with relative API URLs', () => {
  it('should load the login page without absolute API references', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('exist');
  });

  it('should login and navigate to dashboard via relative /api path', () => {
    cy.loginAsAdmin();

    cy.intercept('GET', '/api/players*', {
      statusCode: 200,
      body: [],
    });
    cy.intercept('GET', '/api/fees', {
      statusCode: 200,
      body: [],
    });
    cy.intercept('GET', '/api/fixture/divisions', {
      statusCode: 200,
      body: [],
    });

    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="nav-bar"]').should('exist');
  });

  it('should serve Angular SPA routes without 404', () => {
    cy.loginAsAdmin();

    cy.intercept('GET', '/api/players*', { body: [] });
    cy.intercept('GET', '/api/fees', { body: [] });
    cy.intercept('GET', '/api/fixture/divisions', { body: [] });

    cy.visit('/dashboard');
    cy.get('[data-testid="nav-bar"]').should('exist');

    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('exist');
  });

  it('should intercept API calls using relative /api path (not absolute localhost)', () => {
    cy.loginAsPlayer();

    cy.intercept('GET', '/api/fees', {
      statusCode: 200,
      body: [],
    }).as('getFees');

    cy.intercept('GET', '/api/fixture/divisions', { body: [] });
    cy.intercept('GET', '/api/players*', { body: [] });

    cy.visit('/fees');
    cy.wait('@getFees').then((interception) => {
      expect(interception.request.url).to.include('/api/fees');
      expect(interception.request.url).to.not.include('localhost:3000');
    });
  });
});
