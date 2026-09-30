---
name: domain-entities-audit
description: "Audit and refactor backend entities to ensure they follow Domain-Driven Design (DDD), Hexagonal Architecture, Clean Architecture, and SOLID principles. Use this skill when the user asks to: analyze/audit entities, check if entities are anemic or rich domains, refactor domain models, ensure entities follow best practices, eliminate code smells in domain layer, verify architectural boundaries, or validate that domain entities have proper encapsulation and business logic. Also triggers for requests to review entity design, detect duplicated data in entities, extract value objects, or ensure domain layer has zero infrastructure dependencies."
license: MIT
---

# Domain Entities Audit & Refactoring

## Overview

This skill provides a comprehensive framework for auditing backend entities, detecting anemic domain models, identifying architectural violations, and refactoring toward rich domain models following DDD, Hexagonal Architecture, and Clean Architecture principles.

## Quick Reference

| Task | Command |
|------|---------|
| Audit single entity | Analyze specific file and generate report |
| Audit all entities | Scan `src/domain/entities/` or equivalent |
| Detect anemic domains | Check behavior-to-data ratio |
| Check SOLID violations | Verify dependencies and responsibilities |
| Refactor to rich domain | Extract VOs, encapsulate behavior, add invariants |
| Validate architecture | Ensure Domain → Application → Infrastructure flow |

---

## Phase 1: Entity Discovery and Classification

### Step 1.1: Locate All Entities

```bash
# Find all entity files
find src -name "*.entity.ts" -o -name "*Entity.ts"

# Recommended structure
# src/domain/entities/
# src/core/entities/
```

### Step 1.2: Generate Entity Inventory

For each entity, document:

```typescript
interface EntityInventory {
  name: string;                    // Entity name
  location: string;                // File path
  linesOfCode: number;             // Size
  dependencies: string[];          // Imports
  hasTests: boolean;               // Test coverage exists?
  classification: EntityType;      // See below
}

enum EntityType {
  AGGREGATE_ROOT = 'AGGREGATE_ROOT',   // Main entity with identity
  ENTITY = 'ENTITY',                   // Has identity, belongs to aggregate
  VALUE_OBJECT = 'VALUE_OBJECT',       // No identity, immutable
  DTO = 'DTO',                         // Transfer object (should NOT be in domain!)
  UNDEFINED = 'UNDEFINED',             // Needs deeper analysis
}
```

### Step 1.3: Initial Classification

Classify each entity:

- **Aggregate Root**: Primary entity with unique identity managing a cluster of objects
- **Entity**: Has identity but belongs to an aggregate
- **Value Object**: Defined by attributes, immutable, no identity
- **DTO**: Data transfer object (RED FLAG if found in `domain/`)
- **Undefined**: Mixed responsibilities, needs refactoring

---

## Phase 2: Violation Detection

### Critical Anti-Patterns Checklist

#### ❌ ANTI-PATTERN 1: Data Duplication

**Problem**: Entity stores both IDs and full objects

```typescript
// ❌ VIOLATION
export class ProductionEntity {
  task_id: string;
  task?: { id: string; name: string };  // Duplication!
  
  towers: string[];
  towers_details?: { id: string; tower_number: string }[];  // Duplication!
}
```

**Solution**: Remove duplicated objects, keep only IDs

```typescript
// ✅ CORRECT
export class Production {
  private constructor(
    private readonly id: ProductionId,
    private readonly taskId: TaskId,
    private readonly towerIds: TowerId[],
    private status: ProductionStatus,
  ) {}
  
  getTaskId(): string {
    return this.taskId.getValue();
  }
  
  getTowerIds(): string[] {
    return this.towerIds.map(id => id.getValue());
  }
}
```

**Aggregation in Application Layer**:

```typescript
// Application/Use Case
export class GetProductionWithDetailsUseCase {
  async execute(id: string): Promise<ProductionDetailsDTO> {
    const production = await this.productionRepo.findById(id);
    const task = await this.taskRepo.findById(production.getTaskId());
    const towers = await this.towerRepo.findByIds(production.getTowerIds());
    
    return ProductionMapper.toDetailsDTO(production, task, towers);
  }
}
```

---

#### ❌ ANTI-PATTERN 2: Anemic Domain Model

**Problem**: Entity is just a data bag with getters/setters, no behavior

```typescript
// ❌ ANEMIC - Just data, no business logic
export class Order {
  public id: string;
  public status: string;
  public total: number;
  public items: any[];
  
  getStatus() { return this.status; }
  setStatus(s: string) { this.status = s; }  // No validation!
}

// Business logic leaks to Service layer
class OrderService {
  approveOrder(order: Order) {
    if (order.status !== 'PENDING') {
      throw new Error('Invalid state');
    }
    order.setStatus('APPROVED');  // Service manipulating entity state
  }
}
```

**Solution**: Rich domain with encapsulated behavior

