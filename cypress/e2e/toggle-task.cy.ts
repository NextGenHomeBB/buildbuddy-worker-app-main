describe('Task Toggle', () => {
  beforeEach(() => {
    // Login first
    const email = Cypress.env('CYPRESS_USER_EMAIL') || 'test@example.com'
    const password = Cypress.env('CYPRESS_USER_PASSWORD') || 'password123'
    
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/today')
  })

  it('should toggle task status online and offline', () => {
    // Intercept task update API calls
    cy.intercept('PATCH', '/rest/v1/tasks*').as('updateTask')
    
    // Wait for daily tasks to load
    cy.get('[data-testid="daily-task-card"]').should('exist')
    
    // Click first task checkbox (online)
    cy.get('[data-testid="daily-task-card"]').first().find('input[type="checkbox"]').click()
    
    // Wait for API call and check success toast
    cy.wait('@updateTask')
    cy.contains('Task Completed').should('be.visible')
    
    // Force offline mode
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: false
      })
    })
    
    // Click checkbox again (offline)
    cy.get('[data-testid="daily-task-card"]').first().find('input[type="checkbox"]').click()
    
    // Should show queued toast
    cy.contains('Queued while offline').should('be.visible')
    
    // Force online mode
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: true
      })
      
      // Trigger online event
      win.dispatchEvent(new Event('online'))
    })
    
    // Wait for sync and check success toast
    cy.wait('@updateTask')
    cy.contains('Synced').should('be.visible')
  })
})