# Nest Testing Module Conventions

Always use `@nestjs/testing` to create isolated testing modules.
Mock external services.

```ts
const moduleRef = await Test.createTestingModule({
  controllers: [MyController],
  providers: [MyService],
}).compile();
```
