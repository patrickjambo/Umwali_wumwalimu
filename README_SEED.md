Seeding questions into the Amategeko database
===========================================

This project includes a seed script to insert the official question bank into your Drizzle/Neon database.

1) Prepare your questions JSON

- Convert `dreamz.pdf` to a JSON array of question objects. The current seed script uses `src/data/questions_grouped.json`, which is the fuller parsed export from `dreamz.txt`.
- Each question object should include at least: `number`, `text`, `options` (array of {key,text}), `correctKey`. Optional fields: `category`, `signSvg`, `textEn`, `explanation`.

2) Set DATABASE_URL

Create a `.env.local` in the project root with your Neon connection string:

DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

3) Push schema and seed

Install dependencies, push migrations and then run the seed script:

```bash
npm ci
npm run db:push
npm run seed
```

The seed script will look for `src/data/questions.json` or `src/data/questions.example.json` as a fallback.

Notes
- The script clears existing questions, modules, and courses before inserting the parsed question bank again.
- The script validates every question before inserting it, including checking that `correctKey` exists in that question's own options.
- Do not re-seed in production without first backing up existing attempts/progress data.