```typescript
// ✅ RICH DOMAIN - Business logic inside entity
export class Order {
  private constructor(
    private readonly id: OrderId,
    private status: OrderStatus,
    private items: OrderItem[],
  ) {
    this.ensureInvariants();
  }
  
  // Factory method
  static create(items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new EmptyOrderError();
    }
    return new Order(OrderId.create(), OrderStatus.PENDING, items);
  }
  
  // Business behavior
  approve(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError('Can only approve pending orders');
    }
    this.status = OrderStatus.APPROVED;
    // Could emit domain event: this.addDomainEvent(new OrderApprovedEvent(this.id))
  }
  
  cancel(reason: string): void {
    if (this.status === OrderStatus.SHIPPED) {
      throw new CannotCancelShippedOrderError();
    }
    this.status = OrderStatus.CANCELLED;
  }
  
  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new CannotModifyNonPendingOrderError();
    }
    this.items.push(item);
  }
  
  calculateTotal(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      Money.zero()
    );
  }
  
  // Invariants always maintained
  private ensureInvariants(): void {
    if (!this.id) throw new Error('Order must have ID');
    if (!this.items || this.items.length === 0) {
      throw new Error('Order must have at least one item');
    }
  }
  
  // Queries (no setters!)
  getId(): string { return this.id.getValue(); }
  getStatus(): OrderStatus { return this.status; }
  isApproved(): boolean { return this.status === OrderStatus.APPROVED; }
}
```

**Anemic vs Rich Metrics**:

| Metric | Anemic | Rich |
|--------|--------|------|
| **Behavior methods** | 0-2 | 5+ |
| **Public setters** | Many | None/Few |
| **Validations** | External (in services) | Encapsulated |
| **Business rules** | In application/service layer | In entity |
| **Invariants** | Not guaranteed | Always valid |
| **Immutability** | Mutated freely | Controlled state changes |

---

#### ❌ ANTI-PATTERN 3: Primitive Obsession

**Problem**: Using primitive types instead of Value Objects

```typescript
// ❌ VIOLATION - Primitives everywhere
export class User {
  email: string;           // No validation
  age: number;             // No business rules
  status: string;          // Magic strings
  createdAt: Date;
}

// Validation scattered in services
class UserService {
  createUser(email: string) {
    if (!email.includes('@')) {  // ❌ Validation outside domain
      throw new Error('Invalid email');
    }
    // ...
  }
}
```

**Solution**: Value Objects with encapsulated rules

```typescript
// ✅ CORRECT - Value Objects

// Email VO with validation
export class Email {
  private constructor(private readonly value: string) {}
  
  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailError(email);
    }
    return new Email(email.toLowerCase().trim());
  }
  
  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  getValue(): string {
    return this.value;
  }
  
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

// Age VO with business rules
export class Age {
  private constructor(private readonly value: number) {}
  
  static create(age: number): Age {
    if (age < 0 || age > 150) {
      throw new InvalidAgeError(age);
    }
    return new Age(age);
  }
  
  isAdult(): boolean {
    return this.value >= 18;
  }
  
  getValue(): number {
    return this.value;
  }
}

// UserStatus enum/VO
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Rich User entity using VOs
export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,        // ✅ Validated VO
    private age: Age,             // ✅ Business rules
    private status: UserStatus,   // ✅ Type-safe
    private readonly createdAt: Date,
  ) {}
  
  static create(email: string, age: number): User {
    return new User(
      UserId.create(),
      Email.create(email),      // Validation happens here
      Age.create(age),          // Rules enforced
      UserStatus.ACTIVE,
      new Date(),
    );
  }
}
```

---

#### ❌ ANTI-PATTERN 4: Infrastructure Dependencies in Domain

**Problem**: Domain layer knows about infrastructure

```typescript
// ❌ CRITICAL VIOLATION
import { PrismaClient } from '@prisma/client';  // ❌ Domain importing infra!
import axios from 'axios';                       // ❌ Domain knowing HTTP!

export class User {
  async save(prisma: PrismaClient) {  // ❌ Persistence logic in entity
    await prisma.user.create({ data: this });
  }
  
  async sendWelcomeEmail() {  // ❌ Infrastructure concern
    await axios.post('/api/emails', { to: this.email });
  }
}
```

**Solution**: Dependency Inversion Principle

```typescript
// ✅ CORRECT - Domain has zero infrastructure dependencies

// Domain layer (src/domain/)
export class User {
  // Only domain logic, no infrastructure
  changeEmail(newEmail: Email): void {
    if (!this.isActive()) {
      throw new InactiveUserCannotChangeEmailError();
    }
    this.email = newEmail;
    // Emit domain event instead of calling infra directly
    this.addDomainEvent(new UserEmailChangedEvent(this.id, newEmail));
  }
}

// Domain interface (Port)
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

// Infrastructure layer (src/infrastructure/)
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}  // ✅ Infra knows about Prisma
  
  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: UserMapper.toPersistence(user),
    });
  }
}

// Application layer (src/application/)
export class ChangeUserEmailUseCase {
  constructor(
    private userRepo: IUserRepository,  // ✅ Depends on abstraction
    private emailService: IEmailService,
  ) {}
  
  async execute(userId: string, newEmail: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    user.changeEmail(Email.create(newEmail));
    await this.userRepo.save(user);
    
    // Handle domain events
    for (const event of user.getDomainEvents()) {
      if (event instanceof UserEmailChangedEvent) {
        await this.emailService.sendEmailChangedNotification(user);
      }
    }
  }
}
```

