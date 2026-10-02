## Contributing to Spice Crowd Web

Thanks for contributing! Please follow these steps before opening a PR:

- Fork and clone the repository.
- Create a feature branch from `main`.
- Run `npm install` and copy `.env.example` to `.env`.
- Use SQLite for local development (`DATABASE_URL="file:./dev.db"`).
- Run `npx prisma generate && npx prisma db push && npm run prisma:seed` to prepare local DB.
- Run `npm run dev` to start the site.
- Lint and run tests before pushing: `npm run lint && npm test`.

Code style: follow existing TypeScript and Tailwind conventions.
