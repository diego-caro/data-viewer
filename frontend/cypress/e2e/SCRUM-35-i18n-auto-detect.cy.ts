describe('SCRUM-35 Internationalization: auto-detect browser language', () => {
  const mockCategories = [{ id: 'cat-1', name: 'Sub 14' }];
  const mockPlayers = {
    data: [
      { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1', role: 'player' },
    ],
    category: mockCategories[0],
  };
  const mockDivisions = [{ id: 206752, name: 'Mixto Sub 14 A' }];
  const mockFees: never[] = [];

  function interceptCommonAPIs(): void {
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    cy.intercept('GET', '**/api/categories/*/players', { statusCode: 200, body: mockPlayers });
    cy.intercept('GET', '**/api/fees/current', { statusCode: 200, body: mockFees });
    cy.intercept('GET', '**/api/fixture/divisions', { statusCode: 200, body: mockDivisions });
    cy.intercept('GET', '**/api/fixture/*/matches', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/fixture/*/clubs', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/fixture/*/standings', { statusCode: 200, body: [] });
  }

  describe('English browser language', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptCommonAPIs();
    });

    it('should display navigation labels in English when browser is set to English', () => {
      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="nav-link"]').should('contain.text', 'Dashboard');
      cy.get('[data-testid="nav-link"]').should('contain.text', 'Tournament');
    });

    it('should display login page in English', () => {
      localStorage.clear();
      cy.visit('/login', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.contains('h1', 'Sign In').should('be.visible');
      cy.get('[data-testid="login-button"]').should('contain.text', 'Sign In');
    });
  });

  describe('Spanish browser language', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptCommonAPIs();
    });

    it('should display navigation labels in Spanish when browser is set to Spanish', () => {
      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'es' });
          Object.defineProperty(win.navigator, 'languages', { value: ['es'] });
        },
      });

      cy.get('[data-testid="nav-link"]').should('contain.text', 'Panel');
      cy.get('[data-testid="nav-link"]').should('contain.text', 'Torneo');
    });

    it('should display login page in Spanish', () => {
      localStorage.clear();
      cy.visit('/login', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'es' });
          Object.defineProperty(win.navigator, 'languages', { value: ['es'] });
        },
      });

      cy.contains('h1', 'Iniciar Sesión').should('be.visible');
      cy.get('[data-testid="login-button"]').should('contain.text', 'Iniciar Sesión');
    });

    it('should display admin navigation links in Spanish', () => {
      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'es' });
          Object.defineProperty(win.navigator, 'languages', { value: ['es'] });
        },
      });

      cy.get('[data-testid="admin-nav-link"]').should('contain.text', 'Jugadores');
      cy.get('[data-testid="admin-nav-link"]').should('contain.text', 'Cuotas');
      cy.get('[data-testid="admin-nav-link"]').should('contain.text', 'Usuarios');
    });
  });

  describe('unsupported language fallback', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      interceptCommonAPIs();
    });

    it('should fall back to Spanish when browser language is unsupported (French)', () => {
      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'fr' });
          Object.defineProperty(win.navigator, 'languages', { value: ['fr'] });
        },
      });

      cy.get('[data-testid="nav-link"]').should('contain.text', 'Panel');
      cy.get('[data-testid="nav-link"]').should('contain.text', 'Torneo');
    });

    it('should fall back to Spanish when browser language is German', () => {
      localStorage.clear();
      cy.visit('/login', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'de' });
          Object.defineProperty(win.navigator, 'languages', { value: ['de'] });
        },
      });

      cy.contains('h1', 'Iniciar Sesión').should('be.visible');
    });
  });

  describe('translated pages', () => {
    it('should translate the dashboard page in English', () => {
      cy.loginAsAdmin();
      interceptCommonAPIs();

      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="logout-button"]').should('contain.text', 'Logout');
    });

    it('should translate the players page in English', () => {
      cy.loginAsAdmin();
      interceptCommonAPIs();

      cy.visit('/players', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="category-select"]').should('be.visible');
      cy.get('[data-testid="player-row"]').should('have.length.gte', 1);
    });

    it('should translate the fixture page in English', () => {
      cy.loginAsAdmin();
      interceptCommonAPIs();

      cy.visit('/fixture', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="tab-fixture"]').should('contain.text', 'Fixture');
      cy.get('[data-testid="tab-standings"]').should('contain.text', 'Standings');
    });

    it('should translate error messages in login page (English)', () => {
      localStorage.clear();
      cy.intercept('POST', '**/api/auth/login', { statusCode: 401, body: { error: 'fail' } }).as('loginRequest');

      cy.visit('/login', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('wrong');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest');
      cy.get('[data-testid="login-error"]').should('contain.text', 'Invalid email or password');
    });

    it('should translate error messages in login page (Spanish)', () => {
      localStorage.clear();
      cy.intercept('POST', '**/api/auth/login', { statusCode: 401, body: { error: 'fail' } }).as('loginRequest');

      cy.visit('/login', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'es' });
          Object.defineProperty(win.navigator, 'languages', { value: ['es'] });
        },
      });

      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('wrong');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest');
      cy.get('[data-testid="login-error"]').should('contain.text', 'Correo o contraseña inválidos');
    });
  });

  describe('database content stays untranslated', () => {
    it('should keep category names in their original language regardless of browser lang', () => {
      cy.loginAsAdmin();
      interceptCommonAPIs();

      cy.visit('/players', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="category-select"]').should('contain.text', 'Sub 14');
    });

    it('should keep player names untranslated', () => {
      cy.loginAsAdmin();
      interceptCommonAPIs();

      cy.visit('/players', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'en' });
          Object.defineProperty(win.navigator, 'languages', { value: ['en'] });
        },
      });

      cy.get('[data-testid="player-row"]').first().should('contain.text', 'Alvarez');
      cy.get('[data-testid="player-row"]').first().should('contain.text', 'Mateo');
    });
  });
});
