describe('SCRUM-38 Travel Fee for Away Matches', () => {
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

  function createLocalMatch(): object {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return {
      id: 1, status: 'pending', date: date.toISOString(),
      venue: 'CEC Stadium', round: 1,
      homeTeam: { clubId: 1, clubName: 'Club Empleados de Comercio' },
      awayTeam: { clubId: 99, clubName: 'Rival FC' },
      score: null,
    };
  }

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

  const mockTravel = {
    id: 'travel-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 1500, availablePlayers: 10, perPlayerAmount: 150,
    periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
    type: 'travel',
    playerFees: [
      { id: 'tpf-1', feeId: 'travel-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  };

  const mockFeePaid = {
    ...mockFee,
    playerFees: [
      { id: 'pf-1', feeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23T10:00:00Z' },
    ],
    paidCount: 1, unpaidCount: 0,
  };

  const mockTravelPaid = {
    ...mockTravel,
    playerFees: [
      { id: 'tpf-1', feeId: 'travel-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23T11:00:00Z' },
    ],
    paidCount: 1, unpaidCount: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    cy.intercept('GET', '**/api/players*', { statusCode: 200, body: { data: [], category: mockCategories[0] } });
    cy.intercept('GET', '**/api/fixture/divisions', { statusCode: 200, body: { data: mockDivisions } });
  });

  describe('Admin Fees Page — tabs and away badge', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFee, mockTravel] } }).as('getFees');
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
      cy.visit('/admin/payments');
      cy.wait('@getFees');
    });

    it('should show Fee and Travel tabs', () => {
      cy.get('[data-testid="tab-match"]').should('be.visible');
      cy.get('[data-testid="tab-travel"]').should('be.visible');
    });

    it('should show fee cards on fee tab by default', () => {
      cy.get('[data-testid="fee-card"]').should('have.length', 1);
      cy.get('[data-testid="fee-category-name"]').should('contain.text', 'Sub 14');
    });

    it('should show travel cards and away badge when switching to travel tab', () => {
      cy.get('[data-testid="tab-travel"]').click();
      cy.get('[data-testid="fee-card"]').should('have.length', 1);
      cy.get('[data-testid="away-badge"]')
        .should('be.visible')
        .and('contain.text', 'Away');
    });

    it('should show local badge when match is home', () => {
      cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createLocalMatch()] } });
      cy.visit('/admin/payments');
      cy.wait('@getFees');

      cy.get('[data-testid="tab-travel"]').click();
      cy.get('[data-testid="away-badge"]')
        .should('be.visible')
        .and('contain.text', 'Local');
    });

    it('should not show away badge on fee tab', () => {
      cy.get('[data-testid="away-badge"]').should('not.exist');
    });
  });

  describe('Player Fees Page — breakdown card', () => {
    describe('fee + travel both pending', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFee, mockTravel] } }).as('getFees');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [createAwayMatch()] } });
        cy.visit('/payments');
        cy.wait('@getFees');
      });

      it('should show fee row with amount and pay button', () => {
        cy.get('[data-testid="fee-row"]').should('be.visible');
        cy.get('[data-testid="fee-amount"]').should('contain.text', '300');
        cy.get('[data-testid="pay-fee-button"]').should('be.visible');
      });

      it('should show travel row with amount and pay button', () => {
        cy.get('[data-testid="travel-row"]').should('be.visible');
        cy.get('[data-testid="travel-amount"]').should('contain.text', '150');
        cy.get('[data-testid="pay-travel-button"]').should('be.visible');
      });

      it('should show Pay All button with combined total', () => {
        cy.get('[data-testid="pay-all-row"]').should('be.visible');
        cy.get('[data-testid="total-amount"]').should('contain.text', '450');
        cy.get('[data-testid="pay-all-button"]').should('be.visible');
      });
    });

    describe('fee pending, travel paid', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFee, mockTravelPaid] } }).as('getFees');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
        cy.visit('/payments');
        cy.wait('@getFees');
      });

      it('should show paid badge for travel and pay button for fee', () => {
        cy.get('[data-testid="pay-fee-button"]').should('be.visible');
        cy.get('[data-testid="travel-status-paid"]').should('be.visible');
      });

      it('should not show Pay All when only one item is pending', () => {
        cy.get('[data-testid="pay-all-button"]').should('not.exist');
      });
    });

    describe('only fee (no travel — home match)', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFee] } }).as('getFees');
        cy.intercept('GET', '**/api/fixture/matches*', { statusCode: 200, body: { data: [] } });
        cy.visit('/payments');
        cy.wait('@getFees');
      });

      it('should show only fee row, no travel row', () => {
        cy.get('[data-testid="fee-row"]').should('be.visible');
        cy.get('[data-testid="travel-row"]').should('not.exist');
      });

      it('should not show Pay All button', () => {
        cy.get('[data-testid="pay-all-button"]').should('not.exist');
      });
    });
  });

  describe('Player Dashboard — status pills and eligibility', () => {
    describe('both fee and travel paid', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFeePaid, mockTravelPaid] } }).as('getFees');
        cy.visit('/dashboard');
        cy.wait('@getFees');
      });

      it('should show enabled status', () => {
        cy.get('[data-testid="play-status-enabled"]')
          .should('be.visible')
          .and('contain.text', "You're enabled to play this weekend");
      });

      it('should show fee paid pill and travel paid pill', () => {
        cy.get('[data-testid="match-pill"]').should('contain.text', 'Match: Paid');
        cy.get('[data-testid="travel-pill"]').should('contain.text', 'Travel: Paid');
      });
    });

    describe('fee paid, travel pending', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFeePaid, mockTravel] } }).as('getFees');
        cy.visit('/dashboard');
        cy.wait('@getFees');
      });

      it('should show not-enabled status when travel is pending', () => {
        cy.get('[data-testid="play-status-not-enabled"]')
          .should('be.visible')
          .and('contain.text', "you're not enabled to play this weekend");
      });

      it('should show fee paid pill and travel pending pill', () => {
        cy.get('[data-testid="match-pill"]').should('contain.text', 'Match: Paid');
        cy.get('[data-testid="travel-pill"]').should('contain.text', 'Travel: Pending');
      });
    });

    describe('only fee (home match — no travel)', () => {
      beforeEach(() => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [mockFeePaid] } }).as('getFees');
        cy.visit('/dashboard');
        cy.wait('@getFees');
      });

      it('should show only fee pill, no travel pill', () => {
        cy.get('[data-testid="match-pill"]').should('contain.text', 'Match: Paid');
        cy.get('[data-testid="travel-pill"]').should('not.exist');
      });

      it('should show enabled status with only fee paid', () => {
        cy.get('[data-testid="play-status-enabled"]').should('be.visible');
      });
    });

    describe('no fees configured', () => {
      it('should show no-fee status without pills', () => {
        cy.loginAsPlayer('cat-1');
        cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getFees');
        cy.visit('/dashboard');
        cy.wait('@getFees');

        cy.get('[data-testid="play-status-no-fee"]').should('be.visible');
        cy.get('[data-testid="status-pills"]').should('not.exist');
      });
    });
  });
});
