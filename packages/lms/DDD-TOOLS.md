# Практические инструменты для DDD трансформации

## 1. Диагностические инструменты

### 1.1 Аудит текущего состояния кода

#### Чек-лист "Code Smells" в сервис-ориентированном коде

```
ПРОБЛЕМЫ СТРУКТУРЫ:
□ Более 80% бизнес-логики находится в @Service классах
□ Entity классы содержат только getters/setters (anemic model)
□ Контроллеры содержат валидацию и бизнес-правила
□ Один сервис имеет более 10 публичных методов
□ Методы сервисов длиннее 20 строк

ПРОБЛЕМЫ ДУБЛИРОВАНИЯ:
□ Одинаковые валидации в разных местах
□ Похожая логика в разных сервисах
□ Копирование кода между контроллерами
□ Дублирование SQL запросов

ПРОБЛЕМЫ ЗАВИСИМОСТЕЙ:
□ Циклические зависимости между сервисами
□ Сервисы знают о структуре БД напрямую
□ Прямые вызовы к Repository из контроллеров
□ Tight coupling между слоями

ПРОБЛЕМЫ ТЕСТИРОВАНИЯ:
□ Сложно написать unit test для бизнес-правил
□ Много моков в тестах
□ Интеграционные тесты длятся больше минуты
□ Невозможно тестировать логику отдельно от БД
```

#### Метрики для измерения текущего состояния

```bash
# Скрипт для анализа кода (псевдокод)
find src/ -name "*.java" -exec grep -l "@Service" {} \; | wc -l  # количество сервисов
find src/ -name "*Service.java" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}'  # строки в сервисах
grep -r "public.*void\|public.*return" src/*Service.java | wc -l  # публичные методы в сервисах
```

### 1.2 Карта зависимостей

#### Шаблон визуализации зависимостей

```
ТЕКУЩАЯ АРХИТЕКТУРА (проблемная):

Controller A ──┐
              ├──► Service X ──┐
Controller B ──┘              ├──► Repository 1
                              ├──► Repository 2  
Controller C ──┐              ├──► Repository 3
              ├──► Service Y ──┘
Controller D ──┘

ПРОБЛЕМЫ:
• Сервисы знают о многих репозиториях
• Контроллеры дублируют обращения к сервисам
• Нет четкой доменной модели
• Бизнес-логика размазана


ЦЕЛЕВАЯ АРХИТЕКТУРА (DDD):

Use Case ──► Application Service ──► Domain Model ──► Repository
   │              │                     │              │
   │              │                 Aggregate        Infrastructure
   │              │                 Entity/VO             │
   │              │                 Domain Events         │
   │              │                     │                 │
   │          Orchestration        Business Logic      Persistence
   │              │                     │                 │
User Intent   Cross-cutting         Core Value        Technical Detail
```

---

## 2. Рефакторинг чек-листы

### 2.1 Поэтапный план рефакторинга сервиса

#### Этап 1: Выделение Value Objects (1-2 дня)

```java
// ДО: примитивы везде
@Service
public class UserService {
    public void updateProfile(Long userId, String email, String phone) {
        // валидация email - дублируется везде
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        // ...
    }
}

// ПОСЛЕ: Value Objects
public record EmailAddress(String value) {
    public EmailAddress {
        if (value == null || !value.contains("@") || value.length() < 5) {
            throw new InvalidEmailException("Invalid email: " + value);
        }
    }
    
    public String getDomain() {
        return value.substring(value.indexOf("@") + 1);
    }
}

public record PhoneNumber(String value) {
    public PhoneNumber {
        if (value == null || value.length() < 10) {
            throw new InvalidPhoneException("Invalid phone: " + value);
        }
    }
}
```

**Чек-лист Value Objects:**
```
□ Все примитивы заменены на доменные типы
□ Валидация перенесена в конструкторы VO
□ VO содержат поведение (методы), а не только данные
□ VO являются immutable
□ Добавлены тесты для валидации VO
```

#### Этап 2: Обогащение Entities (2-3 дня)

```java
// ДО: Anemic Domain Model
@Entity
public class User {
    private Long id;
    private String email;
    private String status;
    
    // только getters/setters
}

// ПОСЛЕ: Rich Domain Model
@Entity
public class User {
    private UserId id;
    private EmailAddress email;
    private UserStatus status;
    private List<DomainEvent> domainEvents = new ArrayList<>();
    
    // Поведение внутри объекта
    public void changeEmail(EmailAddress newEmail) {
        if (this.status == UserStatus.SUSPENDED) {
            throw new UserSuspendedException("Cannot change email for suspended user");
        }
        
        EmailAddress previousEmail = this.email;
        this.email = newEmail;
        
        this.domainEvents.add(new UserEmailChanged(this.id, previousEmail, newEmail));
    }
    
    public void suspend(SuspensionReason reason) {
        if (this.status == UserStatus.SUSPENDED) {
            return; // idempotent operation
        }
        
        this.status = UserStatus.SUSPENDED;
        this.domainEvents.add(new UserSuspended(this.id, reason));
    }
    
    public boolean canPerformAction(UserAction action) {
        return switch (this.status) {
            case ACTIVE -> true;
            case SUSPENDED -> action.isAllowedForSuspended();
            case DELETED -> false;
        };
    }
}
```

