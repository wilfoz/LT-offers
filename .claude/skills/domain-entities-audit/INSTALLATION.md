# Installation and Usage Guide

## Installation

### Option 1: Manual Installation

1. Copy the `domain-entities-audit.skill` folder to your project's skills directory:
   ```bash
   cp -r domain-entities-audit.skill /path/to/your/skills/directory/
   ```

2. The skill will be automatically detected by Claude Code (Antigravity)

### Option 2: Direct Use

Simply reference the SKILL.md file when working with Claude Code:

```
Please use the domain-entities-audit skill to analyze my entities
```

## Quick Start Examples

### Example 1: Audit Single Entity

**Input:**
```
Using the domain-entities-audit skill, analyze this entity:

export class ProductionEntity {
  constructor(
    readonly props: {
      id: string;
      status: STATUS_PRODUCTION;
      task_id: string;
      task?: { id: string; name: string };
      towers: string[];
      towers_details?: { id: string; tower_number: string }[];
    },
  ) { }
}
```

**Expected Output:**
- Entity classification
- Violation report (data duplication, anemic domain)
- Quality score (likely 20-30/100)
- Complete refactored code with:
  - Rich domain entity
  - Value Objects (ProductionId, TaskId, TowerId)
  - Repository interface
  - DTOs
  - Use Cases
  - Unit tests

---

### Example 2: Audit All Entities in Project

**Input:**
```
Using the domain-entities-audit skill, audit all entities in:
src/domain/entities/

Generate:
1. Executive summary
2. Individual entity reports
3. Prioritized refactoring roadmap
```

**Expected Output:**
- Complete inventory of entities
- Score distribution chart
- Top priority refactorings
- Sprint-by-sprint roadmap
- Detailed reports for each entity

---

### Example 3: Refactor Specific Entity

**Input:**
```
Using the domain-entities-audit skill, refactor the Order entity to:
- Remove data duplication (customer?, products?)
- Extract Value Objects
- Add business behavior
- Ensure invariants
- Create repository interface
- Add unit tests
```

**Expected Output:**
- Refactored rich domain Order entity
- Value Objects (OrderId, Money, OrderStatus)
- OrderRepository interface
- DTOs for different contexts
- Use Cases for orchestration
- Complete unit test suite
- Migration guide

---

### Example 4: Detect Anemic Domains

**Input:**
```
Using the domain-entities-audit skill, identify all anemic domain models in:
src/domain/entities/

Focus on:
- Entities with 0-2 behavior methods
- Entities with public setters
- Business logic in services
```

**Expected Output:**
- List of anemic entities with scores
- Behavior-to-data ratio analysis
- Service layer analysis showing leaked business logic
- Refactoring priority based on impact

---

### Example 5: Validate Architecture

**Input:**
```
Using the domain-entities-audit skill, validate that:
- Domain layer has ZERO infrastructure dependencies
- All entities follow SOLID principles
- Repository pattern is properly implemented
- DTOs are in application layer, not domain
```

**Expected Output:**
- Architecture validation report
- List of violated dependencies
- SOLID principles scorecard
- Layer separation diagram
- Script to automatically check architecture rules

---

## Common Workflows

### Workflow 1: New Project Setup

1. **Audit existing code:**
   ```
   Audit all entities in src/domain/
   ```

2. **Review executive summary**
   - Identify critical entities (score < 50)
   - Review architectural violations

3. **Create refactoring roadmap**
   - Sprint 1: Critical entities
   - Sprint 2: High priority
   - Sprint 3+: Remaining entities

4. **Refactor iteratively:**
   ```
   Refactor [EntityName] following the roadmap
   ```

5. **Add architecture validation:**
   ```
   Create architecture validation script to prevent future violations
   ```

---

### Workflow 2: Code Review

Before merging a PR with entity changes:

```
Using domain-entities-audit skill, review this entity:
[paste code]

Check for:
- Anemic domain
- Data duplication
- Infrastructure dependencies
- Missing Value Objects
- No invariants
```

---

### Workflow 3: Refactoring Sprint

```
Plan a 2-week refactoring sprint using domain-entities-audit skill:

Current state:
- 15 entities, average score 45/100
- Major violations: data duplication, anemic models
- Team size: 3 developers

Generate:
- Daily tasks breakdown
- Risk assessment
- Testing strategy
- Migration plan
```

---

## Tips for Best Results

### 1. Provide Context

**Good:**
```
Audit ProductionEntity in the context of a manufacturing system.
Key business rules:
- Productions must be assigned to towers
- Status transitions: PENDING → IN_PROGRESS → COMPLETED
- Cannot modify completed productions
```

