# AI Guidelines for Build-Buddy Worker App

## Context Engineering Rules (CE)

### CE-1: Atomic Context Rows
- Store context in `ai_context` table as individual atomic rows
- Each row should contain a single, focused piece of information
- Avoid large prompt blobs or concatenated context strings
- Use structured data with clear categorization (type, component, feature, etc.)

Example structure:
```sql
CREATE TABLE ai_context (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50), -- 'component', 'hook', 'route', 'business_rule'
  category VARCHAR(50), -- 'auth', 'tasks', 'ui', 'data'
  key VARCHAR(100), -- specific identifier
  value TEXT, -- atomic piece of information
  metadata JSONB, -- additional structured data
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Prompt Engineering Rules (PE)

### PE-1: Prompt Order Structure
When constructing prompts for AI assistance, follow this specific order:

1. **System Context** - High-level system information
   - App purpose and architecture
   - Technology stack
   - Environment setup

2. **Role Definition** - AI's specific role and responsibilities
   - What the AI should focus on
   - Constraints and limitations
   - Expected output format

3. **Context Data** - Relevant information for the task
   - Current code state
   - Related components
   - Business requirements
   - User stories or acceptance criteria

4. **Specific Instruction** - Clear, actionable request
   - What needs to be done
   - Expected deliverables
   - Success criteria

### Example Prompt Structure:
```
SYSTEM: Build-Buddy Worker App v0.1 - React 18 + TypeScript + Supabase
Stack: Vite, Tailwind CSS, Shadcn/UI, React-Query

ROLE: You are a senior frontend developer specializing in task management applications.
Focus on: Component creation, state management, user experience.
Constraints: Use existing design system, maintain type safety.

CONTEXT: 
- Current route: /today
- Component: TaskCard
- Feature: Task status updates
- Related: useMyTasks hook, Supabase integration

INSTRUCTION: Create a TaskCard component that displays task information and allows status updates via checkbox interaction. Include toast notifications for user feedback.
```

## Implementation Notes

- These guidelines should be referenced when working with AI assistants
- Context should be stored in database for consistent access
- Prompt engineering patterns should be documented and reused
- Regular review and refinement of these guidelines is recommended