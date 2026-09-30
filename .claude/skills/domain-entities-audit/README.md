# Domain Entities Audit & Refactoring Skill

## Overview

This skill provides a comprehensive framework for auditing backend entities, detecting anemic domain models, identifying architectural violations, and refactoring toward rich domain models following Domain-Driven Design (DDD), Hexagonal Architecture, and Clean Architecture principles.

## When to Use This Skill

Use this skill when you need to:

- **Audit domain entities** for compliance with DDD and Clean Architecture principles
- **Detect anemic domain models** that lack business logic
- **Identify architectural violations** like infrastructure dependencies in domain layer
- **Refactor entities** from anemic to rich domain models
- **Eliminate code smells** such as data duplication, primitive obsession, and mixed responsibilities
- **Validate SOLID principles** in your domain layer
- **Ensure proper layer separation** (Domain → Application → Infrastructure)
- **Extract Value Objects** from primitive types
- **Implement Repository Pattern** with proper interfaces (ports) and implementations (adapters)

## Key Features

### 1. Comprehensive Entity Analysis
- Automatic classification (Aggregate Root, Entity, Value Object, DTO)
- Scoring system (0-100) based on multiple criteria
- Detection of 6 critical anti-patterns
- SOLID principles validation
- Clean Architecture dependency rule checking

### 2. Anemic vs Rich Domain Detection
Evaluates entities across multiple dimensions:
- **Behavior methods**: Does the entity encapsulate business logic?
- **Getters/Setters**: Are there public setters violating encapsulation?
- **Validations**: Are validations inside the entity or scattered in services?
- **Business rules**: Where do the rules live?
- **Invariants**: Are invariants always guaranteed?

### 3. Automated Refactoring Guidance
Provides step-by-step refactoring instructions:
- Extract Value Objects from primitives
- Move business logic from services to entities
- Create repository interfaces (ports)
- Implement DTOs for different contexts
- Add proper invariant enforcement
- Eliminate data duplication

### 4. Testing Support
- Unit test templates for rich domain entities
- Value Object test patterns
- Invariant validation tests
- Architecture validation scripts

## Anti-Patterns Detected

### ❌ Critical Violations

1. **Data Duplication**: Entity stores both IDs and full objects
2. **Anemic Domain**: Entity is just a data bag without behavior
3. **Primitive Obsession**: Using primitives instead of Value Objects
4. **Infrastructure Dependencies**: Domain layer importing infrastructure code
5. **Optional Properties Without Invariants**: Unclear business rules
6. **Mixed Responsibilities**: Entity doing infrastructure/presentation concerns

## Scoring System

Each entity receives a score (0-100) based on:

| Category | Weight | Criteria |
|----------|--------|----------|
| **Rich Domain** | 40 points | Behavior methods, no setters, encapsulation |
| **SOLID** | 25 points | Single responsibility, dependency inversion |
| **Clean Architecture** | 25 points | Zero external dependencies, layer separation |
| **Testability** | 10 points | Unit tests, coverage |

**Score Classifications:**
- **0-50 (CRITICAL)**: Requires immediate refactoring
- **51-70 (NEEDS ATTENTION)**: Should be refactored soon
- **71-85 (GOOD)**: Minor improvements needed
- **86-100 (EXCELLENT)**: Well-designed entity

## Example Usage

### Audit Single Entity

```
Analyze this entity and provide a refactoring plan:
[paste entity code]
```

### Audit All Entities

```
Audit all entities in src/domain/entities/ and generate a comprehensive report
```

### Refactor Specific Entity

```
Refactor ProductionEntity following DDD and Clean Architecture principles
```

## What You Get

### 1. Executive Summary
- Total entities analyzed
- Distribution (Anemic, Semi-Rich, Rich)
- Critical violations count
- Average quality score
- Prioritized refactoring roadmap

### 2. Detailed Entity Reports
For each problematic entity:
- Current code
- List of violations
- Score breakdown
- Refactored code
- Migration strategy
- Impact assessment

### 3. Complete Refactored Code
- Rich domain entities with behavior
- Value Objects for domain concepts
- Repository interfaces (ports)
- DTOs for different contexts
- Use Cases for orchestration
- Mappers for transformations
- Unit tests

