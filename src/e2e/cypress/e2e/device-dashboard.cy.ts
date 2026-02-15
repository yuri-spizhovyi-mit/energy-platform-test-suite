describe('Device Dashboard E2E', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display all active devices', () => {
      cy.get('[data-testid="device-list"]').should('be.visible');
      cy.get('[data-testid="device-card"]').should('have.length.at.least', 1);
    });

    it('should show real-time energy consumption', () => {
      cy.get('[data-testid="total-consumption"]').should('be.visible');
      cy.get('[data-testid="total-consumption"]')
        .invoke('text')
        .should('match', /\d+(\.\d+)?\s*(kWh|MWh)/);
    });

    it('should display device status indicators', () => {
      cy.get('[data-testid="device-card"]').first().within(() => {
        cy.get('[data-testid="device-status"]').should('be.visible');
        cy.get('[data-testid="device-status"]')
          .should('have.class', /status-(active|inactive|maintenance)/);
      });
    });
  });

  describe('Device Details', () => {
    it('should navigate to device details page', () => {
      cy.get('[data-testid="device-card"]').first().click();
      cy.url().should('include', '/devices/');
      cy.get('[data-testid="device-details"]').should('be.visible');
    });

    it('should display device information', () => {
      cy.get('[data-testid="device-card"]').first().click();
      
      cy.get('[data-testid="device-name"]').should('be.visible');
      cy.get('[data-testid="device-type"]').should('be.visible');
      cy.get('[data-testid="device-location"]').should('be.visible');
      cy.get('[data-testid="last-reading"]').should('be.visible');
    });

    it('should show historical energy readings chart', () => {
      cy.get('[data-testid="device-card"]').first().click();
      
      cy.get('[data-testid="energy-chart"]').should('be.visible');
      cy.get('[data-testid="chart-canvas"]').should('exist');
    });
  });

  describe('Real-time Updates', () => {
    it('should update readings in real-time via WebSocket', () => {
      cy.get('[data-testid="device-card"]').first().within(() => {
        cy.get('[data-testid="current-reading"]')
          .invoke('text')
          .then((initialValue) => {
            // Wait for WebSocket update
            cy.wait(5000);
            cy.get('[data-testid="current-reading"]')
              .invoke('text')
              .should('not.equal', initialValue);
          });
      });
    });

    it('should show connection status indicator', () => {
      cy.get('[data-testid="websocket-status"]').should('be.visible');
      cy.get('[data-testid="websocket-status"]').should('have.class', 'connected');
    });
  });

  describe('Filtering and Search', () => {
    it('should filter devices by type', () => {
      cy.get('[data-testid="filter-type"]').select('Solar Panel');
      cy.get('[data-testid="device-card"]').each(($card) => {
        cy.wrap($card)
          .find('[data-testid="device-type"]')
          .should('contain', 'Solar Panel');
      });
    });

    it('should search devices by name', () => {
      cy.get('[data-testid="search-input"]').type('Device 1');
      cy.get('[data-testid="device-card"]').should('have.length.at.least', 1);
      cy.get('[data-testid="device-card"]').first().within(() => {
        cy.get('[data-testid="device-name"]').should('contain', 'Device 1');
      });
    });

    it('should filter by status', () => {
      cy.get('[data-testid="filter-status"]').select('Active');
      cy.get('[data-testid="device-card"]').each(($card) => {
        cy.wrap($card)
          .find('[data-testid="device-status"]')
          .should('have.class', 'status-active');
      });
    });
  });

  describe('Date Range Selection', () => {
    it('should filter readings by date range', () => {
      cy.get('[data-testid="device-card"]').first().click();
      
      cy.get('[data-testid="date-range-start"]').type('2024-01-01');
      cy.get('[data-testid="date-range-end"]').type('2024-12-31');
      cy.get('[data-testid="apply-date-range"]').click();
      
      cy.get('[data-testid="energy-chart"]').should('be.visible');
      cy.get('[data-testid="readings-count"]')
        .invoke('text')
        .should('match', /\d+ readings/);
    });
  });

  describe('Alerts and Notifications', () => {
    it('should display alerts for abnormal readings', () => {
      cy.get('[data-testid="alerts-panel"]').should('be.visible');
      cy.get('[data-testid="alert-item"]').should('exist');
    });

    it('should show notification badge for new alerts', () => {
      cy.get('[data-testid="alerts-badge"]').should('be.visible');
      cy.get('[data-testid="alerts-badge"]')
        .invoke('text')
        .should('match', /\d+/);
    });
  });

  describe('Export Functionality', () => {
    it('should export device data as CSV', () => {
      cy.get('[data-testid="device-card"]').first().click();
      cy.get('[data-testid="export-csv"]').click();
      
      // Verify download initiated
      cy.readFile('cypress/downloads/device-readings.csv', { timeout: 10000 })
        .should('exist');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="device-list"]').should('be.visible');
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
    });

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="device-list"]').should('be.visible');
      cy.get('[data-testid="device-card"]').should('be.visible');
    });
  });
});