**Чек-лист Rich Entities:**
```
□ Бизнес-методы перенесены из сервисов в entities
□ Инварианты проверяются внутри объектов
□ Есть доменные события для важных изменений состояния
□ Методы имеют доменные имена (не CRUD)
□ Добавлены тесты для доменной логики
```

#### Этап 3: Application Service как оркестратор (2-3 дня)

```java
// ДО: Толстый сервис с бизнес-логикой
@Service
public class UserService {
    public void changeUserEmail(Long userId, String newEmail) {
        // 30+ строк валидации, бизнес-логики, side effects
        User user = userRepository.findById(userId);
        
        // валидация email
        if (!newEmail.contains("@")) { /* ... */ }
        
        // проверка бизнес-правил
        if (user.getStatus().equals("SUSPENDED")) { /* ... */ }
        
        // обновление
        user.setEmail(newEmail);
        userRepository.save(user);
        
        // side effects
        emailService.sendConfirmation(newEmail);
        auditService.logEmailChange(userId, newEmail);
        // ...
    }
}

// ПОСЛЕ: Application Service как оркестратор
@ApplicationService  // или @UseCase
public class ChangeUserEmailService {
    
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;
    
    @Transactional
    public void handle(ChangeUserEmailCommand command) {
        // 1. Загрузка аггрегата
        User user = userRepository.findById(command.userId());
        
        // 2. Выполнение доменной операции
        user.changeEmail(command.newEmail());
        
        // 3. Сохранение
        userRepository.save(user);
        
        // 4. Публикация событий
        eventPublisher.publishAll(user.getDomainEvents());
        user.clearEvents();
    }
}

// Side effects обрабатываются через события
@EventHandler
public class UserEmailChangedHandler {
    public void handle(UserEmailChanged event) {
        emailService.sendConfirmation(event.newEmail());
        auditService.logEmailChange(event.userId(), event.newEmail());
    }
}
```

**Чек-лист Application Service:**
```
□ Сервис содержит только оркестрацию, не бизнес-логику
□ Один публичный метод на один Use Case
□ Управляет транзакциями
□ Публикует доменные события
□ Не содержит if/else с бизнес-правилами
```

---

## 3. Шаблоны проектирования

### 3.1 Шаблон выделения Aggregate

#### Критерии определения границ Aggregate

```
ВОПРОСЫ ДЛЯ ОПРЕДЕЛЕНИЯ AGGREGATE:

1. КОНСИСТЕНТНОСТЬ:
   ❓ Какие данные должны быть консистентны в одной транзакции?
   ❓ Какие бизнес-инварианты должны соблюдаться всегда?
   ❓ Что может быть eventually consistent?

2. ЖИЗНЕННЫЙ ЦИКЛ:
   ❓ Какие объекты создаются/изменяются/удаляются вместе?
   ❓ Есть ли у группы объектов общий жизненный цикл?
   ❓ Кто отвечает за создание и валидацию?

3. БИЗНЕС-ОПЕРАЦИИ:
   ❓ Какие операции всегда выполняются атомарно?
   ❓ Какие объекты участвуют в одних и тех же Use Case?
   ❓ Что является unit of work для бизнеса?

4. РАЗМЕР И ПРОИЗВОДИТЕЛЬНОСТЬ:
   ❓ Не будет ли агрегат слишком большим для загрузки?
   ❓ Как часто изменяются разные части данных?
   ❓ Есть ли hotspots в параллельном доступе?
```

#### Пример применения критериев

