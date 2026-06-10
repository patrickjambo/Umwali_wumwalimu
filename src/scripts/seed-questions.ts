import { db } from '../db';
import { questions, modules, courses } from '../db/schema';
import data from '../data/questions_v2.json';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Clearing existing questions...');
  await db.delete(questions);
  await db.delete(modules);
  await db.delete(courses);
  
  // Create a default course first
  const [course] = await db.insert(courses).values({
    slug: 'ikizamini-cyose',
    title: 'Ikizamini Cyose',
    category: 'text',
    order: 1,
    isPublished: true,
  }).returning({ id: courses.id });

  console.log(`Created Course with ID ${course.id}`);

  console.log(`Loaded ${data.length} total unique questions to process.`);

  // Filter out questions that have missing options
  const validData = data.filter(q => q.options && q.options.length >= 2);
  console.log(`Valid questions (>= 2 options): ${validData.length}`);

  // Chunk into 20 items per module
  const chunkSize = 20;
  const numModules = Math.ceil(validData.length / chunkSize);
  
  console.log(`Creating ${numModules} modules (20 questions each)...`);
  
  for (let i = 0; i < numModules; i++) {
    const chunk = validData.slice(i * chunkSize, (i + 1) * chunkSize);
    
    // Create the module
    const [mod] = await db.insert(modules).values({
      courseId: course.id,
      title: `Ibizamini ${i + 1}`,
      content: `Ikizamini cya ${i + 1} gifite ibibazo ${chunk.length}`,
      order: i + 1,
      passingScore: 12
    }).returning({ id: modules.id });
    
    console.log(`Created Module: ${i + 1} with ID ${mod.id}`);
    
    // Map the questions
    const mappedQuestions = chunk.map(q => ({
      moduleId: mod.id,
      number: q.number,
      text: q.text,
      options: JSON.stringify(q.options),
      correctKey: q.correctKey,
      category: q.category as 'text' | 'numeric' | 'ibyapa',
      explanation: q.explanation || `Igisubizo ni ${q.correctKey.toUpperCase()}`,
      signImageUrl: q.image || null
    }));
    
    await db.insert(questions).values(mappedQuestions);
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed questions:', err);
  process.exit(1);
});
