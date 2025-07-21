
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

## Lovable-Specific Context Engineering Rules (L-CE)

### L-CE-1: Prompt Size Limits
- Keep prompts ≤ 4KB before variables expand
- Lovable truncates longer inputs without warning
- **Why it matters**: Prevents silent clipping in the generation box

**Example - Good:**
```
SYSTEM: Build-Buddy Worker App - Mobile-first task management
CONTEXT: {{task_context}}
INSTRUCTION: Add swipe gestures to TaskCard for mobile UX
```

**Example - Bad:**
```
SYSTEM: Build-Buddy Worker App is a comprehensive task management solution built with React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI components, React Query for state management, Supabase for backend services including authentication and database operations, designed specifically for construction workers and field personnel who need to manage their daily tasks efficiently while working on job sites with varying connectivity conditions...
[continues for 6KB+]
```

### L-CE-2: Single JSON Placeholder Rule
- One JSON block → one placeholder token
- Use single `{{context}}` token for dynamic content
- Don't inline multiple SQL fragments or JSON blocks
- **Why it matters**: Lovable's substitution engine only replaces the first instance reliably

**Example - Good:**
```
CONTEXT: {{task_data}}
INSTRUCTION: Update TaskCard based on the provided task structure
```

**Example - Bad:**
```
CONTEXT: {{user_tasks}} and {{task_metadata}} and {{ui_preferences}}
INSTRUCTION: Update TaskCard using {{task_data}} structure
```

### L-CE-3: Code Fence Backtick Management
- No backticks inside triple-backtick code fences
- Escape or omit to avoid markdown parser breakage
- **Why it matters**: Lovable Markdown parser splits code blocks on stray backticks

**Example - Good:**
```typescript
// Use single quotes for template literals
const svg = 'data:image/svg+xml,%3Csvg...'
const className = "bg-[url('data:image/...')]"
```

**Example - Bad:**
```typescript
// This breaks Lovable's markdown parser
const template = `
  <div className="bg-[url(`data:image/svg+xml...`)]">
`
```

### L-CE-4: Auto-Injection Variables
- Use `{{PROJECT_NAME}}`, `{{TECH_STACK}}`, `{{CURRENT_ROUTE}}`
- Lovable auto-injects variables that match project settings
- **Why it matters**: Ensures values populate during generation without manual edits

**Example - Good:**
```
SYSTEM: {{PROJECT_NAME}} - {{TECH_STACK}}
CONTEXT: Current route: {{CURRENT_ROUTE}}
```

### L-CE-5: Comment Directives
- Comment directives start with `<!-- AI:` so they're ignored by compilers
- Parsed by Lovable bots for automated processing
- **Why it matters**: Enables future scripted tweaks without runtime noise

**Example:**
```html
<!-- AI: ENHANCE mobile responsiveness for tablets 768px+ -->
<!-- AI: OPTIMIZE for construction worker workflows -->
<!-- AI: INTEGRATE with existing useMyTasks hook -->
```

## Practical Examples from Build-Buddy Worker App

### 1. Bug Fix Prompt Pattern
```
SYSTEM: {{PROJECT_NAME}} - React 18 + TypeScript + Tailwind
ROLE: Senior developer fixing mobile UI issues
CONTEXT: {{current_component_state}}
ISSUE: TaskCard swipe gestures not working on iOS Safari
INSTRUCTION: Fix touch event handling for iOS compatibility
```

### 2. New Feature Prompt Pattern
```
SYSTEM: {{PROJECT_NAME}} - {{TECH_STACK}}
ROLE: Frontend developer adding accessibility features
CONTEXT: {{accessibility_requirements}}
FEATURE: Add keyboard navigation to TaskCard component
INSTRUCTION: Implement ARIA labels and keyboard shortcuts
```

### 3. Refactoring Prompt Pattern
```
SYSTEM: {{PROJECT_NAME}} - Mobile-first construction app
ROLE: Code architect improving maintainability
CONTEXT: {{component_analysis}}
REFACTOR: Extract TaskCard swipe logic to custom hook
INSTRUCTION: Create useSwipeGestures hook with TypeScript
```

## Implementation Guidelines

### 1. Development Workflow Integration
- Store frequently used prompts in `ai_context` table
- Use atomic context rows for reusable prompt components
- Maintain prompt templates for common scenarios
- Regular review and optimization of prompt effectiveness

### 2. Context Storage Strategy
```sql
-- Example context storage for TaskCard component
INSERT INTO ai_context (type, category, key, value, metadata) VALUES
('component', 'ui', 'TaskCard', 'Displays worker tasks with swipe gestures', '{"file": "src/components/TaskCard.tsx"}'),
('hook', 'data', 'useMyTasks', 'Manages task CRUD operations with Supabase', '{"file": "src/hooks/useMyTasks.ts"}'),
('business_rule', 'tasks', 'status_flow', 'pending → in_progress → completed', '{"validation": "required"}');
```

### 3. Prompt Size Management
- Use compression techniques for large context
- Reference external documentation URLs instead of inlining
- Utilize Lovable's auto-injection variables
- Break complex requests into sequential smaller prompts

### 4. Quality Assurance
- Test prompts with Lovable's 4KB limit
- Validate JSON placeholder substitution
- Check markdown rendering with code fences
- Verify auto-injection variable population

## Future AI Integration Preparation

### 1. Upcoming AI Features Support
- **Summaries**: Structured context enables automatic code summaries
- **Codegen**: Atomic context improves code generation accuracy
- **Natural Language Queries**: Clean data structure supports NL→SQL conversion
- **Doc Chat**: Organized guidelines enable contextual documentation chat

### 2. Security Considerations
- Sanitize user inputs in context storage
- Validate prompt templates before execution
- Implement rate limiting for AI feature usage
- Audit trail for all AI-generated changes

### 3. Reusable Patterns
```typescript
// Prompt template interface
interface PromptTemplate {
  id: string;
  name: string;
  category: 'bugfix' | 'feature' | 'refactor' | 'docs';
  template: string;
  variables: string[];
  maxTokens: number;
}

// Context injection helper
const injectContext = (template: string, context: Record<string, any>) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => 
    context[key] || match
  );
};
```

### 4. Best Practices for AI-Assisted Development
- **Incremental Changes**: Small, focused requests work better than large refactors
- **Context Preservation**: Maintain conversation context for complex features
- **Validation**: Always test AI-generated code before committing
- **Documentation**: Update guidelines based on real-world usage patterns

## Maintenance and Evolution

- Review and update guidelines monthly
- Collect feedback from development team
- Monitor Lovable platform updates for new features
- Optimize prompt patterns based on success metrics
- Archive outdated patterns and introduce new ones

This document serves as the foundation for robust AI-assisted development workflows while ensuring compatibility with Lovable's specific requirements and limitations.