```java
// АНАЛИЗ: Order system

// CANDIDATE 1: Все в одном агрегате
class OrderAggregate {
    private OrderId id;
    private List<OrderLine> lines;      // ✅ изменяются вместе с Order
    private ShippingAddress address;    // ✅ нужно для валидации Order
    private Payment payment;            // ❌ может быть отдельный жизненный цикл
    private Shipment shipment;          // ❌ создается позже, другой процесс
    private List<Review> reviews;       // ❌ создаются пользователями, eventual consistency OK
}

// РЕШЕНИЕ: Разделяем на несколько агрегатов
class Order {  // Aggregate Root
    private OrderId id;
    private CustomerId customerId;
    private List<OrderLine> lines;
    private ShippingAddress address;
    private OrderStatus status;
    
    public void addLine(ProductId productId, Quantity quantity) {
        validateCanAddLine(productId, quantity);
        this.lines.add(new OrderLine(productId, quantity));
        recalculateTotal();
    }
    
    public void ship() {
        if (status != OrderStatus.PAID) {
            throw new OrderNotPaidException();
        }
        this.status = OrderStatus.SHIPPED;
        raise(new OrderShipped(this.id));
    }
}

class Payment {  // Separate Aggregate
    private PaymentId id;
    private OrderId orderId;  // reference by ID, not object
    private Money amount;
    private PaymentStatus status;
}

class Shipment {  // Separate Aggregate  
    private ShipmentId id;
    private OrderId orderId;  // reference by ID
    private TrackingNumber trackingNumber;
}
```

### 3.2 Шаблон CQRS проектирования

#### Query модели (Read Side)

```java
// Проекция для списка заказов пользователя
@ReadModel
public class CustomerOrderListView {
    private CustomerId customerId;
    private List<OrderSummary> orders;
    
    @Value
    public static class OrderSummary {
        OrderId orderId;
        LocalDateTime orderDate;
        Money totalAmount;
        OrderStatus status;
        int itemCount;
    }
    
    // Обновляется через события
    @EventHandler
    public void on(OrderPlaced event) {
        this.orders.add(new OrderSummary(
            event.orderId(),
            event.orderDate(),
            event.totalAmount(),
            OrderStatus.PLACED,
            event.lines().size()
        ));
    }
}

// Проекция для деталей заказа
@ReadModel  
public class OrderDetailsView {
    private OrderId orderId;
    private CustomerInfo customer;
    private List<OrderLineView> lines;
    private ShippingInfo shipping;
    private PaymentInfo payment;
    
    // Оптимизирована для отображения в UI
    // Денормализована для быстрого чтения
    // Обновляется асинхронно через события
}
```

#### Command модели (Write Side)

```java
// Команды от пользователя
public record PlaceOrderCommand(
    CustomerId customerId,
    List<OrderLineRequest> lines,
    ShippingAddress shippingAddress
) {}

public record AddProductToOrderCommand(
    OrderId orderId,
    ProductId productId,
    Quantity quantity
) {}

// Application Service обрабатывает команды
@ApplicationService
public class OrderCommandService {
    
    public OrderId handle(PlaceOrderCommand command) {
        Customer customer = customerRepo.findById(command.customerId());
        
        Order order = customer.placeOrder(
            command.lines(),
            command.shippingAddress()
        );
        
        orderRepo.save(order);
        eventPublisher.publishAll(order.getEvents());
        
        return order.getId();
    }
}
```

### 3.3 Шаблон доменных событий

```java
// Базовый интерфейс доменного события
public interface DomainEvent {
    Instant occurredOn();
    String eventType();
}

// Конкретное событие
public record OrderPlaced(
    OrderId orderId,
    CustomerId customerId,
    Money totalAmount,
    List<OrderLine> lines,
    Instant occurredOn
) implements DomainEvent {
    
    public OrderPlaced(OrderId orderId, CustomerId customerId, Money totalAmount, List<OrderLine> lines) {
        this(orderId, customerId, totalAmount, lines, Instant.now());
    }
    
    @Override
    public String eventType() {
        return "OrderPlaced";
    }
}

// Агрегат накапливает события
public abstract class AggregateRoot {
    private final List<DomainEvent> domainEvents = new ArrayList<>();
    
    protected void raise(DomainEvent event) {
        this.domainEvents.add(event);
    }
    
    public List<DomainEvent> getEvents() {
        return List.copyOf(domainEvents);
    }
    
    public void clearEvents() {
        domainEvents.clear();
    }
}

// Обработчики событий
@EventHandler
public class OrderPlacedHandler {
    
    @Async
    @EventListener
    public void handle(OrderPlaced event) {
        // Обновляем read модели
        updateCustomerOrderList(event);
        
        // Отправляем уведомления  
        sendOrderConfirmationEmail(event);
        
        // Резервируем товары
        reserveProducts(event);
    }
}
```

---

## 4. Практические упражнения

### 4.1 Kata: Рефакторинг UserService

#### Исходный код (намеренно проблематичный)