**Dependency Flow (Clean Architecture)**:

```
┌────────────────────────────────────────┐
│   Infrastructure (Adapters)           │
│   - PostgresUserRepository            │
│   - SendGridEmailService              │
│   - ExpressController                 │
└──────────┬─────────────────────────────┘
           │ depends on ↓
┌──────────▼─────────────────────────────┐
│   Application (Use Cases)              │
│   - ChangeUserEmailUseCase            │
│   - CreateUserUseCase                 │
└──────────┬─────────────────────────────┘
           │ depends on ↓
┌──────────▼─────────────────────────────┐
│   Domain (Entities, VOs, Rules)        │  ✅ ZERO dependencies
│   - User                               │
│   - Email (VO)                         │
│   - IUserRepository (interface)        │
└────────────────────────────────────────┘
```

---

#### ❌ ANTI-PATTERN 5: Optional Properties Without Invariants

**Problem**: Optional properties with unclear business rules

```typescript
// ❌ VIOLATION - When is it present? When not?
export class Production {
  status: string;
  start_time?: Date;     // Optional but when?
  final_time?: Date;     // What's the rule?
  percentage?: number;   // Can it be null when status is 'COMPLETED'?
}
```

**Solution**: Explicit state modeling

```typescript
// ✅ CORRECT - Option A: Make rules explicit
export class Production {
  private constructor(
    private readonly id: ProductionId,
    private status: ProductionStatus,
    private startTime: Date | null,
    private finalTime: Date | null,
    private percentage: Percentage,
  ) {
    this.ensureInvariants();
  }
  
  start(): void {
    if (this.status !== ProductionStatus.PENDING) {
      throw new ProductionAlreadyStartedError();
    }
    this.status = ProductionStatus.IN_PROGRESS;
    this.startTime = new Date();
    this.percentage = Percentage.create(0);
  }
  
  complete(): void {
    if (!this.startTime) {
      throw new CannotCompleteNotStartedProductionError();
    }
    this.status = ProductionStatus.COMPLETED;
    this.finalTime = new Date();
    this.percentage = Percentage.create(100);
  }
  
  // Invariants ensure consistency
  private ensureInvariants(): void {
    // Rule: IN_PROGRESS must have start_time
    if (this.status === ProductionStatus.IN_PROGRESS && !this.startTime) {
      throw new Error('In-progress production must have start time');
    }
    
    // Rule: COMPLETED must have both times and 100%
    if (this.status === ProductionStatus.COMPLETED) {
      if (!this.startTime || !this.finalTime) {
        throw new Error('Completed production must have start and final times');
      }
      if (this.percentage.getValue() !== 100) {
        throw new Error('Completed production must be 100%');
      }
    }
  }
}

// ✅ CORRECT - Option B: State Pattern
interface ProductionState {
  canStart(): boolean;
  canComplete(): boolean;
  getPercentage(): number;
}

class PendingProduction implements ProductionState {
  canStart() { return true; }
  canComplete() { return false; }
  getPercentage() { return 0; }
}

class InProgressProduction implements ProductionState {
  constructor(private startTime: Date) {}
  canStart() { return false; }
  canComplete() { return true; }
  getPercentage() { return 50; }  // Example
}

class CompletedProduction implements ProductionState {
  constructor(
    private startTime: Date,
    private finalTime: Date,
  ) {}
  canStart() { return false; }
  canComplete() { return false; }
  getPercentage() { return 100; }
}
```

---

#### ❌ ANTI-PATTERN 6: Mixed Responsibilities

**Problem**: Entity doing too many things

```typescript
// ❌ VIOLATION - God Object
export class User {
  // ✅ OK - Domain logic
  validatePassword(pwd: string): boolean { }
  
  // ❌ Infrastructure concern
  hashPassword(pwd: string): string {
    return bcrypt.hashSync(pwd, 10);
  }
  
  // ❌ Application concern
  sendEmail(msg: string): void {
    emailService.send(this.email, msg);
  }
  
  // ❌ Presentation concern
  toJSON(): object {
    return { id: this.id, email: this.email };
  }
}
```

**Solution**: Separate concerns by layer

