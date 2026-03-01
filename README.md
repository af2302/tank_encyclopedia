# Tank Encyclopedia (React + TypeScript)

Тестовый проект с табличным отображением списка танков из API:
`https://api.tanki.su/wot/encyclopedia/vehicles/`

## Реализовано

- Таблица техники на React + TypeScript
- Загрузка данных из официального API (`application_id`)
- Поиск по названию (с поддержкой диакритики: `Lowe` находит `Löwe`)
- Пагинация
- Выбор количества строк на странице
- Состояния: загрузка / ошибка / пустой результат
- SCSS (BEM)
- Юнит-тесты (Vitest + Testing Library)

## Технологии

- React
- TypeScript
- Vite
- SCSS
- Vitest
- @testing-library/react

## Запуск

npm install
npm run dev