```java
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    @Autowired  
    private EmailService emailService;
    @Autowired
    private AuditService auditService;
    
    public void registerUser(String email, String password, String firstName, String lastName) {
        // Валидация
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password too short");  
        }
        
        // Проверка на дубликат
        if (userRepository.findByEmail(email).isPresent()) {
            throw new UserAlreadyExistsException("User with email " + email + " already exists");
        }
        
        // Создание пользователя
        User user = new User();
        user.setEmail(email);
        user.setPassword(hashPassword(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setStatus("PENDING_CONFIRMATION");
        user.setCreatedAt(Instant.now());
        
        userRepository.save(user);
        
        // Side effects
        emailService.sendConfirmationEmail(email, firstName);
        auditService.logUserRegistration(user.getId(), email);
    }
    
    public void confirmUser(String email, String confirmationCode) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
            
        if (!"PENDING_CONFIRMATION".equals(user.getStatus())) {
            throw new IllegalStateException("User is not pending confirmation");
        }
        
        // В реальности код бы проверялся, но упростим
        user.setStatus("ACTIVE");
        user.setConfirmedAt(Instant.now());
        
        userRepository.save(user);
        
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
        auditService.logUserConfirmation(user.getId());
    }
}
```

#### Задание: поэтапный рефакторинг

**Шаг 1:** Выделить Value Objects
```
TODO: 
□ Создать EmailAddress VO с валидацией
□ Создать Password VO с валидацией  
□ Создать PersonName VO для firstName/lastName
□ Заменить примитивы в методах на VO
```

**Шаг 2:** Обогатить User entity
```  
TODO:
□ Добавить доменные методы: register(), confirm()
□ Добавить бизнес-валидацию внутри методов
□ Добавить доменные события: UserRegistered, UserConfirmed
□ Убрать setters, оставить только осмысленные методы
```

**Шаг 3:** Создать Application Services
```
TODO:
□ RegisterUserUseCase для регистрации
□ ConfirmUserUseCase для подтверждения  
□ Переместить оркестрацию в Use Cases
□ Обработка событий через event handlers
```

#### Пример решения (шаг 1)

```java
// Value Objects
public record EmailAddress(String value) {
    public EmailAddress {
        if (value == null || !value.contains("@") || value.length() < 5) {
            throw new InvalidEmailException("Invalid email: " + value);
        }
    }
    
    public String getDomain() {
        return value.substring(value.indexOf("@") + 1);
    }
}

public record Password(String hashedValue) {
    public static Password fromPlainText(String plainText) {
        if (plainText == null || plainText.length() < 8) {
            throw new WeakPasswordException("Password must be at least 8 characters");
        }
        return new Password(BCrypt.hashpw(plainText, BCrypt.gensalt()));
    }
    
    public boolean matches(String plainText) {
        return BCrypt.checkpw(plainText, this.hashedValue);
    }
}

public record PersonName(String firstName, String lastName) {
    public PersonName {
        if (firstName == null || firstName.trim().isEmpty()) {
            throw new IllegalArgumentException("First name is required");
        }
        if (lastName == null || lastName.trim().isEmpty()) {
            throw new IllegalArgumentException("Last name is required");
        }
    }
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
```

### 4.2 Kata: Event Storming для Order Management

#### Сценарий
Система управления заказами в интернет-магазине.

#### Упражнение: определить доменные события

```
BUSINESS FLOW: Размещение и выполнение заказа

1. Покупатель добавляет товары в корзину
2. Покупатель оформляет заказ
3. Система проверяет наличие товаров
4. Система рассчитывает стоимость доставки  
5. Покупатель выбирает способ оплаты
6. Система обрабатывает платеж
7. Система резервирует товары на складе
8. Склад комплектует заказ
9. Служба доставки забирает заказ
10. Заказ доставляется покупателю

ЗАДАНИЕ:
□ Выделить доменные события (что произошло?)
□ Определить команды (что инициирует события?)  
□ Выявить аггрегаты (кто обеспечивает консистентность?)
□ Нарисовать bounded contexts
```

#### Пример решения

```
ДОМЕННЫЕ СОБЫТИЯ:
• ProductAddedToCart
• CartCheckedOut  
• OrderPlaced
• PaymentProcessed
• InventoryReserved
• OrderFulfilled
• OrderShipped
• OrderDelivered

КОМАНДЫ:
• AddProductToCart
• CheckoutCart
• PlaceOrder  
• ProcessPayment
• ReserveInventory
• FulfillOrder
• ShipOrder
• DeliverOrder

АГРЕГАТЫ:
• ShoppingCart (товары в корзине, валидация состава)
• Order (детали заказа, статус, инварианты заказа)
• Payment (информация об оплате, статус платежа)
• Inventory (остатки товаров, резервирование)
• Shipment (информация о доставке, трекинг)

BOUNDED CONTEXTS:
• Sales (корзина, заказы, покупатели)
• Payment (платежи, биллинг)  
• Inventory (товары, остатки, резервирование)
• Shipping (доставка, логистика)
```

---

## 5. Метрики и измерения

### 5.1 Автоматические проверки архитектуры

#### ArchUnit правила для DDD

