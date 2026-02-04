## Паттерн услуги «Гид» — бэкенд, админка, фронт

### Бэкенд

- **Модель `Service` (`prisma/schema.prisma`)**
  - Общие поля: `title`, `slug`, `category`, `shortDescription`, `description`, `phone`, `email`, `telegram`, `address`, `rating`, `reviewsCount`, `isVerified`, `isActive`, `images[]`, `certificates[]`, `prices[]`, `data` (JSON), `reviews[]`.
  - Для гидов добавлено поле:
    - `routeIds String[] @default([]) @map("route_ids") @db.ObjectId` — массив `id` маршрутов, в которых участвует гид.
- **Модель `Route`**
  - Уже содержит поле `guideIds String[] @map("guide_ids")` — массив `id` услуг‑гидов.
- **Модель `Review`**
  - Универсальные отзывы для маршрутов, мест и услуг:
    - Поля: `authorName`, `authorAvatar`, `rating` (1–5), `text`, `status` (`pending/approved/rejected`), `entityType` (`route` / `place` / `service`), `entityId`, `entityTitle`.
    - Дополнительные связи: `routeId`, `placeId`, `serviceId`.

#### Публичный API услуг (`app/services/services.public.controller.js`)

- `GET /api/services`
  - Возвращает активные услуги c фильтрами и поиском.
  - Для удобства добавляется поле `image` (первый элемент `images[]`).
- `GET /api/services/:idOrSlug`
  - Ищет активную услугу по `id` или `slug`.
  - Включает только одобренные отзывы (`status = approved`), отсортированные по дате.
  - Нормализует и возвращает:
    - `routeIds` — массив `id` маршрутов (для гидов).
    - `routes` — сами маршруты, если категория `Гид` и массив `routeIds` не пустой.
- `POST /api/services/:serviceId/reviews`
  - Создаёт отзыв для услуги со статусом `pending`.
  - Валидирует имя, рейтинг (1–5) и текст.
  - Находит услугу по `id` или `slug` и записывает отзыв с `entityType = 'service'`, `entityId = service.id`, `serviceId = service.id`.

#### Синхронизация гидов и маршрутов (`app/admin/routes.controller.js`)

- **Создание маршрута (`createRoute`)**
  - После `prisma.route.create` берётся массив `guideIds`.
  - Для всех гидов из `guideIds` выполняется `updateMany` с `routeIds: { push: route.id }`.
- **Обновление маршрута (`updateRoute`)**
  - Считаются:
    - `toAdd` — гиды, добавленные в `guideIds`.
    - `toRemove` — гиды, удалённые из `guideIds`.
  - Для `toAdd`:
    - Выполняется `updateMany` по `id ∈ toAdd` с `routeIds: { push: routeId }`.
  - Для `toRemove`:
    - Для каждого сервиса читается текущий `routeIds` и сохраняется новый массив без `routeId`.
- **Удаление маршрута (`deleteRoute`)**
  - Перед удалением маршрута ищутся все гиды, у которых `routeIds` содержит `routeId`.
  - Для каждого гида из этого списка из `routeIds` убирается данный `routeId`.

#### Админ‑контроллер услуг (`app/admin/services.controller.js`)

- **`createService`**
  - Генерирует `slug` из `title` (`generateSlug(title) + '-' + Date.now()`).
  - Сохраняет:
    - Основные поля (контакты, описание, флаги, рейтинг по умолчанию).
    - Массивы `images`, `certificates`, `prices`.
    - JSON‑поле `data` с типо‑специфичными данными (richtext, контакты, аватар, галерея и т.д.).
- **`updateService`**
  - При смене `title` пересобирает `slug`, иначе оставляет старый.
  - Обновляет `isVerified`, `isActive`, `images`, `certificates`, `prices`, `data`.
  - Поле `routeIds` **не** приходит из формы и **не** редактируется напрямую — оно поддерживается в актуальном состоянии при создании/редактировании/удалении маршрутов.

### Админка: список и редактирование услуги «Гид»

- **Список `/admin/services` (`src/app/admin/services/page.jsx`)**
  - Показывает:
    - Название, тип (`category`), рейтинг, число отзывов, флаг активности, флаг верификации.
    - Обложку из `service.image || service.images?.[0]`.
