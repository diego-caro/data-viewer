describe('SCRUM-16 Mercado Pago Integration + Player Payment Flow', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
    { id: 'cat-2', name: 'Sub 16' },
  ];

  const mockFeeWithPendingPlayer = [
    {
      id: 'fee-1',
      categoryId: 'cat-1',
      categoryName: 'Sub 14',
      totalAmount: 3000,
      availablePlayers: 10,
      perPlayerAmount: 300,
      weekStartDate: '2026-06-15',
      createdBy: 'admin-1',
      createdAt: '2026-06-15T00:00:00Z',
      playerFees: [
        { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
        { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'u-other', playerName: 'Two, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
      ],
      paidCount: 1,
      unpaidCount: 1,
    },
  ];

  const mockFeeWithPaidPlayer = [
    {
      ...mockFeeWithPendingPlayer[0],
      playerFees: [
        { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-17T14:00:00Z' },
        { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'u-other', playerName: 'Two, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
      ],
      paidCount: 2,
      unpaidCount: 0,
    },
  ];

  const mockPaymentPreference = {
    preferenceId: 'pref-123',
    initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
    sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
  };

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
  });

  describe('Player — Fees page with pending fee', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: mockFeeWithPendingPlayer } }).as('getFees');
      cy.visit('/payments');
      cy.wait('@getFees');
    });

    it('should display fee amount and category name', () => {
      cy.get('[data-testid="fee-category"]').should('contain.text', 'Sub 14');
      cy.get('[data-testid="fee-amount"]').should('contain.text', '300');
    });

    it('should show Pay button for pending fee', () => {
      cy.get('[data-testid="pay-fee-button"]')
        .should('be.visible')
        .and('contain.text', 'Pay with Mercado Pago');
    });

    it('should not show paid badge when fee is pending', () => {
      cy.get('[data-testid="paid-badge"]').should('not.exist');
    });

    it('should call pay API and open Mercado Pago link when Pay is clicked', () => {
      cy.intercept('POST', '**/api/payments/pay', {
        statusCode: 200,
        body: mockPaymentPreference,
      }).as('payFee');

      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      cy.get('[data-testid="pay-fee-button"]').click();
      cy.wait('@payFee');

      cy.get('@windowOpen').should('have.been.calledWith', mockPaymentPreference.initPoint, '_blank');
    });

    it('should show processing state while paying', () => {
      cy.intercept('POST', '**/api/payments/pay', {
        statusCode: 200,
        body: mockPaymentPreference,
        delay: 500,
      }).as('payFeeDelayed');

      cy.window().then((win) => {
        cy.stub(win, 'open');
      });

      cy.get('[data-testid="pay-fee-button"]').click();
      cy.get('[data-testid="pay-fee-button"]')
        .should('contain.text', 'Processing...')
        .and('be.disabled');
    });

    it('should show error message when payment fails', () => {
      cy.intercept('POST', '**/api/payments/pay', {
        statusCode: 500,
        body: { error: 'Payment configuration not available' },
      }).as('payFeeFail');

      cy.get('[data-testid="pay-fee-button"]').click();
      cy.wait('@payFeeFail');

      cy.get('[data-testid="pay-error"]')
        .should('be.visible')
        .and('contain.text', 'Payment could not be initiated');
    });
  });

  describe('Player — Fees page with paid fee', () => {
    beforeEach(() => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: mockFeeWithPaidPlayer } }).as('getFees');
      cy.visit('/payments');
      cy.wait('@getFees');
    });

    it('should show green Paid badge instead of Pay button', () => {
      cy.get('[data-testid="paid-badge"]')
        .should('be.visible')
        .and('contain.text', 'Paid');
      cy.get('[data-testid="pay-fee-button"]').should('not.exist');
    });
  });

  describe('Player — No fees configured', () => {
    it('should show empty state when no fees exist for the category', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getFees');
      cy.visit('/payments');
      cy.wait('@getFees');

      cy.get('[data-testid="empty-state"]')
        .should('be.visible')
        .and('contain.text', 'No fees configured');
    });
  });

  describe('Player — Navigation', () => {
    it('should navigate to fees page via My Fees nav link', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: mockFeeWithPendingPlayer } }).as('getFees');
      cy.intercept('GET', '**/api/players*', {
        statusCode: 200,
        body: { data: [], category: mockCategories[0] },
      });
      cy.visit('/dashboard');
      cy.viewport(1024, 768);
      cy.get('[data-testid="nav-link"]').contains('My Fees').click();
      cy.url().should('include', '/fees');
      cy.wait('@getFees');
      cy.get('[data-testid="fee-amount"]').should('be.visible');
    });
  });

  describe('Error state — Fees page', () => {
    it('should show error when fees API fails', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 500, body: { error: 'Server error' } }).as('failFees');
      cy.visit('/payments');
      cy.wait('@failFees');
      cy.get('[data-testid="error-state"]')
        .should('be.visible')
        .and('contain.text', 'Unable to load fee data');
    });
  });
});