**Better than:**
```
Audit ProductionEntity
```

---

### 2. Specify Constraints

```
Refactor UserEntity with constraints:
- Must maintain backward compatibility with existing API
- Database schema cannot change
- Migration must be zero-downtime
```

---

### 3. Ask for Specific Outputs

```
Audit Order entity and provide:
1. Current score breakdown
2. Top 3 violations with examples
3. Refactored code
4. Before/after comparison
5. Test coverage plan
```

---

### 4. Iterative Refinement

Start broad, then drill down:

```
Step 1: "Audit all entities and give me the top 5 priorities"
Step 2: "Refactor the #1 priority entity in detail"
Step 3: "Generate tests for the refactored entity"
Step 4: "Create migration guide for this refactoring"
```

---

## Integration with CI/CD

### Architecture Validation Script

The skill can generate a script to run in CI:

```typescript
// scripts/validate-architecture.ts
// Generated by domain-entities-audit skill

// Prevents domain layer from importing infrastructure
// Fails build if violations detected
```

Add to your CI pipeline:

```yaml
# .github/workflows/architecture.yml
name: Architecture Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Architecture
        run: npx ts-node scripts/validate-architecture.ts
```

---

## Customization

### Define Your Own Scoring

You can request custom scoring criteria:

```
Using domain-entities-audit skill, audit entities with custom scoring:
- Rich Domain: 50 points (instead of 40)
- Must use Zod for Value Object validation
- Require domain events for state changes
```

---

### Domain-Specific Rules

Add your business domain rules:

```
Audit entities in healthcare domain context:
- PHI (Protected Health Info) must be in separate Value Objects
- Audit trail required for all state changes
- HIPAA compliance validations
```

---

## Troubleshooting

### Issue: "Too many files to audit"

**Solution:** Audit in batches
```
Audit entities in batches:
Batch 1: User, Order, Product (core entities)
Batch 2: Invoice, Payment (financial)
Batch 3: Remaining entities
```

### Issue: "Refactoring is too complex"

**Solution:** Break into smaller steps
```
For OrderEntity, do just:
Step 1: Remove data duplication
Step 2: Extract Value Objects
[After review]
Step 3: Add business behavior
Step 4: Create repository interface
```

### Issue: "Need migration strategy"

**Solution:** Request detailed migration
```
Provide zero-downtime migration strategy for OrderEntity refactoring:
- Database changes
- API versioning
- Backward compatibility
- Rollback plan
```

---

## Advanced Usage

### Custom Anti-Pattern Detection

```
Using domain-entities-audit skill, detect custom anti-patterns:
1. Entities exposing internal collections (List<T> getters)
2. Entities with more than 10 properties
3. Circular dependencies between entities
4. Missing equals/hashCode for entities
```

### Performance Impact Analysis

```
Analyze performance impact of refactoring UserEntity:
- Current: Direct property access
- Proposed: Value Objects with validation

Estimate:
- Creation time overhead
- Memory footprint
- Serialization cost
```

### Team Onboarding

```
Generate training material for the team:
- Before/After examples
- Common pitfalls
- Review checklist
- Pair programming guide for refactoring
```

---

## FAQ

**Q: Can I use this skill on legacy codebases?**  
A: Yes! The skill is designed for both new and legacy projects. For legacy code, it provides a gradual refactoring roadmap.

**Q: Does this require changing my database schema?**  
A: No. Value Objects and rich domains are implementation details. The persistence layer (Mappers) handles translation to/from database format.

**Q: How long does a typical refactoring take?**  
A: Depends on complexity:
- Simple entity: 2-4 hours
- Medium entity: 1-2 days
- Complex aggregate: 3-5 days

**Q: Will this break existing tests?**  
A: Likely yes, but the skill generates new tests. You'll need to update integration tests that depend on the old structure.

**Q: Can I partially adopt this?**  
A: Yes! Refactor high-priority entities first. Old and new styles can coexist temporarily.

---

## Next Steps

1. **Try the examples above** with your own entities
2. **Review the generated code** and adapt to your needs
3. **Integrate validation** into your CI/CD
4. **Share with your team** and establish conventions
5. **Iterate continuously** - domain models evolve

---

## Support & Feedback

This skill follows Domain-Driven Design, Clean Architecture, and Hexagonal Architecture principles.

For deeper understanding, consult:
- **Domain-Driven Design** by Eric Evans
- **Clean Architecture** by Robert C. Martin
- **Implementing Domain-Driven Design** by Vaughn Vernon

---

**Happy refactoring! Transform your anemic models into rich, maintainable domains.** 🚀
