describe('SCRUM-11 Auth & Login', () => {
  const mockUser = {
    id: 'user-1',
    email: 'admin@cec.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'CEC',
    categoryId: null,
  };

  const mockLoginResponse = {
    token: 'mock-jwt-token',
    user: mockUser,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('unauthenticated access', () => {
    it('should redirect to /login when visiting /dashboard without auth', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect to /login when visiting /players without auth', () => {
      cy.visit('/players');
      cy.url().should('include', '/login');
    });

    it('should redirect to /login when visiting /fixture without auth', () => {
      cy.visit('/fixture');
      cy.url().should('include', '/login');
    });

    it('should not show the nav bar on the login page', () => {
      cy.visit('/login');
      cy.get('[data-testid="nav-bar"]').should('not.exist');
    });
  });

  describe('login page', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should display the login form', () => {
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });

    it('should display the CEC logo', () => {
      cy.get('img[alt="CEC Logo"]').should('be.visible');
    });

    it('should display Sign In title', () => {
      cy.contains('h1', 'Sign In').should('be.visible');
    });

    it('should have the submit button disabled when fields are empty', () => {
      cy.get('[data-testid="login-button"]').should('be.disabled');
    });

    it('should enable submit button when both fields are filled', () => {
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('admin123');
      cy.get('[data-testid="login-button"]').should('not.be.disabled');
    });
  });

  describe('successful login', () => {
    it('should redirect to /dashboard and show user name in nav on valid credentials', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: mockLoginResponse,
      }).as('loginRequest');

      cy.intercept('GET', '**/api/auth/me', {
        statusCode: 200,
        body: { user: mockUser },
      }).as('meRequest');

      cy.intercept('GET', '**/api/categories', {
        statusCode: 200,
        body: { data: [] },
      });

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('admin123');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="nav-bar"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain.text', 'Admin CEC');
    });

    it('should store JWT token in localStorage after login', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: mockLoginResponse,
      }).as('loginRequest');

      cy.intercept('GET', '**/api/auth/me', {
        statusCode: 200,
        body: { user: mockUser },
      });

      cy.intercept('GET', '**/api/categories', {
        statusCode: 200,
        body: { data: [] },
      });

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('admin123');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest').then(() => {
        expect(localStorage.getItem('auth_token')).to.equal('mock-jwt-token');
      });
    });
  });

  describe('failed login', () => {
    it('should show error message on invalid credentials', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid email or password' },
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest');
      cy.get('[data-testid="login-error"]')
        .should('be.visible')
        .and('contain.text', 'Invalid email or password');
    });

    it('should show generic error on server error', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('admin123');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest');
      cy.get('[data-testid="login-error"]')
        .should('be.visible')
        .and('contain.text', 'An unexpected error occurred');
    });

    it('should stay on /login after failed login', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid email or password' },
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('wrong');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/login');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: mockLoginResponse,
      }).as('loginRequest');

      cy.intercept('GET', '**/api/auth/me', {
        statusCode: 200,
        body: { user: mockUser },
      });

      cy.intercept('GET', '**/api/categories', {
        statusCode: 200,
        body: { data: [] },
      });

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('admin123');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
    });

    it('should clear session and redirect to /login when logout is clicked', () => {
      cy.viewport(1024, 768);
      cy.get('[data-testid="logout-button"]').click();
      cy.url().should('include', '/login');
    });
  });

  describe('expired/invalid token', () => {
    it('should redirect to /login when /auth/me returns 401', () => {
      localStorage.setItem('auth_token', 'expired-token');

      cy.intercept('GET', '**/api/auth/me', {
        statusCode: 401,
        body: { error: 'Invalid or expired token' },
      }).as('meRequest');

      cy.visit('/dashboard');
      cy.wait('@meRequest');
      cy.url().should('include', '/login');
    });
  });
});
