describe('SCRUM-17 Captain Dashboard + Player Warning Banner + Admin Fee Chart', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
    { id: 'cat-2', name: 'Sub 16' },
  ];

  const mockFeeWithMixedStatus = [
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
        { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-3', playerName: 'One, Captain', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
        { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'pending', paidAt: null },
        { id: 'pf-3', categoryFeeId: 'fee-1', userId: 'user-4', playerName: 'Two, Player', status: 'paid', paidAt: '2026-06-17T08:00:00Z' },
      ],
      paidCount: 2,
      unpaidCount: 1,
    },
  ];

  const mockFeeAllPaid = [
    {
      ...mockFeeWithMixedStatus[0],
      playerFees: [
        { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-2', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-17T14:00:00Z' },
      ],
      paidCount: 1,
      unpaidCount: 0,
    },
  ];

  function createMatchInDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return {
      id: 1,
      status: 'pending',
      date: date.toISOString(),
      venue: 'Stadium A',
      round: 5,
      homeTeam: { clubId: 1, clubName: 'CEC' },
      awayTeam: { clubId: 2, clubName: 'Other' },
      score: null,
    };
  }

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
  });

  describe('Captain — Fees page with player list', () => {
    beforeEach(() => {
      cy.loginAsCaptain('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeeWithMixedStatus } }).as('getFees');
      cy.intercept('GET', '**/api/fixture/matches', { statusCode: 200, body: { data: [] } });
      cy.visit('/fees');
      cy.wait('@getFees');
    });

    it('should display all players in the category with status badges', () => {
      cy.get('[data-testid="player-fee-item"]').should('have.length', 3);
      cy.get('[data-testid="player-status-paid"]').should('have.length', 2);
      cy.get('[data-testid="player-status-pending"]').should('have.length', 1);
    });

    it('should show paid/unpaid summary counts', () => {
      cy.get('[data-testid="fee-summary"]')
        .should('contain.text', 'Paid: 2')
        .and('contain.text', 'Unpaid: 1');
    });

    it('should display player names correctly', () => {
      cy.get('[data-testid="player-fee-item"]').eq(0).should('contain.text', 'One, Captain');
      cy.get('[data-testid="player-fee-item"]').eq(1).should('contain.text', 'One, Player');
    });

    it('should not show Pay button (captain sees overview, not payment)', () => {
      cy.get('[data-testid="pay-fee-button"]').should('not.exist');
    });
  });

  describe('Player — Warning banner', () => {
    it('should show warning when fee is pending and match is within 4 days', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeeWithMixedStatus } }).as('getFees');
      cy.intercept('GET', '**/api/fixture/matches', {
        statusCode: 200,
        body: { data: [createMatchInDays(2)] },
      }).as('getMatches');
      cy.visit('/fees');
      cy.wait('@getFees');
      cy.wait('@getMatches');

      cy.get('[data-testid="warning-banner"]')
        .should('be.visible')
        .and('contain.text', '300')
        .and('contain.text', '2');
    });

    it('should not show warning when fee is already paid', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeeAllPaid } }).as('getFees');
      cy.intercept('GET', '**/api/fixture/matches', {
        statusCode: 200,
        body: { data: [createMatchInDays(2)] },
      }).as('getMatches');
      cy.visit('/fees');
      cy.wait('@getFees');

      cy.get('[data-testid="warning-banner"]').should('not.exist');
    });

    it('should not show warning when next match is more than 4 days away', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: mockFeeWithMixedStatus } }).as('getFees');
      cy.intercept('GET', '**/api/fixture/matches', {
        statusCode: 200,
        body: { data: [createMatchInDays(10)] },
      }).as('getMatches');
      cy.visit('/fees');
      cy.wait('@getFees');
      cy.wait('@getMatches');

      cy.get('[data-testid="warning-banner"]').should('not.exist');
    });
  });

  describe('Admin — Dashboard fee donut charts', () => {
    const multiCategoryFees = [
      ...mockFeeWithMixedStatus,
      {
        id: 'fee-2',
        categoryId: 'cat-2',
        categoryName: 'Sub 16',
        totalAmount: 4000,
        availablePlayers: 8,
        perPlayerAmount: 500,
        weekStartDate: '2026-06-15',
        createdBy: 'admin-1',
        createdAt: '2026-06-15T00:00:00Z',
        playerFees: [],
        paidCount: 5,
        unpaidCount: 3,
      },
    ];

    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/fees', { statusCode: 200, body: { data: multiCategoryFees } }).as('getFees');
      cy.intercept('GET', '**/api/players*', {
        statusCode: 200,
        body: { data: [], category: mockCategories[0] },
      });
      cy.visit('/dashboard');
      cy.wait('@getFees');
    });

    it('should display fee collection section title', () => {
      cy.get('[data-testid="fee-charts-title"]')
        .should('be.visible')
        .and('contain.text', 'Fee Collection');
    });

    it('should render fee chart cards for each category with fees', () => {
      cy.get('[data-testid="fee-chart-card"]').should('have.length', 2);
    });

    it('should display paid/unpaid counts in legend', () => {
      cy.get('[data-testid="fee-chart-legend"]').eq(0)
        .should('contain.text', 'Paid: 2')
        .and('contain.text', 'Unpaid: 1');
      cy.get('[data-testid="fee-chart-legend"]').eq(1)
        .should('contain.text', 'Paid: 5')
        .and('contain.text', 'Unpaid: 3');
    });
  });

  describe('Player — No fee charts on dashboard', () => {
    it('should not show fee collection section for player role', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/players*', {
        statusCode: 200,
        body: { data: [], category: mockCategories[0] },
      });
      cy.visit('/dashboard');

      cy.get('[data-testid="fee-charts-title"]').should('not.exist');
      cy.get('[data-testid="fee-chart-card"]').should('not.exist');
    });
  });
});