```java
@AnalyzeClasses(packages = "com.example")  
public class DddArchitectureTest {
    
    @ArchTest
    static final ArchRule domain_should_not_depend_on_infrastructure = 
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAPackage("..infrastructure..");
    
    @ArchTest
    static final ArchRule application_services_should_be_thin =
        classes()
            .that().resideInAPackage("..application..")
            .and().areAnnotatedWith(ApplicationService.class)
            .should().haveOnlyOnePublicMethod();
    
    @ArchTest  
    static final ArchRule entities_should_not_have_setters =
        noClasses()
            .that().resideInAPackage("..domain..")
            .and().areAnnotatedWith(Entity.class)
            .should().haveMethodsThat(
                arePublic().and().haveName(containsIgnoringCase("set"))
            );
            
    @ArchTest
    static final ArchRule value_objects_should_be_immutable =
        classes()
            .that().areRecords()
            .and().resideInAPackage("..domain..")
            .should().beAnnotatedWith(ValueObject.class);
}
```

### 5.2 Метрики качества DDD кода

```java
// Кастомные метрики
public class DddMetrics {
    
    public double calculateDomainLogicPercentage(String sourceRoot) {
        int totalLines = countLinesInServices(sourceRoot);
        int domainLines = countLinesInDomain(sourceRoot);
        return (double) domainLines / (totalLines + domainLines) * 100;
    }
    
    public int countValueObjects(String sourceRoot) {
        // Подсчет классов, аннотированных @ValueObject или являющихся records
    }
    
    public double calculateAnemicEntityRatio(String sourceRoot) {
        List<Class<?>> entities = findEntities(sourceRoot);
        int anemicCount = 0;
        
        for (Class<?> entity : entities) {
            if (isAnemic(entity)) {
                anemicCount++;
            }
        }
        
        return (double) anemicCount / entities.size();
    }
    
    private boolean isAnemic(Class<?> clazz) {
        Method[] methods = clazz.getDeclaredMethods();
        int gettersSetters = 0;
        int businessMethods = 0;
        
        for (Method method : methods) {
            if (isGetterOrSetter(method)) {
                gettersSetters++;
            } else if (isPublic(method) && !isInfrastructureMethod(method)) {
                businessMethods++;
            }
        }
        
        return businessMethods == 0 || gettersSetters > businessMethods * 2;
    }
}
```

### 5.3 Дашборд прогресса трансформации

```markdown
# DDD Transformation Progress

## Week 8 Metrics

### Code Structure
- Domain Logic: 45% (↑ from 15% in week 1)  
- Value Objects: 23 (↑ from 3)
- Anemic Entities: 35% (↓ from 85%)
- Service Methods: 127 (↓ from 245)

### Quality Indicators  
- Cyclomatic Complexity (Domain): 2.3 (↓ from 4.8)
- Test Coverage (Domain): 89% (↑ from 45%)
- Architecture Violations: 3 (↓ from 47)

### Team Feedback
- "Easier to understand business logic" - 4/5 developers
- "Faster to add new features" - 3/5 developers  
- "More confident in changes" - 5/5 developers

### Next Week Goals
□ Reach 60% domain logic 
□ Introduce domain events to Order aggregate
□ Complete CQRS for reporting queries
□ Zero architecture violations
```

---

## 6. Troubleshooting Guide

### 6.1 Частые проблемы и решения

#### Проблема: "Слишком большие агрегаты"

**Симптомы:**
- Аггрегат содержит 10+ entities
- Время загрузки аггрегата > 100ms
- Конкуренция за блокировки

**Решение:**
```java
// БЫЛО: Один большой агрегат
class OrderAggregate {
    private Order order;
    private List<OrderLine> lines;      // много строк
    private Customer customer;          // большой объект  
    private List<Payment> payments;     // история платежей
    private List<Shipment> shipments;   // история доставок
    private List<Review> reviews;       // отзывы покупателей
}

// СТАЛО: Разделение по consistency boundaries  
class Order {
    private OrderId id;
    private CustomerId customerId;      // ссылка по ID
    private List<OrderLine> lines;      // только текущие строки
    private OrderStatus status;
}

class Customer {  // Отдельный агрегат
    private CustomerId id;
    private PersonName name;
    private EmailAddress email;
}

class PaymentHistory { // Отдельный агрегат для истории
    private CustomerId customerId;
    private List<Payment> payments;
}
```

#### Проблема: "Циркулярные зависимости между аггрегатами"

**Симптомы:**
- Order знает о Customer напрямую
- Customer знает о своих Orders
- Невозможно загрузить один без другого

