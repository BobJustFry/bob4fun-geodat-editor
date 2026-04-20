<img width="1514" height="846" alt="image" src="https://github.com/user-attachments/assets/74ce7615-73c6-4df7-8cb9-d918fd53ec4a" />

# Geodat Editor · v1.9.2

Web-based editor for geoip/geosite rule files used in V2Ray, Mihomo (Clash Meta) and similar proxy tools.

🌐 **Live:** [geodat.bob4fun.fun](https://geodat.bob4fun.fun)

## Features

- **Parse & Edit** V2Ray `.dat` (geosite/geoip), Mihomo `.mrs`, plain text and YAML rule files
- **Split view** with donor panel — load a second file and copy rules or entire categories between them
- **Export** to `.dat`, `.mrs` or `.txt` format
- **Load files** via drag & drop, file picker or URL
- **Inline editing** — double-click any rule or category name to edit in place
- **Rename categories** — double-click the category name or use the ✏️ icon
- **Search & filter** rules and categories
- **Pagination** — configurable page size (default 50) for large rule lists
- **Ctrl+V batch paste** — paste multiple rules at once from clipboard
- **IPv4 auto-normalization** — CIDR prefixes are calculated automatically
- **File validation** — content is checked before upload (magic bytes for `.dat`/`.mrs`, domain/IP sampling for `.txt`/`.yaml`)
- **Large file warning** — confirmation dialog for files over 30 MB
- **Dark / Light theme** toggle
- **EN / RU** interface

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| V2Ray dat | `.dat` | Protobuf-encoded GeoSiteList / GeoIPList |
| Mihomo MRS | `.mrs` | Zstd-compressed binary ruleset |
| Text | `.txt` | One rule per line |
| YAML | `.yaml`, `.yml` | YAML rule lists with `payload:` key |

## Usage

1. Open the editor in browser
2. Load a file (drag & drop, browse, or paste URL)
3. Select a category from the left sidebar
4. Edit rules: add, remove, or double-click to edit inline
5. Optionally load a donor file (second slot) and copy rules or whole categories from it
6. Export the result in the desired format using the download buttons

## Donor Panel

The donor panel (right side of split view) allows read-only browsing of a second file:

- **Drag-select** rules with mouse to select a range
- **☑ / ☐** buttons to select all / deselect all
- **← Copy selected** — copies checked rules into the active category
- **← Copy Group** — copies an entire category (creates it if missing, merges if exists)

## Deployment

```bash
docker compose up -d --build
```

The app runs behind Caddy reverse proxy on port 443 (HTTPS).

Environment: Docker, Node.js 22, Caddy 2.

## License

[MIT](LICENSE) © 2026 BobJustFry

## Donate

If you find this project useful, you can support the development:

**USDT (BEP20):** `0x132b5cd3db0469537291fd398afaa50a96962f66`

---

# Geodat Editor (RU) · v1.9.2

Веб-редактор файлов правил geoip/geosite для V2Ray, Mihomo (Clash Meta) и аналогичных прокси-инструментов.

🌐 **Сайт:** [geodat.bob4fun.fun](https://geodat.bob4fun.fun)

## Возможности

- **Парсинг и редактирование** файлов V2Ray `.dat` (geosite/geoip), Mihomo `.mrs`, текстовых и YAML
- **Split View** с донорской панелью — загрузите второй файл и копируйте правила или целые категории между ними
- **Экспорт** в форматы `.dat`, `.mrs` или `.txt`
- **Загрузка файлов** через drag & drop, проводник или URL
- **Инлайн-редактирование** — двойной клик на правиле или названии категории открывает редактор
- **Переименование категорий** — двойной клик по имени категории или иконка ✏️
- **Поиск и фильтрация** правил и категорий
- **Пагинация** — настраиваемый размер страницы (по умолчанию 50)
- **Batch-вставка Ctrl+V** — вставка сразу нескольких правил из буфера обмена
- **Автонормализация IPv4** — префикс CIDR рассчитывается автоматически
- **Валидация файлов** — проверка содержимого перед загрузкой (magic bytes для `.dat`/`.mrs`, семплирование доменов/IP для `.txt`/`.yaml`)
- **Предупреждение о большом файле** — диалог подтверждения для файлов > 30 МБ
- **Тёмная / светлая** тема
- **Интерфейс на русском и английском** языках

## Поддерживаемые форматы

| Формат | Расширение | Описание |
|--------|-----------|----------|
| V2Ray dat | `.dat` | Protobuf GeoSiteList / GeoIPList |
| Mihomo MRS | `.mrs` | Бинарный рулсет со сжатием zstd |
| Текст | `.txt` | Одно правило на строку |
| YAML | `.yaml`, `.yml` | Списки правил в YAML с ключом `payload:` |

## Использование

1. Откройте редактор в браузере
2. Загрузите файл (перетащите, выберите в проводнике или вставьте URL)
3. Выберите категорию в боковой панели слева
4. Редактируйте правила: добавляйте, удаляйте или двойной клик для инлайн-редактирования
5. При необходимости загрузите донорский файл (второй слот) и копируйте правила или целые категории из него
6. Экспортируйте результат в нужном формате кнопками скачивания

## Донорская панель

Донорская панель (правая сторона Split View) позволяет просматривать второй файл в режиме чтения:

- **Drag-select** — зажмите мышь и тяните для выбора диапазона правил
- **☑ / ☐** — выбрать все / снять выделение
- **← Скопировать выбранные** — копирует отмеченные правила в активную категорию
- **← Copy Group** — копирует целую категорию (создаёт новую или сливает с существующей)

## Развёртывание

```bash
docker compose up -d --build
```

Приложение работает за Caddy reverse proxy на порту 443 (HTTPS).

Окружение: Docker, Node.js 22, Caddy 2.

## Лицензия

[MIT](LICENSE) © 2026 BobJustFry

## Донат

Если проект оказался полезен, можете поддержать разработку:

**USDT (BEP20):** `0x132b5cd3db0469537291fd398afaa50a96962f66`


## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| V2Ray dat | `.dat` | Protobuf-encoded GeoSiteList / GeoIPList |
| Mihomo MRS | `.mrs` | Zstd-compressed binary ruleset |
| Text | `.txt` | One rule per line |
| YAML | `.yaml`, `.yml` | YAML rule lists |

## Usage

1. Open the editor in browser
2. Load a file (drag & drop, browse, or paste URL)
3. Select a category from the left sidebar
4. Edit rules: add, remove, or click ✏️ to edit inline
5. Optionally load a donor file (second slot) and copy rules from it
6. Export the result in the desired format using the download buttons

## Deployment

```bash
docker compose up -d --build
```

The app runs behind Caddy reverse proxy on port 443 (HTTPS).

Environment: Docker, Node.js 22, Caddy 2.

## Donate

If you find this project useful, you can support the development:

**USDT (BEP20):** `0x132b5cd3db0469537291fd398afaa50a96962f66`

---

# Geodat Editor (RU)

Веб-редактор файлов правил geoip/geosite для V2Ray, Mihomo (Clash Meta) и аналогичных прокси-инструментов.

## Возможности

- **Парсинг и редактирование** файлов V2Ray `.dat` (geosite/geoip), Mihomo `.mrs`, текстовых и YAML
- **Режим Split View** с донорской панелью — загрузите второй файл и копируйте правила между ними
- **Экспорт** в форматы `.dat`, `.mrs` или `.txt`
- **Загрузка файлов** через drag & drop, проводник или URL
- **Инлайн-редактирование** — редактируйте, добавляйте, удаляйте правила и категории
- **Поиск и фильтрация** правил внутри категорий
- **Подгрузка** — инкрементальная загрузка для больших списков правил

## Поддерживаемые форматы

| Формат | Расширение | Описание |
|--------|-----------|----------|
| V2Ray dat | `.dat` | Protobuf GeoSiteList / GeoIPList |
| Mihomo MRS | `.mrs` | Бинарный рулсет со сжатием zstd |
| Текст | `.txt` | Одно правило на строку |
| YAML | `.yaml`, `.yml` | Списки правил в YAML |

## Использование

1. Откройте редактор в браузере
2. Загрузите файл (перетащите, выберите в проводнике или вставьте URL)
3. Выберите категорию в боковой панели слева
4. Редактируйте правила: добавляйте, удаляйте или нажмите ✏️ для инлайн-редактирования
5. При необходимости загрузите донорский файл (второй слот) и копируйте правила из него
6. Экспортируйте результат в нужном формате кнопками скачивания

## Развёртывание

```bash
docker compose up -d --build
```

Приложение работает за Caddy reverse proxy на порту 443 (HTTPS).

Окружение: Docker, Node.js 22, Caddy 2.

## Донат

Если проект оказался полезен, можете поддержать разработку:

**USDT (BEP20):** `0x132b5cd3db0469537291fd398afaa50a96962f66`
