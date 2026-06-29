describe('SCRUM-42 Rename frontend fee files to payments', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
  ];

  const mockFee = {
    id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
    periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
    type: 'match',
    playerFees: [
      { id: 'pf-1', feeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  };

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    cy.intercept('GET', '**/api/players*', { statusCode: 200, body: { data: [], category: mockCategories[0] } });
    cy.intercept('GET', '**/api/fixture/divisions', { statusCode: 200, body: { data: [] } });
    cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
    cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFee] } }).as('getPayments');
  });

  describe('Player payments route loads correctly after rename', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
    });

    it('should load the player payments page at /payments', () => {
      cy.visit('/payments');
      cy.wait('@getPayments');
      cy.get('[data-testid="fee-row"]').should('be.visible');
      cy.get('[data-testid="fee-amount"]').should('contain.text', '300');
    });

    it('should NOT serve anything at old /fees route', () => {
      cy.visit('/fees', { failOnStatusCode: false });
      cy.url().should('not.include', '/fees');
    });
  });

  describe('Admin payments route loads correctly after rename', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('should load the admin payments page at /admin/payments', () => {
      cy.visit('/admin/payments');
      cy.wait('@getPayments');
      cy.get('[data-testid="fee-card"]').should('have.length.at.least', 1);
    });

    it('should NOT serve anything at old /admin/fees route', () => {
      cy.visit('/admin/fees', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin/fees');
    });
  });

  describe('Navigation to payments works from dashboard', () => {
    it('should navigate to /payments from dashboard link', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getPayments');
      cy.visit('/dashboard');
      cy.get('a[href="/payments"]').first().click();
      cy.url().should('include', '/payments');
    });
  });
});
