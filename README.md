# Geodat Editor

Web-based editor for geoip/geosite rule files used in V2Ray, Mihomo (Clash Meta) and similar proxy tools.

## Features

- **Parse & Edit** V2Ray `.dat` (geosite/geoip), Mihomo `.mrs`, plain text and YAML rule files
- **Split view** with donor panel — load a second file and copy rules between them
- **Export** to `.dat`, `.mrs` or `.txt` format
- **Load files** via drag & drop, file picker or URL
- **Inline editing** — edit, add, remove rules and categories
- **Search & filter** rules within categories
- **Load more** — incremental loading for large rule lists

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
