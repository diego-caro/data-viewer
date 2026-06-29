describe('SCRUM-43 Dashboard fee collection charts with tabs', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Sub 14' },
    { id: 'cat-2', name: 'Sub 16' },
  ];

  const mockMatchFees = [
    {
      id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
      periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
      type: 'match', playerFees: [], paidCount: 7, unpaidCount: 3,
    },
    {
      id: 'fee-2', categoryId: 'cat-2', categoryName: 'Sub 16',
      totalAmount: 4000, availablePlayers: 8, perPlayerAmount: 500,
      periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
      type: 'match', playerFees: [], paidCount: 5, unpaidCount: 3,
    },
  ];

  const mockLeagueFees = [
    {
      id: 'league-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 2000, availablePlayers: 10, perPlayerAmount: 200,
      periodStartDate: '2026-06-01', createdBy: 'admin-1', createdAt: '2026-06-01T00:00:00Z',
      type: 'league', playerFees: [], paidCount: 8, unpaidCount: 2,
    },
  ];

  const mockTravelFees = [
    {
      id: 'travel-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 1500, availablePlayers: 10, perPlayerAmount: 150,
      periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22T00:00:00Z',
      type: 'travel', playerFees: [], paidCount: 4, unpaidCount: 6,
    },
  ];

  const allFees = [...mockMatchFees, ...mockLeagueFees, ...mockTravelFees];

  beforeEach(() => {
    localStorage.clear();
    cy.intercept('GET', '**/api/categories', { statusCode: 200, body: { data: mockCategories } });
    cy.intercept('GET', '**/api/players*', { statusCode: 200, body: { data: [], category: mockCategories[0] } });
  });

  describe('Admin dashboard with all fee types', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: allFees } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');
    });

    it('should show 3 tabs above fee collection section', () => {
      cy.get('[data-testid="fee-tab-match"]').should('be.visible');
      cy.get('[data-testid="fee-tab-league"]').should('be.visible');
      cy.get('[data-testid="fee-tab-travel"]').should('be.visible');
    });

    it('should default to match tab showing match fee charts', () => {
      cy.get('[data-testid="fee-chart-card"]').should('have.length', 2);
      cy.get('[data-testid="fee-chart-title"]').first().should('contain.text', 'Sub 14');
      cy.get('[data-testid="fee-chart-title"]').last().should('contain.text', 'Sub 16');
    });

    it('should show only league fee charts when league tab is clicked', () => {
      cy.get('[data-testid="fee-tab-league"]').click();
      cy.get('[data-testid="fee-chart-card"]').should('have.length', 1);
      cy.get('[data-testid="fee-chart-title"]').should('contain.text', 'Sub 14');
      cy.get('[data-testid="fee-chart-legend"]').should('contain.text', 'Paid: 8');
      cy.get('[data-testid="fee-chart-legend"]').should('contain.text', 'Unpaid: 2');
    });

    it('should show only travel fee charts when travel tab is clicked', () => {
      cy.get('[data-testid="fee-tab-travel"]').click();
      cy.get('[data-testid="fee-chart-card"]').should('have.length', 1);
      cy.get('[data-testid="fee-chart-legend"]').should('contain.text', 'Paid: 4');
      cy.get('[data-testid="fee-chart-legend"]').should('contain.text', 'Unpaid: 6');
    });

    it('should switch back to match tab after viewing other tabs', () => {
      cy.get('[data-testid="fee-tab-travel"]').click();
      cy.get('[data-testid="fee-chart-card"]').should('have.length', 1);

      cy.get('[data-testid="fee-tab-match"]').click();
      cy.get('[data-testid="fee-chart-card"]').should('have.length', 2);
    });
  });

  describe('Empty tab state', () => {
    it('should show empty state when tab has no configured fees', () => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: mockMatchFees } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');

      cy.get('[data-testid="fee-tab-league"]').click();
      cy.get('[data-testid="fee-tab-empty"]')
        .should('be.visible')
        .and('contain.text', 'No fees configured for this type');
      cy.get('[data-testid="fee-chart-card"]').should('not.exist');
    });
  });

  describe('Tab styling matches admin payments page', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: allFees } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');
    });

    it('should highlight active tab with blue background', () => {
      cy.get('[data-testid="fee-tab-match"]').should('have.class', 'bg-blue-500');
      cy.get('[data-testid="fee-tab-league"]').should('not.have.class', 'bg-blue-500');

      cy.get('[data-testid="fee-tab-league"]').click();
      cy.get('[data-testid="fee-tab-league"]').should('have.class', 'bg-blue-500');
      cy.get('[data-testid="fee-tab-match"]').should('not.have.class', 'bg-blue-500');
    });
  });

  describe('Player/captain dashboard is unaffected', () => {
    it('should not show fee tabs for player role', () => {
      cy.loginAsPlayer('cat-1');
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');

      cy.get('[data-testid="fee-tab-match"]').should('not.exist');
      cy.get('[data-testid="fee-tab-league"]').should('not.exist');
      cy.get('[data-testid="fee-tab-travel"]').should('not.exist');
    });
  });

  describe('No fees at all', () => {
    it('should not show tabs or fee section when no fees exist', () => {
      cy.loginAsAdmin();
      cy.intercept('GET', '**/api/payments', { statusCode: 200, body: { data: [] } }).as('getFees');
      cy.visit('/dashboard');
      cy.wait('@getFees');

      cy.get('[data-testid="fee-tab-match"]').should('not.exist');
      cy.get('[data-testid="fee-charts-title"]').should('not.exist');
    });
  });
});
