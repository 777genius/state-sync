# Changesets

Этот проект использует [changesets](https://github.com/changesets/changesets) для управления версиями и changelog.

## Добавление changeset

```bash
pnpm changeset
```

Выберите пакеты, тип изменения (patch/minor/major) и напишите описание.

## Публикация

```bash
pnpm version    # обновляет версии и CHANGELOG
pnpm release    # собирает и публикует в npm
```
