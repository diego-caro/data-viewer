describe('SCRUM-15 Fee Data Model + Captain Role + Admin Fees Page', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
    { id: 'cat-2', name: 'Sub 16' },
    { id: 'cat-3', name: 'Sub 19' },
    { id: 'cat-4', name: 'Primera' },
    { id: 'cat-5', name: 'Intermedia' },
    { id: 'cat-6', name: 'Caballeros' },
  ];

  const mockFees = [
    {
      id: 'fee-1',
      categoryId: 'cat-1',
      categoryName: 'Sub 14',
      totalAmount: 30000,
      availablePlayers: 10,
      perPlayerAmount: 3000,
      weekStartDate: '2026-06-15',
      createdBy: 'user-1',
      createdAt: '2026-06-15T10:00:00Z',
      playerFees: [
        { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'u-10', playerName: 'Alvarez, Mateo', status: 'paid', paidAt: '2026-06-16T12:00:00Z' },
        { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'u-11', playerName: 'Castro, Lucas', status: 'pending', paidAt: null },
      ],
      paidCount: 1,
      unpaidCount: 1,
    },
    {
      id: 'fee-2',
      categoryId: 'cat-2',
      categoryName: 'Sub 16',
      totalAmount: 40000,
      availablePlayers: 8,
      perPlayerAmount: 5000,
      weekStartDate: '2026-06-15',
      createdBy: 'user-1',
      createdAt: '2026-06-15T10:00:00Z',
      playerFees: [],
      paidCount: 0,
      unpaidCount: 0,
    },
  ];

  const mockUsers = [
    { id: 'u1', email: 'admin@cec.com', role: 'admin', firstName: 'Admin', lastName: 'CEC', categoryId: null },
    { id: 'u2', email: 'player@cec.com', role: 'player', firstName: 'Player', lastName: 'One', categoryId: 'cat-1' },
    { id: 'u3', email: 'captain@cec.com', role: 'captain', firstName: 'Captain', lastName: 'One', categoryId: 'cat-1' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Admin — Fees page', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFees } }).as('getFees');
      cy.visit('/admin/fees');
      cy.wait('@getFees');
    });

    it('should display fee cards with total, players, per-player amount, and paid/unpaid count', () => {
      cy.get('[data-testid="fee-card"]').should('have.length', 2);

      cy.get('[data-testid="fee-card"]').first().within(() => {
        cy.get('[data-testid="fee-category-name"]').should('contain.text', 'Sub 14');
        cy.contains('$30,000');
        cy.contains('10');
        cy.contains('$3,000.00');
        cy.contains('1').should('exist');
      });

      cy.get('[data-testid="fee-card"]').eq(1).within(() => {
        cy.get('[data-testid="fee-category-name"]').should('contain.text', 'Sub 16');
      });
    });

    it('should show unconfigured categories as buttons', () => {
      cy.get('[data-testid="configure-category-button"]').should('have.length', 4);
      cy.get('[data-testid="configure-category-button"]').first().should('contain.text', 'Sub 19');
    });

    it('should open config form when clicking Configure on unconfigured category', () => {
      cy.get('[data-testid="fee-form"]').should('not.exist');
      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="fee-form"]').should('be.visible');
      cy.get('[data-testid="total-amount-input"]').should('be.visible');
      cy.get('[data-testid="available-players-input"]').should('be.visible');
      cy.get('[data-testid="per-player-preview"]').should('be.visible');
    });

    it('should open config form when clicking Edit on configured fee', () => {
      cy.get('[data-testid="edit-fee-button"]').first().click();
      cy.get('[data-testid="fee-form"]').should('be.visible');
    });

    it('should calculate per-player amount in real time', () => {
      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="total-amount-input"]').clear().type('10000');
      cy.get('[data-testid="available-players-input"]').clear().type('4');
      cy.get('[data-testid="per-player-preview"]').should('contain.text', '2,500.00');
    });

    it('should submit fee config and refresh the list', () => {
      const newFee = {
        id: 'fee-new',
        categoryId: 'cat-3',
        categoryName: 'Sub 19',
        totalAmount: 20000,
        availablePlayers: 5,
        perPlayerAmount: 4000,
        weekStartDate: '2026-06-15',
        createdBy: 'user-1',
        createdAt: '2026-06-15T10:00:00Z',
        playerFees: [],
        paidCount: 0,
        unpaidCount: 0,
      };

      cy.intercept('POST', '**/api/fees', {
        statusCode: 201,
        body: { fee: newFee },
      }).as('createFee');

      cy.intercept('GET', '**/api/fees', {
        statusCode: 200,
        body: { data: [...mockFees, newFee] },
      }).as('refreshFees');

      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="total-amount-input"]').clear().type('20000');
      cy.get('[data-testid="available-players-input"]').clear().type('5');
      cy.get('[data-testid="submit-fee-button"]').click();

      cy.wait('@createFee');
      cy.get('[data-testid="fee-form"]').should('not.exist');
      cy.get('[data-testid="fee-card"]').should('have.length', 3);
    });

    it('should close form when Cancel is clicked', () => {
      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="fee-form"]').should('be.visible');
      cy.get('[data-testid="cancel-fee-button"]').click();
      cy.get('[data-testid="fee-form"]').should('not.exist');
    });

    it('should disable submit when amounts are zero', () => {
      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="total-amount-input"]').clear().type('0');
      cy.get('[data-testid="available-players-input"]').clear().type('0');
      cy.get('[data-testid="submit-fee-button"]').should('be.disabled');
    });

    it('should show player fees table with status badges and Mark Paid button', () => {
      cy.get('[data-testid="fee-card"]').first().within(() => {
        cy.get('[data-testid="player-fee-row"]').should('have.length', 2);

        cy.get('[data-testid="player-fee-row"]').first().within(() => {
          cy.contains('Alvarez, Mateo');
          cy.contains('paid');
          cy.get('[data-testid="mark-paid-button"]').should('not.exist');
        });

        cy.get('[data-testid="player-fee-row"]').last().within(() => {
          cy.contains('Castro, Lucas');
          cy.contains('pending');
          cy.get('[data-testid="mark-paid-button"]').should('be.visible');
        });
      });
    });

    it('should mark a player as paid when clicking Mark Paid', () => {
      const updatedFees = JSON.parse(JSON.stringify(mockFees));
      updatedFees[0].playerFees[1].status = 'paid';
      updatedFees[0].playerFees[1].paidAt = '2026-06-17T14:00:00Z';
      updatedFees[0].paidCount = 2;
      updatedFees[0].unpaidCount = 0;

      cy.intercept('POST', '**/api/fees/mark-paid', {
        statusCode: 200,
        body: { playerFee: updatedFees[0].playerFees[1] },
      }).as('markPaid');

      cy.intercept('GET', '**/api/fees', {
        statusCode: 200,
        body: { data: updatedFees },
      }).as('refreshAfterPaid');

      cy.get('[data-testid="fee-card"]').first().within(() => {
        cy.get('[data-testid="mark-paid-button"]').click();
      });

      cy.wait('@markPaid');
    });

    it('should show form error on API failure', () => {
      cy.intercept('POST', '**/api/fees', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('failCreate');

      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="total-amount-input"]').clear().type('10000');
      cy.get('[data-testid="available-players-input"]').clear().type('5');
      cy.get('[data-testid="submit-fee-button"]').click();

      cy.wait('@failCreate');
      cy.get('[data-testid="form-error"]')
        .should('be.visible')
        .and('contain.text', 'Failed to save fee configuration');
    });
  });

  describe('Admin — Fees nav link', () => {
    it('should show Fees link in admin navigation', () => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: [] } });
      cy.visit('/admin/fees');
      cy.viewport(1024, 768);
      cy.get('[data-testid="admin-nav-link"]').should('have.length', 2);
      cy.get('[data-testid="admin-nav-link"]').last().should('contain.text', 'Fees');
    });
  });

  describe('Admin — Captain role in user management', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/users', { statusCode: 200, body: { data: mockUsers } }).as('getUsers');
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.visit('/admin/users');
      cy.wait('@getUsers');
    });

    it('should display captain role badge in users table', () => {
      cy.get('[data-testid="user-row"]').eq(2).within(() => {
        cy.get('[data-testid="role-badge"]').should('contain.text', 'captain');
      });
    });

    it('should show Captain option in role dropdown', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="role-select"]').find('option').should('have.length', 3);
      cy.get('[data-testid="role-select"]').find('option[value="captain"]').should('exist');
    });

    it('should show category dropdown when captain role is selected', () => {
      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="role-select"]').select('captain');
      cy.get('[data-testid="category-select"]').should('be.visible');
    });

    it('should create a captain user', () => {
      const newCaptain = {
        id: 'u4',
        email: 'captain2@cec.com',
        role: 'captain',
        firstName: 'Cap',
        lastName: 'Two',
        categoryId: 'cat-2',
      };

      cy.intercept('POST', '**/api/users', {
        statusCode: 201,
        body: { user: newCaptain },
      }).as('createCaptain');

      cy.get('[data-testid="new-user-button"]').click();
      cy.get('[data-testid="first-name-input"]').type('Cap');
      cy.get('[data-testid="last-name-input"]').type('Two');
      cy.get('[data-testid="email-input"]').type('captain2@cec.com');
      cy.get('[data-testid="password-input"]').type('pass123');
      cy.get('[data-testid="role-select"]').select('captain');
      cy.get('[data-testid="category-select"]').select('Sub 16');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@createCaptain');
      cy.get('[data-testid="user-form"]').should('not.exist');
      cy.get('[data-testid="user-row"]').should('have.length', 4);
    });
  });

  describe('Captain — navigation and access', () => {
    beforeEach(() => {
      cy.loginAsCaptain('cat-1');
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/players?categoryId=cat-1', {
        statusCode: 200,
        body: {
          data: [
            { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1' },
          ],
          category: mockCategories[0],
        },
      });
    });

    it('should NOT show Admin nav links for captain users', () => {
      cy.visit('/dashboard');
      cy.viewport(1024, 768);
      cy.get('[data-testid="nav-bar"]').should('be.visible');
      cy.get('[data-testid="admin-nav-link"]').should('not.exist');
    });

    it('should redirect captain from /admin/fees to /dashboard', () => {
      cy.visit('/admin/fees');
      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/admin');
    });
  });

  describe('Error state — Fees page', () => {
    it('should show error message when fees API fails', () => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
      cy.intercept('GET', '**/api/fees', { statusCode: 500, body: { error: 'Server error' } }).as('failFees');
      cy.visit('/admin/fees');
      cy.wait('@failFees');
      cy.get('[data-testid="error-state"]').should('be.visible');
    });
  });
});
