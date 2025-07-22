describe('Authentication', () => {
  it('should login with valid credentials and redirect to /today', () => {
    const email = Cypress.env('CYPRESS_USER_EMAIL') || 'test@example.com'
    const password = Cypress.env('CYPRESS_USER_PASSWORD') || 'password123'
    
    cy.visit('/login')
    
    // Fill in login form
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should redirect to /today
    cy.url().should('include', '/today')
    
    // Should see user interface
    cy.contains('Good').should('be.visible')
  })
})