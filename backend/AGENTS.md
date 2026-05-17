# Backend Agent Context

Use this guide when a task touches `backend/`, backend API contracts, Flyway migrations,
database schema, sync semantics, authentication, push notifications, or backend-facing frontend integration.

## Loading

- This file applies to all work under `backend/`.
- Follow the root `../AGENTS.md` repo-wide rules together with this backend-specific guide.

## Project Snapshot

- Java 21 Spring Boot 4 backend in `backend/`.
- Root Maven project includes `backend` and `frontend` modules.
- Backend package root is `com.delenikov.nmiva`.
- PostgreSQL schema is managed by Flyway migrations in `backend/src/main/resources/db/migration/`.
- API uses JWT bearer authentication through Spring Security.
- Offline sync is a first-class behavior; preserve conflict handling and client/server ID mapping.

## Backend Modules

- `auth`: registration, login, JWT creation, current-user responses, auth filter.
- `config`: security, Jackson, cryptography provider setup.
- `common`: shared API errors, exception mapping, audit base entity.
- `vehicle`: vehicle CRUD and soft-delete behavior.
- `entry`: refuel, service, expense, reminder entries plus fuel/reminder calculations.
- `dashboard`: vehicle summaries, dashboard responses, odometer snapshots.
- `settings`: per-user settings.
- `sync`: offline mutation processing, acknowledgements, conflict handling.
- `notification`: VAPID web push subscriptions, test push, reminder scheduler.
- `user`: user entity and repository.

## Formatting

- Use UTF-8.
- Preserve the surrounding file style when editing existing code.
- For new Java files, prefer IntelliJ IDEA default Java formatting unless the package clearly uses a different style.
- Maximum line length: 120 characters.
- Use blank lines to separate logical blocks.

## Java Style

- Use descriptive names for classes, methods, variables, and constants.
- Avoid `var`; prefer explicit types.
- Prefer `final` method parameters and local variables where practical.
- Prefer immutable request/response shapes.
- Avoid magic numbers and strings; introduce named constants when the value has domain meaning.
- Check emptiness and nullness before collection or string operations.
- Prefer unchecked domain exceptions over broad checked `throws` clauses.
- Avoid comments except for cron expressions, regex patterns, TODOs, or given/when/then separation in tests.
- Use `@Override` when overriding methods.
- Prefer direct `null` checks over `Objects.isNull()` and `Objects.nonNull()` for simple cases.
- Extract complex multi-condition expressions into named boolean variables.
- Prefer early returns and avoid unnecessary `else` blocks.

## Lombok

- Use `@RequiredArgsConstructor` for constructor injection.
- Use `@Slf4j` for logging.
- Use `@Builder(setterPrefix = "with")` for complex object creation when it improves readability and
  matches nearby code.
- Avoid `@Data`; prefer focused `@Getter` and `@Setter` usage.

## Spring Annotations

- Use `@Service` for business logic classes.
- Use `@Repository` for data access classes that extend JPA repositories or directly access the database.
- Use `@RestController` for web controllers.
- Use `@Component` for generic Spring components.
- Use `@Configuration` for Spring configuration classes.
- Prefer constructor injection; avoid `@Autowired` field injection in production code.
- Use `@ConfigurationProperties` for related configuration groups instead of several `@Value` fields.
- Put `@Transactional` on service classes or service methods, not controllers.
- Use `@Validated` where Bean Validation is needed on method parameters or classes.
- Use `@PreAuthorize` at the controller layer when method-level security is appropriate.
- Avoid circular dependencies and avoid using `@Order` to paper over dependency design issues.

## Mapping

- Never expose JPA entities directly from controllers.
- Never accept JPA entities as request payloads.
- Use DTOs or records for API request and response boundaries.
- Keep entities in the persistence layer.
- For new mapping code, follow the feature's existing pattern. If no pattern exists, choose either MapStruct
  or a dedicated static mapper and keep it consistent within that feature.
