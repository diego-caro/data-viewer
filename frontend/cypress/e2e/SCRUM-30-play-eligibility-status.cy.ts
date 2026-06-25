describe('SCRUM-30 Play Eligibility Status Card', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
  ];

  const mockFeePaid = [{
    id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
    weekStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
    playerFees: [
      { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23T10:00:00Z' },
    ],
    paidCount: 1, unpaidCount: 0,
  }];

  const mockFeePending = [{
    id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
    weekStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
    playerFees: [
      { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  }];

  const mockFeeCaptainPaid = [{
    ...mockFeePaid[0],
    playerFees: [
      { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-3', playerName: 'One, Captain', status: 'paid', paidAt: '2026-06-23T10:00:00Z' },
    ],
  }];

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    cy.intercept('GET', '**/api/players*', {
      statusCode: 200,
      body: { data: [], category: mockCategories[0] },
    });
  });

  describe('Player — fee paid', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeePaid } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');
    });

    it('should show green enabled status card', () => {
      cy.get('[data-testid="play-status-card"]').should('be.visible');
      cy.get('[data-testid="play-status-enabled"]')
        .should('be.visible')
        .and('contain.text', "You're enabled to play this weekend");
    });

    it('should not show pending or no-fee cards', () => {
      cy.get('[data-testid="play-status-not-enabled"]').should('not.exist');
      cy.get('[data-testid="play-status-no-fee"]').should('not.exist');
    });
  });

  describe('Player — fee pending', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeePending } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');
    });

    it('should show warning status card with pending message', () => {
      cy.get('[data-testid="play-status-card"]').should('be.visible');
      cy.get('[data-testid="play-status-not-enabled"]')
        .should('be.visible')
        .and('contain.text', "you're not enabled to play this weekend");
    });

    it('should show link to fees page', () => {
      cy.get('[data-testid="play-status-not-enabled"] a')
        .should('be.visible')
        .and('contain.text', 'Go to My Fees to pay and play this weekend')
        .and('have.attr', 'href', '/fees');
    });

    it('should navigate to fees page when link is clicked', () => {
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeePending } });
      cy.get('[data-testid="play-status-not-enabled"] a').click();
      cy.url().should('include', '/fees');
    });
  });

  describe('Player — no fee configured', () => {
    it('should show informational no-fee card', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: [] } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');

      cy.get('[data-testid="play-status-card"]').should('be.visible');
      cy.get('[data-testid="play-status-no-fee"]')
        .should('be.visible')
        .and('contain.text', 'No fee configured for this week yet');
    });
  });

  describe('Captain — same behavior as player', () => {
    it('should show enabled status card when captain fee is paid', () => {
      cy.loginAsCaptain('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeeCaptainPaid } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');

      cy.get('[data-testid="play-status-enabled"]')
        .should('be.visible')
        .and('contain.text', "You're enabled to play this weekend");
    });
  });

  describe('Admin — no status card', () => {
    it('should not show play eligibility card for admin', () => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: [] } });
      cy.intercept('GET', '**/api/players*', {
        statusCode: 200,
        body: { data: [], category: mockCategories[0] },
      });
      cy.visit('/dashboard');

      cy.get('[data-testid="chart-card"]').should('have.length', 1);
      cy.get('[data-testid="play-status-card"]').should('not.exist');
    });
  });
});