**Решение:**
```java
// НЕПРАВИЛЬНО: прямые ссылки
class Order {
    private Customer customer;  // ❌
    
    public void updateShipping() {
        if (!customer.canChangeShipping()) {  // ❌ 
            throw new IllegalStateException();
        }
    }
}

class Customer {
    private List<Order> orders;  // ❌
}

// ПРАВИЛЬНО: ссылки по ID + Domain Service
class Order {
    private CustomerId customerId;  // ✅ ссылка по ID
}

@DomainService  
class OrderService {
    public void updateShipping(OrderId orderId, ShippingAddress address) {
        Order order = orderRepo.findById(orderId);
        Customer customer = customerRepo.findById(order.getCustomerId());
        
        if (!customer.canChangeShipping()) {
            throw new IllegalStateException();
        }
        
        order.updateShippingAddress(address);
    }
}
```

#### Проблема: "Domain events не обрабатываются"

**Симптомы:**
- События создаются, но handlers не вызываются
- Inconsistent state между агрегатами
- Side effects не выполняются

**Решение:**
```java
// Убедиться что события публикуются в Application Service
@ApplicationService
@Transactional
public class OrderApplicationService {
    
    public void placeOrder(PlaceOrderCommand command) {
        Order order = Order.create(command.customerId(), command.lines());
        orderRepo.save(order);
        
        // ✅ Обязательно публиковать события!
        eventPublisher.publishAll(order.getEvents());
        order.clearEvents();
    }
}

// Проверить что handlers зарегистрированы
@Component
public class OrderEventHandlers {
    
    @EventListener
    @Async
    public void handle(OrderPlaced event) {
        // Обновление read моделей
        updateCustomerOrderHistory(event);
        
        // Отправка уведомлений
        sendOrderConfirmationEmail(event);
        
        // Резервирование товаров  
        reserveInventoryForOrder(event);
    }
}

// Настройка Spring для async обработки событий
@Configuration
@EnableAsync
public class EventConfiguration {
    
    @Bean
    public ApplicationEventMulticaster applicationEventMulticaster() {
        SimpleApplicationEventMulticaster eventMulticaster = new SimpleApplicationEventMulticaster();
        eventMulticaster.setTaskExecutor(new SimpleAsyncTaskExecutor());
        return eventMulticaster;
    }
}
```

### 6.2 Performance Anti-patterns

#### Проблема: "N+1 queries в доменной модели"

**Симптомы:**
- Загрузка Order вызывает N запросов для OrderLines
- Медленная работа при большом количестве связанных объектов

**Решение:**
```java
// НЕПРАВИЛЬНО: ленивая загрузка в domain методах
class Order {
    @OneToMany(fetch = FetchType.LAZY)
    private List<OrderLine> lines;
    
    public Money calculateTotal() {
        // ❌ Это может вызвать N+1 queries
        return lines.stream()
            .map(OrderLine::getSubtotal)
            .reduce(Money.ZERO, Money::add);
    }
}

// ПРАВИЛЬНО: явная загрузка в Repository
@Repository
public class OrderRepository {
    
    public Optional<Order> findByIdWithLines(OrderId orderId) {
        return entityManager.createQuery(
            "SELECT o FROM Order o JOIN FETCH o.lines WHERE o.id = :id",
            Order.class
        )
        .setParameter("id", orderId)
        .getResultStream()
        .findFirst();
    }
}

// Application Service загружает все необходимое
@ApplicationService  
public class CalculateOrderTotalService {
    
    public Money handle(CalculateOrderTotalQuery query) {
        Order order = orderRepo.findByIdWithLines(query.orderId())
            .orElseThrow(() -> new OrderNotFoundException(query.orderId()));
            
        return order.calculateTotal();
    }
}
```

---

## 7. Практические чек-листы

### 7.1 Daily DDD Review Checklist

```
ЕЖЕДНЕВНЫЙ REVIEW КОДА (10 минут):

ДОМЕННАЯ МОДЕЛЬ:
□ Новые классы в domain пакете содержат поведение, а не только данные?
□ Бизнес-правила находятся в доменных объектах, а не в сервисах?
□ Value Objects используются вместо примитивов?
□ Методы имеют доменные имена (placeOrder vs createOrder)?

APPLICATION LAYER:
□ Application Services содержат только оркестрацию?
□ Нет if/else с бизнес-логикой в Application Services?
□ Доменные события публикуются после сохранения?
□ Транзакции управляются на уровне Use Case?

АРХИТЕКТУРА:
□ Domain слой не зависит от Infrastructure?
□ Зависимости направлены от Application к Domain?
□ Нет прямых вызовов Repository из Controller?
□ CQRS соблюдается (команды отделены от запросов)?

ТЕСТИРОВАНИЕ:
□ Доменная логика покрыта unit тестами?
□ Тесты используют доменный язык в именах?
□ Моков минимум в доменных тестах?
```

### 7.2 Sprint Planning DDD Checklist