```typescript
// ✅ Domain Layer - Only business logic
export class User {
  changePassword(current: Password, newPwd: Password): void {
    if (!this.password.matches(current)) {
      throw new InvalidPasswordError();
    }
    this.password = newPwd;  // Password VO handles hashing internally
  }
}

// ✅ Domain Value Object - Encapsulates hashing
export class Password {
  private constructor(private readonly hash: string) {}
  
  static create(plaintext: string): Password {
    // Validation
    if (plaintext.length < 8) {
      throw new PasswordTooShortError();
    }
    // Hash (infrastructure detail hidden in VO)
    return new Password(bcrypt.hashSync(plaintext, 10));
  }
  
  matches(plaintext: string): boolean {
    return bcrypt.compareSync(plaintext, this.hash);
  }
}

// ✅ Application Layer - DTOs
export class UserResponseDTO {
  id: string;
  email: string;
  status: string;
}

// ✅ Application Layer - Mapper
export class UserMapper {
  static toResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.getId(),
      email: user.getEmail(),
      status: user.getStatus(),
    };
  }
}

// ✅ Infrastructure Layer - Email service
export class SendGridEmailService implements IEmailService {
  async sendPasswordChangedNotification(user: User): Promise<void> {
    // Infrastructure details
  }
}
```

---

## Phase 3: Scoring System

### Calculate Entity Quality Score (0-100)

For each entity, calculate:

```typescript
interface EntityScore {
  total: number;  // 0-100
  breakdown: {
    richDomain: number;        // 0-40 points
    solid: number;             // 0-25 points
    cleanArchitecture: number; // 0-25 points
    testability: number;       // 0-10 points
  };
  classification: 'CRITICAL' | 'NEEDS_ATTENTION' | 'GOOD' | 'EXCELLENT';
}
```

#### Rich Domain Score (40 points)

| Criteria | Points |
|----------|--------|
| 5+ behavior methods | 15 |
| No public setters | 10 |
| Encapsulated validations | 5 |
| Uses Value Objects | 5 |
| Invariants enforced | 5 |

#### SOLID Score (25 points)

| Criteria | Points |
|----------|--------|
| Single Responsibility | 10 |
| No infrastructure deps | 10 |
| Dependency Inversion (uses interfaces) | 5 |

#### Clean Architecture Score (25 points)

| Criteria | Points |
|----------|--------|
| Zero external dependencies | 15 |
| Proper layer separation | 10 |

#### Testability Score (10 points)

| Criteria | Points |
|----------|--------|
| Has unit tests | 5 |
| >80% test coverage | 5 |

### Score Classification

- **0-50 (CRITICAL)**: Requires immediate refactoring
- **51-70 (NEEDS ATTENTION)**: Should be refactored soon
- **71-85 (GOOD)**: Minor improvements needed
- **86-100 (EXCELLENT)**: Well-designed, minimal changes

---

## Phase 4: Refactoring Workflow

### Step 4.1: Prioritize Refactoring

Sort entities by:
1. Score (lowest first)
2. Impact (high-traffic entities first)
3. Risk (core business logic first)

### Step 4.2: Refactoring Checklist

For each entity with score < 70:

#### A. Extract Value Objects

```bash
# Before refactoring
# User.ts has: email: string, age: number

# After refactoring, create:
# src/domain/value-objects/email.vo.ts
# src/domain/value-objects/age.vo.ts
# src/domain/value-objects/user-id.vo.ts
```

#### B. Move Business Logic from Services to Entity

```typescript
// BEFORE: Logic in Service
class UserService {
  activateUser(userId: string) {
    const user = await this.repo.findById(userId);
    if (user.status === 'SUSPENDED') {
      throw new Error('Cannot activate suspended user');
    }
    user.status = 'ACTIVE';
    await this.repo.save(user);
  }
}

// AFTER: Logic in Entity
class User {
  activate(): void {
    if (this.status === UserStatus.SUSPENDED) {
      throw new CannotActivateSuspendedUserError();
    }
    if (this.status === UserStatus.ACTIVE) {
      throw new UserAlreadyActiveError();
    }
    this.status = UserStatus.ACTIVE;
  }
}

class ActivateUserUseCase {
  async execute(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    user.activate();  // ✅ Business logic in entity
    await this.userRepo.save(user);
  }
}
```

#### C. Create Repository Interfaces (Ports)

```typescript
// src/domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: string): Promise<void>;
}
```

#### D. Implement Repositories (Adapters)

```typescript
// src/infrastructure/repositories/user.repository.ts
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
  
  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }
}
```

#### E. Create DTOs for Different Contexts

```typescript
// src/application/dtos/user-response.dto.ts
export class UserResponseDTO {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
}

// src/application/dtos/user-with-profile.dto.ts
export class UserWithProfileDTO extends UserResponseDTO {
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

// src/application/dtos/create-user.dto.ts
export class CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
```

#### F. Implement Use Cases

```typescript
// src/application/use-cases/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService,
  ) {}
  
  async execute(dto: CreateUserDTO): Promise<UserResponseDTO> {
    // Check business rules
    const existing = await this.userRepo.findByEmail(
      Email.create(dto.email)
    );
    if (existing) {
      throw new EmailAlreadyExistsError();
    }
    
    // Create domain entity
    const user = User.create({
      email: dto.email,
      password: dto.password,
    });
    
    // Persist
    await this.userRepo.save(user);
    
    // Side effects
    await this.emailService.sendWelcomeEmail(user);
    
    // Return DTO
    return UserMapper.toResponseDTO(user);
  }
}
```

