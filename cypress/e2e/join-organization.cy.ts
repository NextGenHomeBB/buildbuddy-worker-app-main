describe('Join Organization Flow', () => {
  beforeEach(() => {
    // Mock the setCustomClaims edge function
    cy.intercept('POST', '**/functions/v1/setCustomClaims', { fixture: 'join-organization.json' }).as('setCustomClaims')
  })

  it('should allow user to join organization with valid code', () => {
    // Sign in first (assuming test user exists)
    cy.visit('/login')
    
    const email = Cypress.env('CYPRESS_USER_EMAIL') || 'test@example.com'
    const password = Cypress.env('CYPRESS_USER_PASSWORD') || 'password123'
    
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    
    // Should be redirected to join organization if no org in JWT
    cy.url().should('include', '/join-organization')
    
    // Fill in organization code
    cy.get('input[id="inviteCode"]').type('test-org-id')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should call the edge function
    cy.wait('@setCustomClaims').then((interception) => {
      expect(interception.request.body).to.deep.include({
        organization_id: 'test-org-id'
      })
    })
    
    // Should redirect to home after successful join
    cy.url().should('include', '/today')
    
    // Should show success toast
    cy.contains('Successfully joined').should('be.visible')
  })

  it('should show error for invalid organization code', () => {
    // Mock error response
    cy.intercept('POST', '**/functions/v1/setCustomClaims', {
      statusCode: 400,
      body: { error: 'Invalid organization code' }
    }).as('setCustomClaimsError')
    
    cy.visit('/join-organization')
    
    // Fill in invalid organization code
    cy.get('input[id="inviteCode"]').type('invalid-code')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should call the edge function
    cy.wait('@setCustomClaimsError')
    
    // Should show error toast
    cy.contains('Invalid organization code').should('be.visible')
    
    // Should remain on join organization page
    cy.url().should('include', '/join-organization')
  })

  it('should validate empty organization code', () => {
    cy.visit('/join-organization')
    
    // Try to submit without entering code
    cy.get('button[type="submit"]').click()
    
    // Should show validation message
    cy.contains('Please enter a valid organization code').should('be.visible')
  })
})