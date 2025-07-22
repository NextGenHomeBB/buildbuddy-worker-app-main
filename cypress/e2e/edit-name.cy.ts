describe('Edit Profile Name', () => {
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

  it('should edit user name via greeting header', () => {
    // Click on greeting header to open profile edit
    cy.get('[data-testid="greeting-header"]').click()
    
    // Should navigate to profile page or open edit dialog
    cy.url().should('include', '/profile')
    
    // Find name input field and update it
    const newName = 'Cypress Test User'
    cy.get('input[placeholder*="name"], input[name*="name"]').clear().type(newName)
    
    // Save changes
    cy.get('button').contains(/save|update/i).click()
    
    // Check for success toast
    cy.contains('Profile updated').should('be.visible')
    
    // Navigate back to today page
    cy.visit('/today')
    
    // Verify updated name appears in header
    cy.get('[data-testid="greeting-header"]').should('contain', newName)
  })
})