describe('SCRUM-23: Captain MP OAuth flow', () => {
  describe('Captain fees page — MP not connected', () => {
    beforeEach(() => {
      cy.loginAsCaptain();
      cy.intercept('GET', '**/api/fees', {
        statusCode: 200,
        body: {
          data: [{
            id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
            totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
            weekStartDate: '2026-06-15', createdBy: 'admin-1',
            createdAt: '2026-06-15T00:00:00Z',
            playerFees: [
              { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'captain-1', playerName: 'Captain, One', status: 'pending', paidAt: null },
            ],
            paidCount: 0, unpaidCount: 1,
          }],
        },
      });
      cy.intercept('GET', '**/api/mp/status', {
        statusCode: 200,
        body: { connected: false },
      });
      cy.intercept('GET', '**/api/fixture/matches', { statusCode: 200, body: [] });
      cy.visit('/fees');
    });

    it('should show Connect Mercado Pago button', () => {
      cy.get('[data-testid="mp-connect-button"]').should('exist');
      cy.get('[data-testid="mp-connect-button"]').should('contain.text', 'Connect Mercado Pago');
    });

    it('should not show connected status', () => {
      cy.get('[data-testid="mp-connected-status"]').should('not.exist');
    });

    it('should redirect to MP OAuth when connect is clicked', () => {
      cy.intercept('GET', '**/api/mp/auth-url', {
        statusCode: 200,
        body: { url: 'https://auth.mercadopago.com/authorization?client_id=123&state=captain-1' },
      }).as('getAuthUrl');

      cy.get('[data-testid="mp-connect-button"]').click();
      cy.wait('@getAuthUrl');
    });
  });

  describe('Captain fees page — MP already connected', () => {
    beforeEach(() => {
      cy.loginAsCaptain();
      cy.intercept('GET', '**/api/fees', {
        statusCode: 200,
        body: {
          data: [{
            id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
            totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
            weekStartDate: '2026-06-15', createdBy: 'admin-1',
            createdAt: '2026-06-15T00:00:00Z',
            playerFees: [
              { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'captain-1', playerName: 'Captain, One', status: 'pending', paidAt: null },
            ],
            paidCount: 0, unpaidCount: 1,
          }],
        },
      });
      cy.intercept('GET', '**/api/mp/status', {
        statusCode: 200,
        body: { connected: true, updatedAt: '2026-06-20T10:00:00Z' },
      });
      cy.intercept('GET', '**/api/fixture/matches', { statusCode: 200, body: [] });
      cy.visit('/fees');
    });

    it('should show Mercado Pago connected status', () => {
      cy.get('[data-testid="mp-connected-status"]').should('exist');
      cy.get('[data-testid="mp-connected-status"]').should('contain.text', 'Mercado Pago connected');
    });

    it('should show reconnect button', () => {
      cy.get('[data-testid="mp-reconnect-button"]').should('exist');
    });

    it('should not show Connect button', () => {
      cy.get('[data-testid="mp-connect-button"]').should('not.exist');
    });
  });

  describe('MP callback page', () => {
    beforeEach(() => {
      cy.loginAsCaptain();
    });

    it('should show success and redirect after valid callback', () => {
      cy.intercept('GET', '**/api/mp/callback?code=TG-valid-code', {
        statusCode: 200,
        body: { success: true, message: 'Mercado Pago connected successfully' },
      }).as('mpCallback');

      cy.visit('/mp/callback?code=TG-valid-code');
      cy.wait('@mpCallback');
      cy.get('[data-testid="mp-callback-success"]').should('exist');
      cy.get('[data-testid="mp-callback-success"]').should('contain.text', 'connected');
    });

    it('should show error when no code is provided', () => {
      cy.visit('/mp/callback');
      cy.get('[data-testid="mp-callback-error"]').should('exist');
      cy.get('[data-testid="mp-callback-error"]').should('contain.text', 'cancelled');
    });

    it('should show error when callback fails', () => {
      cy.intercept('GET', '**/api/mp/callback*', {
        statusCode: 500,
        body: { error: 'Failed to exchange OAuth code' },
      }).as('mpCallback');

      cy.visit('/mp/callback?code=invalid-code');
      cy.wait('@mpCallback');
      cy.get('[data-testid="mp-callback-error"]').should('exist');
    });
  });

  describe('Player fees page — payments not configured', () => {
    beforeEach(() => {
      cy.loginAsPlayer();
      cy.intercept('GET', '**/api/fees', {
        statusCode: 200,
        body: {
          data: [{
            id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
            totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
            weekStartDate: '2026-06-15', createdBy: 'admin-1',
            createdAt: '2026-06-15T00:00:00Z',
            playerFees: [
              { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'player-1', playerName: 'Player, One', status: 'pending', paidAt: null },
            ],
            paidCount: 0, unpaidCount: 1,
          }],
        },
      });
      cy.intercept('GET', '**/api/fixture/matches', { statusCode: 200, body: [] });
      cy.visit('/fees');
    });

    it('should not show MP connection UI for players', () => {
      cy.get('[data-testid="mp-connect-button"]').should('not.exist');
      cy.get('[data-testid="mp-connected-status"]').should('not.exist');
    });
  });
});
