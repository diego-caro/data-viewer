const MOCK_DIVISIONS = [
  { id: 206752, name: 'Mixto Sub 14 A' },
  { id: 206754, name: 'Caballeros Primera' },
  { id: 206753, name: 'Mixto Sub 16 A' },
];

const MOCK_MATCHES = [
  {
    id: 207519,
    status: 'completed',
    date: '2026-06-06T13:30:00Z',
    venue: 'Bigornia',
    round: 1,
    homeTeam: { clubId: 3, clubName: 'Bigornia Club' },
    awayTeam: { clubId: 5, clubName: 'Club Empleados de Comercio' },
    score: { home: 2, away: 2 },
  },
];

const MOCK_CLUBS = [
  { id: 3, name: 'Bigornia Club', logo: null },
  { id: 5, name: 'Club Empleados de Comercio', logo: null },
];

const MOCK_STANDINGS = [
  {
    position: 1,
    clubId: 1,
    clubName: 'Patoruzú Rugby Club',
    clubLogo: null,
    points: 9,
    played: 3,
    won: 3,
    drawn: 0,
    lost: 0,
    goalsFor: 8,
    goalsAgainst: 2,
    goalDifference: 6,
  },
  {
    position: 2,
    clubId: 6,
    clubName: 'Puerto Madryn Rugby Club',
    clubLogo: null,
    points: 6,
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 6,
    goalDifference: 1,
  },
];

function interceptTournamentAPIs(): void {
  cy.intercept('GET', '**/api/fixture/divisions', {
    statusCode: 200,
    body: { data: MOCK_DIVISIONS },
  }).as('getDivisions');

  cy.intercept('GET', '**/api/fixture/matches?fixtureId=*', {
    statusCode: 200,
    body: { data: MOCK_MATCHES },
  }).as('getMatches');

  cy.intercept('GET', '**/api/fixture/clubs?fixtureId=*', {
    statusCode: 200,
    body: { data: MOCK_CLUBS },
  }).as('getClubs');

  cy.intercept('GET', '**/api/fixture/standings?fixtureId=*', {
    statusCode: 200,
    body: { data: MOCK_STANDINGS },
  }).as('getStandings');
}

describe('SCRUM-27 Tournament Standings with Category Filter', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    interceptTournamentAPIs();
    cy.visit('/fixture');
  });

  it('should display Tournament as the page title', () => {
    cy.get('h1').should('contain.text', 'Tournament');
  });

  it('should show category dropdown and both tabs', () => {
    cy.get('[data-testid="division-select"]').should('be.visible');
    cy.get('[data-testid="tab-fixture"]').should('be.visible');
    cy.get('[data-testid="tab-standings"]').should('be.visible');
  });

  it('should list all divisions in the dropdown', () => {
    cy.get('[data-testid="division-select"] option').should('have.length', 3);
    cy.get('[data-testid="division-select"] option').eq(0).should('contain.text', 'Mixto Sub 14 A');
    cy.get('[data-testid="division-select"] option').eq(1).should('contain.text', 'Caballeros Primera');
  });

  it('should default to fixture tab with match content', () => {
    cy.get('[data-testid="tab-fixture"]').should('have.class', 'text-blue-600');
    cy.get('[data-testid="fixture-content"]').should('exist');
    cy.get('[data-testid="standings-content"]').should('not.exist');
  });

  it('should switch to standings tab and show standings table', () => {
    cy.get('[data-testid="tab-standings"]').click();
    cy.get('[data-testid="standings-table"]').should('be.visible');
    cy.get('[data-testid="standings-row"]').should('have.length', 2);
    cy.get('[data-testid="fixture-content"]').should('not.exist');
  });

  it('should display correct data in standings table', () => {
    cy.get('[data-testid="tab-standings"]').click();
    cy.get('[data-testid="standings-row"]').first().within(() => {
      cy.contains('1');
      cy.contains('Patoruzú Rugby Club');
      cy.contains('9');
    });
  });

  it('should show positive goal difference with plus sign', () => {
    cy.get('[data-testid="tab-standings"]').click();
    cy.get('[data-testid="standings-row"]').first().should('contain.text', '+6');
  });

  it('should reload data when category is changed', () => {
    cy.get('[data-testid="division-select"]').select('Caballeros Primera');
    cy.wait('@getMatches');
    cy.wait('@getStandings');
  });

  it('should show Tournament in the nav bar', () => {
    cy.get('[data-testid="nav-link"]').contains('Tournament').should('be.visible');
  });

  describe('error handling', () => {
    it('should show error when divisions fail to load', () => {
      cy.intercept('GET', '**/api/fixture/divisions', {
        statusCode: 500,
        body: { error: 'Server error' },
      });
      cy.visit('/fixture');
      cy.get('[data-testid="error-state"]').should('be.visible');
    });

    it('should show standings error when standings fail to load', () => {
      cy.intercept('GET', '**/api/fixture/standings?fixtureId=*', {
        statusCode: 500,
        body: { error: 'Server error' },
      });
      cy.visit('/fixture');
      cy.get('[data-testid="tab-standings"]').click();
      cy.get('[data-testid="standings-error"]').should('be.visible');
    });
  });

  describe('mobile responsive', () => {
    it('should allow horizontal scroll on standings table on mobile', () => {
      cy.viewport('iphone-6');
      cy.get('[data-testid="tab-standings"]').click();
      cy.get('[data-testid="standings-table"]').should('be.visible');
      cy.get('[data-testid="standings-row"]').first().should('be.visible');
    });
  });
});