### Step 4.3: Remove Data Duplication

```typescript
// BEFORE: Duplication
class Production {
  task_id: string;
  task?: { id: string; name: string };
}

// AFTER: Clean entity
class Production {
  private readonly taskId: TaskId;
  
  getTaskId(): string {
    return this.taskId.getValue();
  }
}

// Aggregation in Use Case
class GetProductionWithDetailsUseCase {
  async execute(id: string): Promise<ProductionDetailsDTO> {
    const production = await this.productionRepo.findById(id);
    const task = await this.taskRepo.findById(production.getTaskId());
    
    return {
      id: production.getId(),
      status: production.getStatus(),
      task: {
        id: task.getId(),
        name: task.getName(),
      },
    };
  }
}
```

---

## Phase 5: Testing Rich Domains

### Unit Test Template

```typescript
describe('User Entity', () => {
  describe('Creation', () => {
    it('should create user with valid data', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      
      expect(user).toBeDefined();
      expect(user.getEmail()).toBe('test@example.com');
      expect(user.isActive()).toBe(true);
    });
    
    it('should throw error for invalid email', () => {
      expect(() => {
        User.create({
          email: 'invalid-email',
          password: 'SecurePass123!',
        });
      }).toThrow(InvalidEmailError);
    });
    
    it('should throw error for weak password', () => {
      expect(() => {
        User.create({
          email: 'test@example.com',
          password: '123',
        });
      }).toThrow(PasswordTooShortError);
    });
  });
  
  describe('Business Rules', () => {
    it('should activate inactive user', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'pass',
      });
      user.deactivate();
      
      expect(user.isActive()).toBe(false);
      
      user.activate();
      expect(user.isActive()).toBe(true);
    });
    
    it('should not activate already active user', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'pass',
      });
      
      expect(() => user.activate()).toThrow(UserAlreadyActiveError);
    });
    
    it('should not allow email change for inactive users', () => {
      const user = User.create({
        email: 'old@example.com',
        password: 'pass',
      });
      user.deactivate();
      
      expect(() => {
        user.changeEmail(Email.create('new@example.com'));
      }).toThrow(InactiveUserCannotChangeEmailError);
    });
  });
  
  describe('Invariants', () => {
    it('should always maintain valid state', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'pass',
      });
      
      // Entity can NEVER be in invalid state
      expect(user.getId()).toBeDefined();
      expect(user.getEmail()).toBeDefined();
      expect(() => user.getEmail()).not.toThrow();
    });
  });
});
```

### Value Object Tests

```typescript
describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.getValue()).toBe('test@example.com');
  });
  
  it('should normalize email', () => {
    const email = Email.create('  TEST@EXAMPLE.COM  ');
    expect(email.getValue()).toBe('test@example.com');
  });
  
  it('should reject invalid emails', () => {
    expect(() => Email.create('invalid')).toThrow(InvalidEmailError);
    expect(() => Email.create('')).toThrow(InvalidEmailError);
    expect(() => Email.create('test@')).toThrow(InvalidEmailError);
  });
  
  it('should support equality comparison', () => {
    const email1 = Email.create('test@example.com');
    const email2 = Email.create('test@example.com');
    const email3 = Email.create('other@example.com');
    
    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
  });
});
```

---

## Phase 6: Architecture Validation

### Dependency Rule Checker

Create a script to validate dependencies:

```typescript
// scripts/validate-architecture.ts
import * as fs from 'fs';
import * as path from 'path';

// Forbidden imports in domain layer
const DOMAIN_FORBIDDEN_IMPORTS = [
  'prisma',
  'typeorm',
  'mongoose',
  'axios',
  'express',
  'fastify',
  '@nestjs',
  'sequelize',
];

function validateDomainLayer(domainPath: string): void {
  const files = getAllTsFiles(domainPath);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    
    for (const imp of imports) {
      for (const forbidden of DOMAIN_FORBIDDEN_IMPORTS) {
        if (imp.includes(forbidden)) {
          console.error(
            `❌ VIOLATION: ${file} imports infrastructure: ${imp}`
          );
          process.exit(1);
        }
      }
    }
  }
  
  console.log('✅ Domain layer has zero infrastructure dependencies');
}

function extractImports(content: string): string[] {
  const importRegex = /import .* from ['"](.+)['"]/g;
  const matches = content.matchAll(importRegex);
  return Array.from(matches).map(m => m[1]);
}

validateDomainLayer('src/domain');
```

Run validation:

```bash
npx ts-node scripts/validate-architecture.ts
```

---

## Phase 7: Complete Refactoring Example

### Before: Anemic Production Entity