### 4. Architecture Validation
- Dependency rule checker script
- Layer separation validation
- Infrastructure imports detection

## Before & After Example

### Before (Anemic, Score: 25/100)

```typescript
export class ProductionEntity {
  constructor(
    readonly props: {
      id: string;
      status: string;
      task_id: string;
      task?: { id: string; name: string };  // ❌ Duplication
    },
  ) { }
  // No behavior, just data
}
```

### After (Rich Domain, Score: 95/100)

```typescript
export class Production {
  private constructor(
    private readonly id: ProductionId,
    private status: ProductionStatus,
    private readonly taskId: TaskId,
  ) {
    this.ensureInvariants();
  }
  
  // Factory method
  static create(taskId: string): Production {
    return new Production(
      ProductionId.create(),
      ProductionStatus.PENDING,
      TaskId.create(taskId),
    );
  }
  
  // Business behavior
  start(): void {
    if (this.status !== ProductionStatus.PENDING) {
      throw new ProductionAlreadyStartedError();
    }
    this.status = ProductionStatus.IN_PROGRESS;
  }
  
  complete(): void {
    if (this.status !== ProductionStatus.IN_PROGRESS) {
      throw new CannotCompleteNonActiveProductionError();
    }
    this.status = ProductionStatus.COMPLETED;
  }
  
  // Invariants always enforced
  private ensureInvariants(): void {
    if (!this.id) throw new Error('Production must have ID');
    if (!this.taskId) throw new Error('Production must have task');
  }
}
```

## Benefits

### Code Quality
✅ **Higher maintainability**: Business logic centralized in entities  
✅ **Better testability**: Pure domain logic without infrastructure  
✅ **Self-documenting code**: Ubiquitous language in code  
✅ **Type safety**: Value Objects prevent invalid states  

### Architecture
✅ **Clean dependencies**: Domain → Application → Infrastructure  
✅ **Flexibility**: Easy to swap infrastructure (DB, APIs)  
✅ **Scalability**: Clear boundaries enable team scaling  
✅ **Refactoring safety**: Well-tested entities reduce risk  

### Business Alignment
✅ **Domain-driven**: Code reflects business concepts  
✅ **Invariants enforced**: Impossible to create invalid states  
✅ **Behavior encapsulated**: Rules where they belong  
✅ **Clear contracts**: Interfaces define ports  

## Best Practices Enforced

### ✅ DO
- Encapsulate business logic in entities
- Use Value Objects for domain concepts
- Enforce invariants in constructors
- Keep Domain layer dependency-free
- Use repository interfaces (ports)
- Create DTOs in application layer
- Emit domain events for state changes

### ❌ DON'T
- Import infrastructure in domain (Prisma, axios, etc.)
- Put business logic in services
- Use public setters
- Store both IDs and full objects
- Mix domain with DTOs
- Skip validation in Value Objects
- Allow entities to reach invalid states

## Integration with Antigravity

This skill is designed to work seamlessly with Claude Code (Antigravity):

1. **Automatic Detection**: Claude Code will suggest using this skill when you mention entity audits or refactoring
2. **Iterative Workflow**: Audit → Report → Refactor → Test
3. **Code Generation**: Complete refactored code ready to use
4. **Testing Support**: Unit tests generated alongside refactored entities

## Output Files Structure

```
src/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts              # ✅ Rich domain entity
│   ├── value-objects/
│   │   ├── email.vo.ts
│   │   ├── user-id.vo.ts
│   │   └── user-status.vo.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts  # ✅ Port
│   └── events/
│       └── user-created.event.ts
├── application/
│   ├── use-cases/
│   │   └── create-user.use-case.ts
│   ├── dtos/
│   │   └── user-response.dto.ts
│   └── mappers/
│       └── user.mapper.ts
└── infrastructure/
    └── repositories/
        └── user.repository.ts          # ✅ Adapter
```

## License

MIT License - See LICENSE.txt for full details

## Support

For questions or improvements, consult:
- Domain-Driven Design (Eric Evans)
- Clean Architecture (Robert C. Martin)
- Hexagonal Architecture (Alistair Cockburn)

---

**Transform your anemic domain models into rich, maintainable, and well-architected entities with this comprehensive audit and refactoring skill.**