```
ПЛАНИРОВАНИЕ СПРИНТА С DDD ФОКУСОМ:

АНАЛИЗ USER STORIES:
□ Story описана в терминах пользовательской ценности?
□ Выделены доменные концепты из story?
□ Определены затрагиваемые аггрегаты?
□ Понятны инварианты, которые нужно поддержать?

ТЕХНИЧЕСКОЕ ПЛАНИРОВАНИЕ:
□ Нужны ли новые Value Objects?
□ Изменятся ли границы существующих агрегатов?
□ Какие доменные события будут созданы?
□ Как это повлияет на read модели?

DEFINITION OF DONE:
□ Доменная логика покрыта unit тестами
□ Application Service создан для нового Use Case
□ События обрабатываются асинхронно
□ Read модели обновлены
□ Architecture тесты проходят
□ Code review с DDD фокусом проведен
```

### 7.3 Refactoring Session Checklist

```
РЕФАКТОРИНГ СЕССИЯ (1-2 часа):

ПОДГОТОВКА:
□ Выбран конкретный "запах" кода для устранения
□ Написаны тесты для существующего поведения
□ Создана feature branch для рефакторинга
□ Определена цель: что должно стать лучше?

ВЫПОЛНЕНИЕ:
□ Рефакторинг происходит маленькими шагами
□ После каждого шага тесты проходят
□ Commit после каждого логического изменения
□ Не добавляется новый функционал во время рефакторинга

ЗАВЕРШЕНИЕ:
□ Все тесты проходят
□ Architecture правила не нарушены
□ Code review запрошен
□ Задокументированы изменения в commit messages
```

---

## 8. Шаблоны документации

### 8.1 ADR (Architecture Decision Record) для DDD

```markdown
# ADR-015: Разделение Order и OrderFulfillment агрегатов

## Статус
Принято (2024-01-15)

## Контекст
Текущий Order агрегат содержит как информацию о заказе (что заказано), 
так и информацию о выполнении (что отправлено, статусы доставки). 
Это приводит к:
- Большим объектам при загрузке
- Конфликтам блокировок между процессами заказа и доставки
- Смешанным ответственностям в одном агрегате

## Рассмотренные варианты
1. Оставить как есть - один большой Order агрегат
2. Разделить на Order + OrderFulfillment агрегаты  
3. Создать OrderFulfillment как отдельный bounded context

## Решение
Разделяем на два агрегата в рамках одного bounded context:
- Order: содержит что заказано, кем, когда, статус заказа
- OrderFulfillment: содержит информацию о выполнении, доставке, трекинг

## Последствия

### Позитивные:
- Меньше конфликтов блокировок
- Четкое разделение ответственностей
- Быстрее загрузка Order для отображения в UI
- Процессы заказа и доставки развиваются независимо

### Негативные:
- Eventual consistency между Order и OrderFulfillment
- Нужно обрабатывать случаи, когда fulfillment отстает от order
- Миграция данных из текущей структуры

### Нейтральные:
- Дополнительные integration events между агрегатами
- Изменения в Application Services

## Детали реализации
- OrderFulfillment создается по событию OrderPaid
- Статус Order обновляется по событиям из OrderFulfillment
- Связь через OrderId (reference by ID)
```

### 8.2 Bounded Context Canvas

```markdown
# Bounded Context: Order Management

## Purpose
Управление жизненным циклом заказов от размещения до завершения

## Strategic Classification
- **Core Domain** - ключевая бизнес-ценность
- **High Priority** - критически важен для бизнеса

## Domain Roles
### Inbound (что получаем от других контекстов)
- Customer информация из Customer Management
- Product информация из Catalog  
- Inventory статус из Warehouse
- Payment статус из Billing

### Outbound (что предоставляем другим контекстам)
- Order события для Analytics
- Shipping требования для Logistics
- Revenue данные для Finance

## Ubiquitous Language
| Термин | Определение | Примеры |
|--------|-------------|---------|
| Order | Запрос покупателя на приобретение товаров | Order #12345 |
| Order Line | Строка заказа с товаром и количеством | 2x iPhone 15 Pro |
| Fulfillment | Процесс выполнения заказа | Комплектация, упаковка, отправка |

## Business Rules
- Заказ можно изменить только в статусе "Placed"
- Оплата должна быть получена до отправки
- Отмена возможна до начала комплектации

## Architecture
```
Application Services:
- PlaceOrderService
- UpdateOrderService  
- CancelOrderService

Domain Model:
- Order (Aggregate Root)
- OrderLine (Entity)
- ShippingAddress (Value Object)

Infrastructure:
- OrderRepository
- OrderEventPublisher
```

### 8.3 Domain Event Registry

```markdown
# Domain Events Registry

## Order Management Events

