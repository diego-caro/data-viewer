const MOCK_DIVISIONS = [
  { id: 206752, name: 'Mixto Sub 14 A' },
  { id: 206754, name: 'Caballeros Primera' },
];

const MOCK_ROUNDS = [
  {
    date: '2026-06-06T13:30:00Z',
    description: 'Fecha 1',
    round: 1,
    matches: [
      {
        id: 207519,
        status: 'completed',
        date: '2026-06-06T13:30:00Z',
        venue: 'Bigornia',
        instance: 207306,
        homeTeam: { clubId: 3, clubName: 'Bigornia Club', logo: null },
        awayTeam: { clubId: 5, clubName: 'Club Empleados de Comercio', logo: null },
        score: { home: 2, away: 2 },
      },
    ],
  },
  {
    date: '2026-06-20T03:00:00Z',
    description: 'Fecha 3',
    round: 3,
    matches: [
      {
        id: 208130,
        status: 'pending',
        date: '2026-06-20T03:00:00Z',
        venue: 'C.E.C. Hockey',
        instance: 207304,
        homeTeam: { clubId: 5, clubName: 'Club Empleados de Comercio', logo: null },
        awayTeam: { clubId: 12, clubName: 'Trelew R.C.', logo: null },
        score: null,
      },
    ],
  },
];

const MOCK_STANDINGS = [
  {
    position: 1,
    clubId: 3,
    clubName: 'Bigornia Club',
    clubLogo: null,
    points: 6,
    played: 2,
    won: 2,
    drawn: 0,
    lost: 0,
    goalsFor: 5,
    goalsAgainst: 2,
    goalDifference: 3,
  },
];

describe('SCRUM-8 Tournament Fixture Page', () => {
  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept('GET', '**/api/fixture/divisions', {
      statusCode: 200,
      body: { data: MOCK_DIVISIONS },
    });
    cy.intercept('GET', '**/api/fixture/fixtures?fixtureId=*', {
      statusCode: 200,
      body: { data: MOCK_ROUNDS },
    });
    cy.intercept('GET', '**/api/fixture/standings?fixtureId=*', {
      statusCode: 200,
      body: { data: MOCK_STANDINGS },
    });

    cy.visit('/fixture');
  });

  it('should display the tournament page with title', () => {
    cy.get('h1').should('contain.text', 'Tournament');
  });

  it('should show matches grouped by round headers', () => {
    cy.get('[data-testid="round-header"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="round-header"]')
      .first()
      .should('contain.text', 'Fecha');
  });

  it('should display completed matches with scores', () => {
    cy.get('[data-testid="match-card-completed"]').should(
      'have.length.greaterThan',
      0
    );
    cy.get('[data-testid="match-score"]')
      .first()
      .should('contain.text', '-');
  });

  it('should display pending matches with VS label', () => {
    cy.get('[data-testid="match-card-pending"]').should(
      'have.length.greaterThan',
      0
    );
    cy.get('[data-testid="match-date-pending"]').should(
      'have.length.greaterThan',
      0
    );
  });

  it('should display team names on each match card', () => {
    cy.get('[data-testid="team-name"]').should('have.length.greaterThan', 0);
  });

  it('should display team logo placeholders', () => {
    cy.get('[data-testid="team-logo-placeholder"]').should('have.length.greaterThan', 0);
  });

  it('should display venue name on each match card', () => {
    cy.get('[data-testid="match-venue"]').should(
      'have.length.greaterThan',
      0
    );
    cy.get('[data-testid="match-venue"]')
      .first()
      .should('not.be.empty');
  });

  it('should visually distinguish completed from pending matches', () => {
    cy.get('[data-testid="match-card-completed"]')
      .first()
      .should('have.class', 'border-gray-200');
    cy.get('[data-testid="match-card-pending"]')
      .first()
      .should('have.class', 'border-blue-200');
  });

  it('should be responsive on mobile viewport', () => {
    cy.viewport('iphone-6');
    cy.get('[data-testid="match-card-completed"], [data-testid="match-card-pending"]')
      .first()
      .should('be.visible');
    cy.get('[data-testid="team-name"]').first().should('be.visible');
  });

  it('should sort rounds in ascending order', () => {
    cy.get('[data-testid="round-header"]').then(($headers) => {
      const roundNumbers = [...$headers].map((header) => {
        const match = header.textContent?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      const sorted = [...roundNumbers].sort((a, b) => a - b);
      expect(roundNumbers).to.deep.equal(sorted);
    });
  });
});