```typescript
// ❌ BEFORE - Anemic, with violations
export class ProductionEntity {
  constructor(
    readonly props: {
      id: string;
      status: STATUS_PRODUCTION;
      comments?: string | null;
      start_time?: Date | null;
      final_time?: Date | null;
      task_id: string;
      work_id: string;
      teams: string[];
      towers: string[];
      percentage?: number | null;
      createdAt: Date;
      task?: { id: string; name: string };  // ❌ Duplication
      towers_details?: { id: string; tower_number: string }[];  // ❌ Duplication
    },
  ) { }
  
  // No behavior, just data
}

// Business logic in service
class ProductionService {
  async startProduction(id: string) {
    const production = await this.repo.findById(id);
    if (production.props.status !== 'PENDING') {
      throw new Error('Already started');
    }
    production.props.status = 'IN_PROGRESS';
    production.props.start_time = new Date();
    await this.repo.save(production);
  }
}
```

### After: Rich Production Entity

```typescript
// ✅ AFTER - Rich Domain

// Value Objects
export class ProductionId {
  private constructor(private readonly value: string) {}
  static create(id?: string): ProductionId {
    return new ProductionId(id || crypto.randomUUID());
  }
  getValue(): string { return this.value; }
}

export class TaskId {
  private constructor(private readonly value: string) {}
  static create(id: string): TaskId {
    if (!id) throw new Error('TaskId cannot be empty');
    return new TaskId(id);
  }
  getValue(): string { return this.value; }
}

export class TowerId {
  private constructor(private readonly value: string) {}
  static create(id: string): TowerId {
    if (!id) throw new Error('TowerId cannot be empty');
    return new TowerId(id);
  }
  getValue(): string { return this.value; }
}

export class Percentage {
  private constructor(private readonly value: number) {}
  
  static create(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new InvalidPercentageError(value);
    }
    return new Percentage(value);
  }
  
  getValue(): number { return this.value; }
  isComplete(): boolean { return this.value === 100; }
}

export enum ProductionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Rich Entity
export class Production {
  private constructor(
    private readonly id: ProductionId,
    private status: ProductionStatus,
    private readonly taskId: TaskId,
    private readonly workId: WorkId,
    private readonly teamIds: TeamId[],
    private readonly towerIds: TowerId[],
    private comments: string | null,
    private startTime: Date | null,
    private finalTime: Date | null,
    private percentage: Percentage,
    private readonly createdAt: Date,
  ) {
    this.ensureInvariants();
  }
  
  // Factory Methods
  static create(props: {
    taskId: string;
    workId: string;
    teamIds: string[];
    towerIds: string[];
  }): Production {
    return new Production(
      ProductionId.create(),
      ProductionStatus.PENDING,
      TaskId.create(props.taskId),
      WorkId.create(props.workId),
      props.teamIds.map(TeamId.create),
      props.towerIds.map(TowerId.create),
      null,
      null,
      null,
      Percentage.create(0),
      new Date(),
    );
  }
  
  static reconstitute(props: {
    id: string;
    status: ProductionStatus;
    taskId: string;
    workId: string;
    teamIds: string[];
    towerIds: string[];
    comments: string | null;
    startTime: Date | null;
    finalTime: Date | null;
    percentage: number;
    createdAt: Date;
  }): Production {
    return new Production(
      ProductionId.create(props.id),
      props.status,
      TaskId.create(props.taskId),
      WorkId.create(props.workId),
      props.teamIds.map(TeamId.create),
      props.towerIds.map(TowerId.create),
      props.comments,
      props.startTime,
      props.finalTime,
      Percentage.create(props.percentage),
      props.createdAt,
    );
  }
  
  // Business Behaviors
  start(): void {
    if (this.status !== ProductionStatus.PENDING) {
      throw new ProductionAlreadyStartedError(this.id.getValue());
    }
    
    this.status = ProductionStatus.IN_PROGRESS;
    this.startTime = new Date();
    this.percentage = Percentage.create(0);
  }
  
  pause(reason: string): void {
    if (this.status !== ProductionStatus.IN_PROGRESS) {
      throw new CannotPauseNonActiveProductionError();
    }
    
    this.status = ProductionStatus.PAUSED;
    this.comments = `Paused: ${reason}`;
  }
  
  resume(): void {
    if (this.status !== ProductionStatus.PAUSED) {
      throw new CannotResumeNonPausedProductionError();
    }
    
    this.status = ProductionStatus.IN_PROGRESS;
  }
  
  complete(): void {
    if (this.status !== ProductionStatus.IN_PROGRESS) {
      throw new CannotCompleteNonActiveProductionError();
    }
    
    if (!this.startTime) {
      throw new CannotCompleteNotStartedProductionError();
    }
    
    this.status = ProductionStatus.COMPLETED;
    this.finalTime = new Date();
    this.percentage = Percentage.create(100);
  }
  
  updateProgress(newPercentage: number): void {
    if (this.status !== ProductionStatus.IN_PROGRESS) {
      throw new CannotUpdateProgressOfInactiveProductionError();
    }
    
    const percentage = Percentage.create(newPercentage);
    
    if (percentage.getValue() < this.percentage.getValue()) {
      throw new PercentageCannotDecreaseError();
    }
    
    this.percentage = percentage;
  }
  
  addComment(comment: string): void {
    if (!comment || comment.trim().length === 0) {
      throw new EmptyCommentError();
    }
    
    this.comments = comment;
  }
  
  cancel(reason: string): void {
    if (this.status === ProductionStatus.COMPLETED) {
      throw new CannotCancelCompletedProductionError();
    }
    
    this.status = ProductionStatus.CANCELLED;
    this.comments = `Cancelled: ${reason}`;
  }
  
  // Queries
  getId(): string {
    return this.id.getValue();
  }
  
  getTaskId(): string {
    return this.taskId.getValue();
  }
  
  getWorkId(): string {
    return this.workId.getValue();
  }
  
  getTowerIds(): string[] {
    return this.towerIds.map(id => id.getValue());
  }
  
  getTeamIds(): string[] {
    return this.teamIds.map(id => id.getValue());
  }
  
  getStatus(): ProductionStatus {
    return this.status;
  }
  
  getPercentage(): number {
    return this.percentage.getValue();
  }
  
  isInProgress(): boolean {
    return this.status === ProductionStatus.IN_PROGRESS;
  }
  
  isCompleted(): boolean {
    return this.status === ProductionStatus.COMPLETED;
  }
  
  getDuration(): number | null {
    if (!this.startTime || !this.finalTime) {
      return null;
    }
    return this.finalTime.getTime() - this.startTime.getTime();
  }
  
  // Invariants
  private ensureInvariants(): void {
    if (!this.id) {
      throw new Error('Production must have an ID');
    }
    
    if (!this.taskId) {
      throw new Error('Production must have a task');
    }
    
    if (this.towerIds.length === 0) {
      throw new Error('Production must have at least one tower');
    }
    
    if (this.status === ProductionStatus.IN_PROGRESS && !this.startTime) {
      throw new Error('In-progress production must have start time');
    }
    
    if (this.status === ProductionStatus.COMPLETED) {
      if (!this.startTime || !this.finalTime) {
        throw new Error('Completed production must have start and final times');
      }
      if (this.percentage.getValue() !== 100) {
        throw new Error('Completed production must be 100%');
      }
    }
  }
}

// Repository Interface (Port)
export interface IProductionRepository {
  save(production: Production): Promise<void>;
  findById(id: string): Promise<Production | null>;
  findByTaskId(taskId: string): Promise<Production[]>;
  findInProgress(): Promise<Production[]>;
}

// DTOs
export class ProductionResponseDTO {
  id: string;
  status: string;
  taskId: string;
  workId: string;
  percentage: number;
  startTime: Date | null;
  finalTime: Date | null;
  comments: string | null;
}

export class ProductionDetailsDTO extends ProductionResponseDTO {
  task: {
    id: string;
    name: string;
  };
  towers: Array<{
    id: string;
    towerNumber: string;
  }>;
}

// Use Cases
export class StartProductionUseCase {
  constructor(private productionRepo: IProductionRepository) {}
  
  async execute(productionId: string): Promise<void> {
    const production = await this.productionRepo.findById(productionId);
    
    if (!production) {
      throw new ProductionNotFoundError(productionId);
    }
    
    production.start();  // ✅ Business logic in entity
    await this.productionRepo.save(production);
  }
}

export class GetProductionWithDetailsUseCase {
  constructor(
    private productionRepo: IProductionRepository,
    private taskRepo: ITaskRepository,
    private towerRepo: ITowerRepository,
  ) {}
  
  async execute(id: string): Promise<ProductionDetailsDTO> {
    const production = await this.productionRepo.findById(id);
    
    if (!production) {
      throw new ProductionNotFoundError(id);
    }
    
    // Fetch related data
    const task = await this.taskRepo.findById(production.getTaskId());
    const towers = await this.towerRepo.findByIds(production.getTowerIds());
    
    // Aggregate in DTO
    return {
      id: production.getId(),
      status: production.getStatus(),
      taskId: production.getTaskId(),
      workId: production.getWorkId(),
      percentage: production.getPercentage(),
      startTime: production['startTime'],  // Access private via mapper
      finalTime: production['finalTime'],
      comments: production['comments'],
      task: {
        id: task.getId(),
        name: task.getName(),
      },
      towers: towers.map(t => ({
        id: t.getId(),
        towerNumber: t.getTowerNumber(),
      })),
    };
  }
}

// Mapper
export class ProductionMapper {
  static toPersistence(production: Production): any {
    return {
      id: production.getId(),
      status: production.getStatus(),
      task_id: production.getTaskId(),
      work_id: production.getWorkId(),
      team_ids: production.getTeamIds(),
      tower_ids: production.getTowerIds(),
      percentage: production.getPercentage(),
      // ... other fields
    };
  }
  
  static toDomain(raw: any): Production {
    return Production.reconstitute({
      id: raw.id,
      status: raw.status,
      taskId: raw.task_id,
      workId: raw.work_id,
      teamIds: raw.team_ids,
      towerIds: raw.tower_ids,
      comments: raw.comments,
      startTime: raw.start_time,
      finalTime: raw.final_time,
      percentage: raw.percentage,
      createdAt: raw.created_at,
    });
  }
  
  static toResponseDTO(production: Production): ProductionResponseDTO {
    return {
      id: production.getId(),
      status: production.getStatus(),
      taskId: production.getTaskId(),
      workId: production.getWorkId(),
      percentage: production.getPercentage(),
      startTime: production['startTime'],
      finalTime: production['finalTime'],
      comments: production['comments'],
    };
  }
}
```