### OrderPlaced
**Когда происходит:** Покупатель успешно оформил заказ
**Данные события:**
```json
{
  "orderId": "uuid",
  "customerId": "uuid", 
  "orderLines": [
    {"productId": "uuid", "quantity": 2, "unitPrice": 999.99}
  ],
  "totalAmount": 1999.98,
  "shippingAddress": {...},
  "placedAt": "2024-01-15T10:30:00Z"
}
```
**Кто обрабатывает:**
- Inventory Service → резервирует товары
- Email Service → отправляет подтверждение
- Analytics Service → обновляет метрики

### OrderCancelled
**Когда происходит:** Заказ отменен (пользователем или системой)
**Данные события:**
```json
{
  "orderId": "uuid",
  "customerId": "uuid",
  "cancelledAt": "2024-01-15T11:45:00Z",
  "reason": "CUSTOMER_REQUEST | PAYMENT_FAILED | OUT_OF_STOCK",
  "cancelledBy": "customer | system"
}
```
**Кто обрабатывает:**
- Inventory Service → освобождает резерв
- Payment Service → возвращает средства
- Email Service → уведомляет о отмене

## Integration Events vs Domain Events

### Domain Events (внутри bounded context)
- OrderStatusChanged
- OrderLineAdded
- OrderLineRemoved

### Integration Events (между bounded contexts)  
- OrderPlaced → публикуется во внешний event bus
- OrderCancelled → публикуется во внешний event bus
- OrderShipped → публикуется во внешний event bus
```

---

## 9. Learning Path: 16-week DDD Journey

### Week 1-2: Foundation & Diagnosis
**Goals:** Понять текущие проблемы, изучить DDD основы

**Daily Tasks:**
- **Day 1-2:** Аудит текущего кода, подсчет метрик
- **Day 3-5:** Чтение DDD материалов (Evans, Fowler, Vernon)
- **Day 6-7:** Анализ open source DDD проектов
- **Day 8-10:** Составление списка проблем текущей архитектуры

**Deliverables:**
- Отчет о текущем состоянии кода
- Список выявленных "запахов"
- План трансформации

### Week 3-4: Value Objects & Entities
**Goals:** Заменить примитивы на Value Objects, обогатить Entities

**Daily Tasks:**
- **Day 1-3:** Создание первых VO (EmailAddress, Money, ProductCode)
- **Day 4-5:** Рефакторинг anemic entities
- **Day 6-7:** Перенос простой валидации в доменные объекты

**Deliverables:**
- 5+ Value Objects
- 2+ Rich Entities с поведением
- Unit тесты для доменной логики

### Week 5-8: Application Services & Use Cases
**Goals:** Создать Application Services, проектировать от Use Cases

**Daily Tasks:**
- **Day 1-4:** Выделение Use Cases из текущих сервисов
- **Day 5-8:** Создание Application Services как оркестраторов
- **Day 9-12:** Введение доменных событий
- **Day 13-16:** Рефакторинг существующих сервисов

**Deliverables:**
- Application Services для основных Use Cases
- Domain Events для ключевых операций
- Асинхронные обработчики событий

### Week 9-12: CQRS & Read Models
**Goals:** Разделить команды и запросы, создать read модели

**Daily Tasks:**
- **Day 1-6:** Анализ запросов, создание read моделей
- **Day 7-12:** Внедрение CQRS паттерна
- **Day 13-16:** Оптимизация query performance

**Deliverables:**
- Read модели для UI нужд
- Проекции через доменные события
- Измеримое улучшение производительности

### Week 13-16: Advanced Patterns & Optimization
**Goals:** Saga patterns, eventual consistency, оптимизация

**Daily Tasks:**
- **Day 1-4:** Внедрение saga для сложных операций
- **Day 5-8:** Оптимизация consistency boundaries
- **Day 9-12:** Performance туning
- **Day 13-16:** Документация и knowledge sharing

**Deliverables:**
- Зрелая DDD архитектура
- Документированные ADR
- Presentation для команды

---

## 10. Заключение

Этот набор инструментов обеспечивает структурированный подход к трансформации от сервис-ориентированного к домен-ориентированному мышлению. 

**Ключевые принципы использования:**
1. **Итеративность** - небольшие шаги с постоянной обратной связью
2. **Измеримость** - метрики прогресса на каждом этапе  
3. **Практичность** - фокус на решении реальных проблем
4. **Командность** - shared understanding через совместную работу

**Критерии успешной трансформации:**
- Доменная логика находится в доменных объектах
- Application Services содержат только оркестрацию
- Архитектура поддерживает эволюцию требований
- Команда мыслит терминами бизнес-домена

Помните: DDD - это не о паттернах кода, а о понимании бизнеса и моделировании этого понимания в коде. Техника служит пониманию, а не наоборот.