describe('SCRUM-12 Admin User Management + Role-based Views', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
    { id: 'cat-2', name: 'Sub 16' },
  ];

  const mockUsers = [
    { id: 'u1', email: 'admin@cec.com', role: 'admin', firstName: 'Admin', lastName: 'CEC', categoryId: null },
    { id: 'u2', email: 'player@cec.com', role: 'player', firstName: 'Player', lastName: 'One', categoryId: 'cat-1' },
  ];

  const mockPlayers = [
    { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1' },
    { id: 'p-02', number: 3, firstName: 'Lucas', lastName: 'Castro', status: 'inactive', categoryId: 'cat-1' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Admin — navigation', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    });

    it('should show Admin nav link for admin users', () => {
      cy.intercept('GET', '**/api/players?categoryId=*', { statusCode: 200, body: { data: [], category: mockCategories[0] } });
      cy.visit('/dashboard');
      cy.viewport(1024, 768);
      cy.get('[data-testid="admin-nav-link"]').should('be.visible').and('contain.text', 'Admin');
    });
  });

  describe('Admin — users page', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/users', { statusCode: 200, body: { data: mockUsers } }).as('getUsers');
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.visit('/admin/users');
      cy.wait('@getUsers');
    });

    it('should display users table with name, email, role, and category', () => {
      cy.get('[data-testid="users-table"]').should('be.visible');
      cy.get('[data-testid="user-row"]').should('have.length', 2);

      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.contains('CEC');
        cy.contains('admin@cec.com');
        cy.get('[data-testid="role-badge"]').should('contain.text', 'admin');
      });

      cy.get('[data-testid="user-row"]').last().within(() => {
        cy.contains('One');
        cy.contains('player@cec.com');
        cy.get('[data-testid="role-badge"]').should('contain.text', 'player');
        cy.contains('Sub 14');
      });
    });

    it('should show create user form when New User is clicked', () => {
      cy.get('[data-testid="user-form"]').should('not.exist');
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="user-form"]').should('be.visible');
      cy.get('[data-testid="first-name-input"]').should('be.visible');
      cy.get('[data-testid="last-name-input"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="role-select"]').should('be.visible');
    });

    it('should hide form when Cancel is clicked', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="user-form"]').should('be.visible');
      cy.get('[data-testid="cancel-button"]').click();
      cy.get('[data-testid="user-form"]').should('not.exist');
    });

    it('should show category dropdown only when role is player', () => {
      cy.get('[data-testid="new-user-button"]').click();

      cy.get('[data-testid="role-select"]').should('have.value', 'player');
      cy.get('[data-testid="category-select"]').should('be.visible');

      cy.get('[data-testid="role-select"]').select('admin');
      cy.get('[data-testid="category-select"]').should('not.exist');

      cy.get('[data-testid="role-select"]').select('player');
      cy.get('[data-testid="category-select"]').should('be.visible');
    });

    it('should create a user and add it to the list', () => {
      const newUser = {
        id: 'u3',
        email: 'new@cec.com',
        role: 'player',
        firstName: 'New',
        lastName: 'User',
        categoryId: 'cat-1',
      };

      cy.intercept('POST', '**/api/users', {
        statusCode: 201,
        body: { user: newUser },
      }).as('createUser');

      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="first-name-input"]').type('New');
      cy.get('[data-testid="last-name-input"]').type('User');
      cy.get('[data-testid="email-input"]').type('new@cec.com');
      cy.get('[data-testid="password-input"]').type('pass123');
      cy.get('[data-testid="role-select"]').select('player');
      cy.get('[data-testid="category-select"]').select('Sub 14');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@createUser');
      cy.get('[data-testid="user-form"]').should('not.exist');
      cy.get('[data-testid="user-row"]').should('have.length', 3);
    });

    it('should show error on duplicate email (409)', () => {
      cy.intercept('POST', '**/api/users', {
        statusCode: 409,
        body: { error: 'Email already exists' },
      }).as('createUser');

      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="first-name-input"]').type('Dup');
      cy.get('[data-testid="last-name-input"]').type('User');
      cy.get('[data-testid="email-input"]').type('admin@cec.com');
      cy.get('[data-testid="password-input"]').type('pass123');
      cy.get('[data-testid="role-select"]').select('admin');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@createUser');
      cy.get('[data-testid="form-error"]')
        .should('be.visible')
        .and('contain.text', 'Email already exists');
      cy.get('[data-testid="user-form"]').should('be.visible');
    });

    it('should disable submit button when required fields are empty', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="submit-button"]').should('be.disabled');
    });
  });

  describe('Player — navigation restrictions', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/players?categoryId=cat-1', {
        statusCode: 200,
        body: { data: mockPlayers, category: mockCategories[0] },
      });
    });

    it('should NOT show Admin nav link for player users', () => {
      cy.visit('/dashboard');
      cy.viewport(1024, 768);
      cy.get('[data-testid="nav-bar"]').should('be.visible');
      cy.get('[data-testid="admin-nav-link"]').should('not.exist');
    });

    it('should redirect player from /admin/users to /dashboard', () => {
      cy.visit('/admin/users');
      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/admin');
    });
  });

  describe('Player — filtered dashboard', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/players?categoryId=cat-1', {
        statusCode: 200,
        body: { data: mockPlayers, category: mockCategories[0] },
      });
    });

    it('should only show one chart card for the player category', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="chart-card"]').should('have.length', 1);
      cy.get('[data-testid="chart-title"]').should('contain.text', 'Sub 14');
    });
  });

  describe('Player — filtered players list', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/players?categoryId=cat-1', {
        statusCode: 200,
        body: { data: mockPlayers, category: mockCategories[0] },
      });
    });

    it('should not show category selector for player role', () => {
      cy.visit('/players');
      cy.get('[data-testid="category-select"]').should('not.exist');
    });

    it('should display players for the player own category', () => {
      cy.visit('/players');
      cy.get('[data-testid="player-row"]').should('have.length', 2);
      cy.get('[data-testid="player-row"]').first().should('contain.text', 'Alvarez');
    });
  });
});