---

## Phase 8: Final Report Template

Generate a comprehensive report:

```markdown
# Domain Entities Audit Report

**Project:** [Project Name]
**Date:** [Date]
**Auditor:** [Name]

## Executive Summary

### Statistics
- **Total Entities Analyzed:** 25
- **Anemic Domains:** 15 (60%)
- **Semi-Rich Domains:** 7 (28%)
- **Rich Domains:** 3 (12%)

### Critical Violations
- **Data Duplication:** 12 entities
- **Infrastructure Dependencies:** 8 entities
- **Missing Value Objects:** 20 entities
- **No Invariants:** 18 entities

### Average Score: 45/100
- **Critical (0-50):** 15 entities
- **Needs Attention (51-70):** 7 entities
- **Good (71-85):** 2 entities
- **Excellent (86-100):** 1 entity

## Top Priority Refactorings

### 1. ProductionEntity (Score: 25/100) - CRITICAL
**Violations:**
- ❌ Anemic domain (0 behaviors)
- ❌ Data duplication (task, towers_details)
- ❌ No value objects
- ❌ No invariants
- ❌ Public mutable properties

**Impact:** High (core business entity)
**Effort:** 3 days
**Priority:** CRITICAL

### 2. OrderEntity (Score: 30/100) - CRITICAL
**Violations:**
- ❌ Anemic domain
- ❌ Infrastructure dependency (imports Prisma)
- ❌ Business logic in services

**Impact:** High
**Effort:** 2 days
**Priority:** CRITICAL

## Refactoring Roadmap

### Sprint 1 (Week 1-2) - Critical Fixes
- [ ] Refactor ProductionEntity (3 days)
- [ ] Refactor OrderEntity (2 days)
- [ ] Create base Value Objects library (2 days)

### Sprint 2 (Week 3-4) - High Priority
- [ ] Refactor UserEntity (2 days)
- [ ] Refactor InvoiceEntity (2 days)
- [ ] Implement Repository interfaces (3 days)

### Sprint 3 (Week 5-6) - Medium Priority
- [ ] Refactor remaining anemic entities
- [ ] Add comprehensive tests
- [ ] Documentation

## Architectural Improvements

### Current State Issues
1. Domain layer has Prisma imports (8 files)
2. No repository interfaces (0 abstractions)
3. Business logic in service layer (15 services)

### Target State
1. ✅ Domain layer with zero dependencies
2. ✅ Repository pattern with interfaces
3. ✅ Business logic in entities
4. ✅ Use Cases orchestrate, don't implement logic

## Appendix: Detailed Entity Reports

[Include individual entity analysis...]
```