- MapStruct mappers should use `@Mapper(componentModel = "spring")`, clear names such as `toDto`
  and `toEntity`, and a `Mapper` suffix.
- Static mapper utility classes should have a private constructor that throws `UnsupportedOperationException`.

## Architecture

- Prefer feature-based packaging over technical top-level packages.
- Keep controllers, services, repositories, DTOs, mappers, validations, and exceptions near their owning feature.
- Avoid broad cross-feature dependencies. Extract shared behavior only when it is actually shared.
- Keep controllers thin and put business rules in services or focused domain helpers.
- Avoid large god services. Split unrelated authentication, payment, notification, reporting, export,
  or sync responsibilities into focused services.

## API Design

- Keep existing `/api/...` routes compatible with frontend callers unless the task explicitly asks
  for a breaking change.
- Use REST nouns and HTTP methods: `GET /users/{id}`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`.
- Avoid verb-style endpoint names such as `/getUsers` or `/createUser`.
- Version new public API groups only when the project is ready to do it consistently; do not opportunistically
  rename existing routes to `/api/v1`.
- Use consistent response structures for validation errors, API errors, pagination, and metadata.
- Avoid unbounded large collections; use pagination when a dataset can grow.

## Persistence And Flyway

- Preserve user isolation on every query and mutation. Authenticated endpoints must scope data to the current user.
- Keep soft-delete semantics for vehicles and entries unless the task explicitly changes deletion behavior.
- When adding persistent fields, update the entity, request/response DTOs, mapping, service logic,
  and a new Flyway migration.
- Add new migrations with the next `V#__description.sql` number.
- Do not edit already-applied migrations unless the user explicitly asks for a local reset.
- Keep environment-backed configuration in `application.yml` with safe local defaults only.

## Offline Sync

- Preserve `clientId`, `serverId`, `lastModifiedAt`, operation acknowledgements, and conflict responses.
- Use last-write-wins semantics by `lastModifiedAt` unless explicitly changed.
- Include changed server state in responses when clients need to reconcile.
- Maintain compatibility with IndexedDB/offline clients and frontend sync queue processing.

## Exceptions

- Use custom domain exceptions extending `RuntimeException` where useful.
- Map exceptions centrally through `@RestControllerAdvice` and `@ExceptionHandler`.
- Return appropriate HTTP status codes.
- Keep API error response structures consistent.

## Logging

- Use appropriate levels: `DEBUG`, `INFO`, `WARN`, `ERROR`.
- Include useful context such as module/action and user ID when available.
- Avoid logging secrets, JWTs, VAPID private keys, passwords, or full push subscriptions.
- Use placeholder formatting, for example `log.info("Updated settings for userId={}", userId)`.

## Java Modern Practices

- Prefer records for immutable request and response DTOs.
- Do not use records for JPA entities or mutable domain models.
- Prefer enums over string constants for fixed value sets.

## Testing

- Use JUnit 5.
- Use Mockito for unit tests.
- Use `@WebMvcTest(ControllerClass.class)` for focused MVC controller tests.
- Use `@SpringBootTest` for integration tests that need the Spring context.
- Use given/when/then structure in test methods.
- Test method names may use snake_case or camelCase, but stay consistent in the test class.
- Avoid reflection and business logic in tests.
- Add or update tests when changing business logic in `entry`, `sync`, `notification`, auth/security,
  or persistence behavior.

## Commands

Run backend checks from the repository root:

```powershell
.\mvnw.cmd -pl backend test
```

Run the backend locally from the repository root:

```powershell
.\mvnw.cmd -pl backend spring-boot:run
```

Start the local PostgreSQL container:

```powershell
docker compose -f db.yml up -d
```

## Review Checklist

- API paths and response shapes remain compatible with frontend callers unless the task asks for a breaking change.
- Authenticated user ownership is enforced in repositories/services.
- Flyway migration order is valid and repeatable on an existing database.
- Time and currency logic is deterministic and does not depend on JVM default locale/time zone unless intended.
- Push notification changes handle missing or invalid VAPID configuration gracefully.
