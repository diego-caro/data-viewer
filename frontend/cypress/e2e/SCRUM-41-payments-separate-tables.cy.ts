describe('SCRUM-41 Payments — Rename Fees to Payments, 3 fee types', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
    { id: 'cat-2', name: 'Sub 16' },
  ];

  const mockDivisions = [{ id: 206752, name: 'Mixto Sub 14 A' }];

  function createAwayMatch(): object {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return {
      id: 1, status: 'pending', date: date.toISOString(),
      venue: 'Rival Stadium', round: 1,
      homeTeam: { clubId: 99, clubName: 'Rival FC' },
      awayTeam: { clubId: 1, clubName: 'Club Empleados de Comercio' },
      score: null,
    };
  }

  const mockMatchFee = {
    id: 'mf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
    periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
    type: 'match',
    playerFees: [
      { id: 'pf-1', feeId: 'mf-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  };

  const mockLeagueFee = {
    id: 'lf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 2000, availablePlayers: 10, perPlayerAmount: 200,
    periodStartDate: '2026-06-01', createdBy: 'admin-1', createdAt: '2026-06-01T00:00:00Z',
    type: 'league',
    playerFees: [
      { id: 'lpf-1', feeId: 'lf-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  };

  const mockTravelFee = {
    id: 'tf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 1500, availablePlayers: 10, perPlayerAmount: 150,
    periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
    type: 'travel',
    playerFees: [
      { id: 'tpf-1', feeId: 'tf-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  };

  const mockMatchPaid = {
    ...mockMatchFee,
    playerFees: [
      { id: 'pf-1', feeId: 'mf-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23T10:00:00Z' },
    ],
    paidCount: 1, unpaidCount: 0,
  };

  const mockLeaguePaid = {
    ...mockLeagueFee,
    playerFees: [
      { id: 'lpf-1', feeId: 'lf-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23T10:30:00Z' },
    ],
    paidCount: 1, unpaidCount: 0,
  };

  const mockTravelPaid = {
    ...mockTravelFee,
    playerFees: [
      { id: 'tpf-1', feeId: 'tf-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23T11:00:00Z' },
    ],
    paidCount: 1, unpaidCount: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    cy.intercept('GET', '**/api/players*', { statusCode: 200, body: { data: [], category: mockCategories[0] } });
    cy.intercept('GET', '**/api/fixture/divisions', { statusCode: 200, body: { data: mockDivisions } });
  });

  describe('AC1: Navigation shows "Payments" instead of "Fees"', () => {
    it('should show "Payments" in admin nav', () => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } });
      cy.visit('/admin/payments');

      cy.get('[data-testid="admin-nav-link"]').should('contain.text', 'Payments');
    });

    it('should show "My Payments" in player nav', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } });
      cy.visit('/payments');

      cy.get('[data-testid="nonAdmin-nav-link"]').should('contain.text', 'My Payments');
    });
  });

  describe('AC2: Admin page has 3 tabs — Match Fee, League Fee, Travel', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee, mockLeagueFee, mockTravelFee] } }).as('getPayments');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
      cy.visit('/admin/payments');
      cy.wait('@getPayments');
    });

    it('should render all three tab buttons', () => {
      cy.get('[data-testid="tab-match"]').should('be.visible').and('contain.text', 'Match Fee');
      cy.get('[data-testid="tab-league"]').should('be.visible').and('contain.text', 'League Fee');
      cy.get('[data-testid="tab-travel"]').should('be.visible').and('contain.text', 'Travel');
    });

    it('should default to match tab showing match fee cards', () => {
      cy.get('[data-testid="fee-card"]').should('have.length', 1);
      cy.get('[data-testid="fee-category-name"]').should('contain.text', 'Sub 14');
    });

    it('should switch to league tab and show league fee cards', () => {
      cy.get('[data-testid="tab-league"]').click();
      cy.get('[data-testid="fee-card"]').should('have.length', 1);
      cy.get('[data-testid="fee-category-name"]').should('contain.text', 'Sub 14');
    });

    it('should switch to travel tab and show travel fee cards', () => {
      cy.get('[data-testid="tab-travel"]').click();
      cy.get('[data-testid="fee-card"]').should('have.length', 1);
      cy.get('[data-testid="away-badge"]').should('be.visible');
    });
  });

  describe('AC3: Player page shows match, league, and travel fee rows', () => {
    describe('all three fees pending', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee, mockLeagueFee, mockTravelFee] } }).as('getPayments');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
        cy.visit('/payments');
        cy.wait('@getPayments');
      });

      it('should show match fee row with amount and pay button', () => {
        cy.get('[data-testid="fee-row"]').should('be.visible');
        cy.get('[data-testid="fee-amount"]').should('contain.text', '300');
        cy.get('[data-testid="pay-fee-button"]').should('be.visible');
      });

      it('should show league fee row with amount and pay button', () => {
        cy.get('[data-testid="league-row"]').should('be.visible');
        cy.get('[data-testid="league-amount"]').should('contain.text', '200');
        cy.get('[data-testid="pay-league-button"]').should('be.visible');
      });

      it('should show travel fee row with amount and pay button', () => {
        cy.get('[data-testid="travel-row"]').should('be.visible');
        cy.get('[data-testid="travel-amount"]').should('contain.text', '150');
        cy.get('[data-testid="pay-travel-button"]').should('be.visible');
      });

      it('should show Pay All button with combined total', () => {
        cy.get('[data-testid="pay-all-row"]').should('be.visible');
        cy.get('[data-testid="total-amount"]').should('contain.text', '650');
        cy.get('[data-testid="pay-all-button"]').should('be.visible');
      });
    });

    describe('match paid, league + travel pending', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchPaid, mockLeagueFee, mockTravelFee] } }).as('getPayments');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
        cy.visit('/payments');
        cy.wait('@getPayments');
      });

      it('should show paid badge for match and pay buttons for league and travel', () => {
        cy.get('[data-testid="fee-status-paid"]').should('be.visible');
        cy.get('[data-testid="pay-league-button"]').should('be.visible');
        cy.get('[data-testid="pay-travel-button"]').should('be.visible');
      });

      it('should show Pay All with 2 pending items total', () => {
        cy.get('[data-testid="pay-all-row"]').should('be.visible');
        cy.get('[data-testid="total-amount"]').should('contain.text', '350');
      });
    });

    describe('all three paid', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchPaid, mockLeaguePaid, mockTravelPaid] } }).as('getPayments');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
        cy.visit('/payments');
        cy.wait('@getPayments');
      });

      it('should show paid badge and no pay buttons', () => {
        cy.get('[data-testid="paid-badge"]').should('be.visible');
        cy.get('[data-testid="pay-fee-button"]').should('not.exist');
        cy.get('[data-testid="pay-league-button"]').should('not.exist');
        cy.get('[data-testid="pay-travel-button"]').should('not.exist');
        cy.get('[data-testid="pay-all-button"]').should('not.exist');
      });
    });

    describe('only match fee (no league or travel)', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee] } }).as('getPayments');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
        cy.visit('/payments');
        cy.wait('@getPayments');
      });

      it('should show only match row, no league or travel rows', () => {
        cy.get('[data-testid="fee-row"]').should('be.visible');
        cy.get('[data-testid="league-row"]').should('not.exist');
        cy.get('[data-testid="travel-row"]').should('not.exist');
      });

      it('should not show Pay All when only one item is pending', () => {
        cy.get('[data-testid="pay-all-button"]').should('not.exist');
      });
    });
  });

  describe('AC4: Dashboard pills show Match, League, and Travel status', () => {
    describe('all three fees paid — player is enabled', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchPaid, mockLeaguePaid, mockTravelPaid] } }).as('getPayments');
        cy.visit('/dashboard');
        cy.wait('@getPayments');
      });

      it('should show enabled status', () => {
        cy.get('[data-testid="play-status-enabled"]')
          .should('be.visible')
          .and('contain.text', "You're enabled to play this weekend");
      });

      it('should show match, league, and travel paid pills', () => {
        cy.get('[data-testid="match-pill"]').should('contain.text', 'Match: Paid');
        cy.get('[data-testid="league-pill"]').should('contain.text', 'League: Paid');
        cy.get('[data-testid="travel-pill"]').should('contain.text', 'Travel: Paid');
      });
    });

    describe('league pending — player is not enabled', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchPaid, mockLeagueFee, mockTravelPaid] } }).as('getPayments');
        cy.visit('/dashboard');
        cy.wait('@getPayments');
      });

      it('should show not-enabled status', () => {
        cy.get('[data-testid="play-status-not-enabled"]')
          .should('be.visible')
          .and('contain.text', "you're not enabled to play this weekend");
      });

      it('should show league pending pill', () => {
        cy.get('[data-testid="match-pill"]').should('contain.text', 'Match: Paid');
        cy.get('[data-testid="league-pill"]').should('contain.text', 'League: Pending');
        cy.get('[data-testid="travel-pill"]').should('contain.text', 'Travel: Paid');
      });
    });

    describe('no fees configured', () => {
      it('should show no-fee status without pills', () => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getPayments');
        cy.visit('/dashboard');
        cy.wait('@getPayments');

        cy.get('[data-testid="play-status-no-fee"]').should('be.visible');
        cy.get('[data-testid="status-pills"]').should('not.exist');
      });
    });

    describe('not-enabled shows link to /payments', () => {
      it('should link to /payments page', () => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee] } }).as('getPayments');
        cy.visit('/dashboard');
        cy.wait('@getPayments');

        cy.get('[data-testid="play-status-not-enabled"]')
          .find('a[href="/payments"]')
          .should('contain.text', 'Go to My Payments');
      });
    });
  });

  describe('AC5: API routes use /api/payments/*', () => {
    it('should call /api/payments endpoint (not /api/fees)', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee] } }).as('getPayments');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: [] } }).as('getOldFees');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
      cy.visit('/payments');
      cy.wait('@getPayments');

      cy.get('@getOldFees.all').should('have.length', 0);
    });
  });

  describe('AC6: Admin can configure league fee via form', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee] } }).as('getPayments');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
      cy.visit('/admin/payments');
      cy.wait('@getPayments');
    });

    it('should show unconfigured categories on league tab', () => {
      cy.get('[data-testid="tab-league"]').click();
      cy.get('[data-testid="configure-category-button"]').should('exist');
    });

    it('should open form with league title when configuring on league tab', () => {
      cy.get('[data-testid="tab-league"]').click();
      cy.get('[data-testid="configure-category-button"]').first().click();
      cy.get('[data-testid="fee-form"]').should('be.visible');
    });
  });

  describe('AC7: Empty state — no payments for the period', () => {
    it('should show empty state on player page when no fees exist', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getPayments');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
      cy.visit('/payments');
      cy.wait('@getPayments');

      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.get('[data-testid="fee-row"]').should('not.exist');
      cy.get('[data-testid="league-row"]').should('not.exist');
      cy.get('[data-testid="travel-row"]').should('not.exist');
    });
  });

  describe('Edge case: Warning banners for pending fees', () => {
    it('should show match and league warnings when both are pending with upcoming match', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchFee, mockLeagueFee] } }).as('getPayments');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
      cy.visit('/payments');
      cy.wait('@getPayments');

      cy.get('[data-testid="warning-banner"]').should('be.visible');
    });

    it('should not show warning when all fees are paid', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockMatchPaid, mockLeaguePaid] } }).as('getPayments');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
      cy.visit('/payments');
      cy.wait('@getPayments');

      cy.get('[data-testid="warning-banner"]').should('not.exist');
    });
  });
});