---

## Best Practices Summary

### ✅ DO

1. **Rich Domain Models**
   - Encapsulate business logic in entities
   - Use factory methods for creation
   - Enforce invariants in constructors
   - Emit domain events for state changes

2. **Value Objects**
   - Create VOs for domain concepts
   - Validate in VO constructors
   - Make VOs immutable
   - Implement equality methods

3. **Clean Architecture**
   - Domain has ZERO external dependencies
   - Use repository interfaces (ports)
   - Implement in infrastructure (adapters)
   - Keep DTOs in application layer

4. **SOLID Principles**
   - Single Responsibility per entity
   - Depend on abstractions, not implementations
   - Use composition over inheritance

### ❌ DON'T

1. **Never in Domain Layer**
   - ❌ Import infrastructure (Prisma, TypeORM, etc.)
   - ❌ Import HTTP libraries (axios, express)
   - ❌ Import UI frameworks
   - ❌ Put DTOs or mappers

2. **Avoid Anemic Models**
   - ❌ Public setters
   - ❌ Business logic in services
   - ❌ No validation

3. **No Data Duplication**
   - ❌ Store IDs AND objects
   - ❌ Optional properties without rules

---

## Conclusion

This skill provides a systematic approach to auditing and refactoring backend entities toward rich domain models that follow DDD, Hexagonal Architecture, and Clean Architecture principles. Use this workflow to transform anemic, tightly-coupled entities into well-designed, maintainable, and testable domain models.

For questions or assistance, consult the DDD and Clean Architecture literature or seek architectural review.