- **Редактор `/admin/services/[id]` (`src/app/admin/services/[id]/page.jsx`)**
  - Общие элементы:
    - Поля: название, тип услуги, флаг видимости.
    - Блок «Изображения» (для не‑гидов) с загрузкой нескольких файлов, выбором обложки и предпросмотром.
    - Динамические поля по `SERVICE_TYPE_FIELDS` (`richtext`, `contactList`, `priceList`, `certificateList`, `stringList` и т.д.).
    - RichTextEditor для всех `richtext`‑полей.
    - Контакты (`contactList`) с:
      - Полями «Подпись», «Значение», «Ссылка».
      - Автоматическим распознаванием телефона/почты/URL и генерацией `href` (`tel:`, `mailto:`, `https://`), причём в `tel:` все лишние символы (скобки и пробелы) удаляются.
      - Иконками (загрузка собственного изображения или выбор из библиотеки Lucide).
    - Список цен (`priceList`) с двумя полями одинаковой ширины (название и цена).
    - Список сертификатов (`certificateList`) с загрузкой картинок и подписями.
    - Механизм `dirty`‑проверки (снимки формы, модалка при уходе без сохранения, тост после успешного сохранения).
  - Специфично для гида:
    - Переключатель **«Верифицирован»**, управляющий полем `isVerified` сервиса.
    - Блок **«Аватар гида»**:
      - Отдельное изображение, хранимое в `data.avatar` как `{ type: 'url' | 'file', value, preview? }`.
      - При сохранении файл загружается через `mediaAPI.upload`, URL попадёт в `data.avatar`; для карточки в списке используется как обложка.
    - Блок **«Галерея»**:
      - Массив изображений `data.galleryImages` в том же формате, что и `images`.
      - Переключатель `data.galleryEnabled` («Показывать галерею на странице»).
      - При сохранении все новые файлы отправляются на `/admin/media/upload`, URL‑ы попадают в `data.galleryImages`, а для публичной части — в `images[]` (вместе с аватаром).

### Публичный сайт: список услуг и страница гида

- **Маршрутизация (`src/App.jsx`)**
  - `/services` → `Services_page` — список всех услуг.
  - `/services/:slug` → `ServicePageContent` — по `slug` тянет данные из `publicServicesAPI.getByIdOrSlug` и рендерит нужный шаблон.
- **Список услуг (`src/sections/Services/Services_page.jsx`)**
  - Загружает услуги через `publicServicesAPI.getAll`.
  - Использует фильтры и сортировки.
  - Для карточки:
    - Ссылка: `/services/${service.slug || service.id}`.
    - Обложка: `service.image || service.images?.[0]`.
    - Показ `category`, `rating`, `reviewsCount`, `isVerified`.
- **Страница гида (`ServiceDetail.jsx` в `sections/Services/ServiceDetail`)**
  - Галерея:
    - Для гида — из `serviceData.data.galleryImages`, если `galleryEnabled !== false`.
    - При отключённой или пустой галерее блок не рендерится.
  - Аватар:
    - Приоритет `serviceData.data.avatar`, затем `serviceData.images[0]`, затем `/serviceImg1.png`.
  - Блок «О специалисте»:
    - Берёт HTML из `serviceData.data.aboutContent` и рендерит его через `dangerouslySetInnerHTML` с CSS‑классом `aboutTextHtml` (форматирование сохраняется).
  - Контакты, услуги и цены, сертификаты:
    - Приоритет полей из `serviceData.data` (`contacts`, `pricesInData`, `certificatesInData`), фолбэк — плоские поля модели.
  - Маршруты гида:
    - Использует `serviceData.routes` (маршруты, подгруженные бэкендом по `routeIds`).
    - Если массив пустой — блок не отображается.
  - Отзывы:
    - Берутся из `serviceData.reviews` (approved).
    - При количестве > 5 показывается кнопка «Показать все отзывы (N)»/«Свернуть отзывы».
    - Форма отправки отзыва использует `publicServicesAPI.createReview`, после отправки показывает сообщение об успешной передаче на модерацию.

