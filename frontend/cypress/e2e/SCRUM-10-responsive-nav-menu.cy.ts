describe('SCRUM-10 Responsive Navigation Menu', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });

  describe('navigation bar', () => {
    it('should display the nav bar on every page', () => {
      cy.get('[data-testid="nav-bar"]').should('be.visible');
    });

    it('should display the CEC logo', () => {
      cy.get('[data-testid="nav-logo"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .and('contain', 'logo-cec.png');
    });

    it('should have alt text on the logo', () => {
      cy.get('[data-testid="nav-logo"]')
        .should('have.attr', 'alt')
        .and('not.be.empty');
    });
  });

  describe('desktop navigation (md+)', () => {
    beforeEach(() => {
      cy.viewport(1024, 768);
    });

    it('should show inline nav links', () => {
      cy.get('[data-testid="nav-link"]').should('have.length', 3);
      cy.get('[data-testid="nav-link"]').eq(0).should('contain.text', 'Dashboard');
      cy.get('[data-testid="nav-link"]').eq(1).should('contain.text', 'Players');
      cy.get('[data-testid="nav-link"]').eq(2).should('contain.text', 'Fixture');
    });

    it('should navigate to Players page when clicking the link', () => {
      cy.get('[data-testid="nav-link"]').contains('Players').click();
      cy.url().should('include', '/players');
    });

    it('should navigate to Fixture page when clicking the link', () => {
      cy.get('[data-testid="nav-link"]').contains('Fixture').click();
      cy.url().should('include', '/fixture');
    });

    it('should navigate back to Dashboard via logo click', () => {
      cy.get('[data-testid="nav-link"]').contains('Fixture').click();
      cy.url().should('include', '/fixture');
      cy.get('[data-testid="nav-logo"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should hide the hamburger button on desktop', () => {
      cy.get('[data-testid="hamburger-button"]').should('not.be.visible');
    });
  });

  describe('mobile navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-6');
    });

    it('should show the hamburger button', () => {
      cy.get('[data-testid="hamburger-button"]').should('be.visible');
    });

    it('should not show mobile menu by default', () => {
      cy.get('[data-testid="mobile-menu"]').should('not.exist');
    });

    it('should open mobile menu when hamburger is clicked', () => {
      cy.get('[data-testid="hamburger-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      cy.get('[data-testid="mobile-nav-link"]').should('have.length', 3);
    });

    it('should close mobile menu when hamburger is clicked again', () => {
      cy.get('[data-testid="hamburger-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      cy.get('[data-testid="hamburger-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('not.exist');
    });

    it('should navigate and close menu when a mobile link is clicked', () => {
      cy.get('[data-testid="hamburger-button"]').click();
      cy.get('[data-testid="mobile-nav-link"]').contains('Players').click();
      cy.url().should('include', '/players');
      cy.get('[data-testid="mobile-menu"]').should('not.exist');
    });

    it('should hide desktop nav links on mobile', () => {
      cy.get('[data-testid="nav-link"]').should('not.be.visible');
    });
  });

  describe('active route highlighting', () => {
    beforeEach(() => {
      cy.viewport(1024, 768);
    });

    it('should highlight Dashboard link when on dashboard page', () => {
      cy.get('[data-testid="nav-link"]')
        .contains('Dashboard')
        .should('have.class', 'text-blue-600');
    });

    it('should highlight Players link when on players page', () => {
      cy.get('[data-testid="nav-link"]').contains('Players').click();
      cy.get('[data-testid="nav-link"]')
        .contains('Players')
        .should('have.class', 'text-blue-600');
    });
  });

  describe('nav persists across pages', () => {
    it('should show nav bar on the fixture page', () => {
      cy.visit('/fixture');
      cy.get('[data-testid="nav-bar"]').should('be.visible');
    });

    it('should show nav bar on the players page', () => {
      cy.visit('/players');
      cy.get('[data-testid="nav-bar"]').should('be.visible');
    });
  });
});
