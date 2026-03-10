/**
 * Generate First JEE Main Mock Test using Gemini API
 * 
 * This script generates a complete, balanced JEE Main Paper 1 mock test with:
 * - 75 total questions across Physics, Chemistry, and Mathematics
 * - Equal weightage to all major topics within each subject
 * - Balanced difficulty distribution (Easy, Medium, Hard)
 * - Proper JEE Main format: Section A (MCQ) + Section B (Numerical)
 * - Automatic retry on errors until all questions are successfully generated
 * 
 * Format:
 *   Physics: 20 MCQ + 5 Numerical = 25 questions (100 marks)
 *   Chemistry: 20 MCQ + 5 Numerical = 25 questions (100 marks)
 *   Mathematics: 20 MCQ + 5 Numerical = 25 questions (100 marks)
 *   Total: 75 questions, 300 marks
 * 
 * Usage:
 *   node scripts/generateJeeMainMockWithGemini.js [--mock-number N]
 *   
 * Options:
 *   --mock-number N  - Generate mock number N (default: 1)
 *   --dry-run        - Test generation without saving to database
 * 
 * Prerequisites:
 *   - GOOGLE_API_KEY set in .env
 *   - Database initialized with exams_taxonomies
 *   - @google/generative-ai package installed
 */

require('dotenv').config();
const db = require('../src/config/database');
const geminiService = require('../src/services/geminiService');

// Parse command-line arguments
const args = process.argv.slice(2);
const mockNumberArg = args.find(arg => arg.startsWith('--mock-number='));
const ORDER_INDEX = mockNumberArg ? parseInt(mockNumberArg.split('=')[1], 10) : 1;
const DRY_RUN = args.includes('--dry-run');

const JEE_MAIN_EXAM_NAME = 'JEE Main';
const MARKS_PER_QUESTION = 4;
const NEGATIVE_MARKS = 1;
const MAX_RETRIES_PER_QUESTION = 5;
const BATCH_SIZE = 3; // Generate 3 questions concurrently for speed
const SAVE_BATCH_SIZE = 10; // Save every 10 questions to DB

// JEE Main comprehensive topic distribution with equal weightage
const TOPIC_DISTRIBUTION = {
  Physics: {
    topics: [
      'Mechanics - Kinematics',
      'Mechanics - Laws of Motion',
      'Mechanics - Work Energy Power',
      'Mechanics - Rotational Motion',
      'Mechanics - Gravitation',
      'Mechanics - Properties of Matter',
      'Thermodynamics',
      'Waves and Sound',
      'Electrostatics',
      'Current Electricity',
      'Magnetic Effects of Current',
      'Electromagnetic Induction',
      'Optics - Ray Optics',
      'Optics - Wave Optics',
      'Modern Physics - Dual Nature',
      'Modern Physics - Atoms and Nuclei',
    ],
    mcqCount: 20,
    numericalCount: 5
  },
  Chemistry: {
    topics: [
      'Physical Chemistry - Atomic Structure',
      'Physical Chemistry - Chemical Bonding',
      'Physical Chemistry - States of Matter',
      'Physical Chemistry - Thermodynamics',
      'Physical Chemistry - Chemical Equilibrium',
      'Physical Chemistry - Ionic Equilibrium',
      'Physical Chemistry - Redox Reactions',
      'Physical Chemistry - Electrochemistry',
      'Physical Chemistry - Chemical Kinetics',
      'Inorganic Chemistry - Periodic Table',
      'Inorganic Chemistry - p-Block Elements',
      'Inorganic Chemistry - d and f Block Elements',
      'Inorganic Chemistry - Coordination Compounds',
      'Organic Chemistry - Basic Principles',
      'Organic Chemistry - Hydrocarbons',
      'Organic Chemistry - Organic Compounds with Functional Groups',
    ],
    mcqCount: 20,
    numericalCount: 5
  },
  Mathematics: {
    topics: [
      'Algebra - Complex Numbers',
      'Algebra - Quadratic Equations',
      'Algebra - Sequences and Series',
      'Algebra - Permutations and Combinations',
      'Algebra - Binomial Theorem',
      'Algebra - Matrices and Determinants',
      'Calculus - Limits and Continuity',
      'Calculus - Differentiation',
      'Calculus - Applications of Derivatives',
      'Calculus - Integration',
      'Calculus - Differential Equations',
      'Coordinate Geometry - Straight Lines',
      'Coordinate Geometry - Circles',
      'Coordinate Geometry - Conic Sections',
      'Vector Algebra',
      'Three Dimensional Geometry',
      'Probability',
      'Trigonometry',
    ],
    mcqCount: 20,
    numericalCount: 5
  }
};

// Difficulty distribution for balanced exam
const DIFFICULTY_DISTRIBUTION = {
  easy: 0.30,    // 30% easy questions
  medium: 0.50,  // 50% medium questions
  hard: 0.20     // 20% hard questions
};

/**
 * Generate question parameters with balanced topic and difficulty distribution
 */
function generateQuestionParams(subject, subjectConfig) {
  const params = [];
  const { topics, mcqCount, numericalCount } = subjectConfig;
  const totalQuestions = mcqCount + numericalCount;
  
  // Calculate difficulty counts
  const easyCount = Math.round(totalQuestions * DIFFICULTY_DISTRIBUTION.easy);
  const hardCount = Math.round(totalQuestions * DIFFICULTY_DISTRIBUTION.hard);
  const mediumCount = totalQuestions - easyCount - hardCount;
  
  // Create difficulty array
  const difficulties = [
    ...Array(easyCount).fill('easy'),
    ...Array(mediumCount).fill('medium'),
    ...Array(hardCount).fill('hard')
  ];
  
  // Shuffle difficulties for random distribution
  for (let i = difficulties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [difficulties[i], difficulties[j]] = [difficulties[j], difficulties[i]];
  }
  
  let questionIndex = 0;
  const sectionName = subject.toLowerCase();
  
  // Generate MCQ questions
  for (let i = 0; i < mcqCount; i++) {
    const topic = topics[i % topics.length]; // Distribute evenly across topics
    const difficulty = difficulties[questionIndex++];
    
        params.push({
          exam_name: JEE_MAIN_EXAM_NAME,
          subject,
          section_name: sectionName,
          section_type: 'MCQ',
          topic,
          difficulty,
          question_type: 'mcq_single', // Use mcq_single for database constraint
          marks: MARKS_PER_QUESTION,
          negative_marks: NEGATIVE_MARKS
        });
  }
  
  // Generate Numerical questions
  for (let i = 0; i < numericalCount; i++) {
    const topic = topics[(mcqCount + i) % topics.length];
    const difficulty = difficulties[questionIndex++];
    
    params.push({
      exam_name: JEE_MAIN_EXAM_NAME,
      subject,
      section_name: sectionName,
      section_type: 'Numerical',
      topic,
      difficulty,
      question_type: 'numerical',
      marks: MARKS_PER_QUESTION,
      negative_marks: NEGATIVE_MARKS
    });
  }
  
  return params;
}

/**
 * Generate a single question with automatic retry on failure
 */
async function generateQuestionWithRetry(params, maxRetries = MAX_RETRIES_PER_QUESTION) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  🔄 Attempt ${attempt}/${maxRetries}: ${params.subject} - ${params.topic} (${params.difficulty}, ${params.question_type})`);
      const question = await geminiService.generateQuestion(params);
      console.log(`  ✅ Success!`);
      return { success: true, question, params };
    } catch (error) {
      lastError = error;
      console.log(`  ❌ Attempt ${attempt} failed: ${error.message}`);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`  ⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log(`  ❌ Failed after ${maxRetries} attempts`);
  return { success: false, error: lastError.message, params };
}

/**
 * Save multiple questions to database in batch (faster than one-by-one).
 */
async function saveBatchToDatabase(questions, examId, mockTestId, startOrderIndex) {
  if (!questions || questions.length === 0) {
    console.log('⚠️  saveBatchToDatabase called with empty questions array');
    return [];
  }
  
  console.log(`  📝 Starting batch save: ${questions.length} questions, startOrderIndex: ${startOrderIndex}`);
  const savedIds = [];
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const orderIndex = startOrderIndex + i;
    
    console.log(`    - Saving Q${orderIndex}: ${q.subject} - ${q.topic} (${q.difficulty})`);
    
    try {
      const result = await db.query(
        `INSERT INTO questions (
          subject, section_name, section_type, unit, topic, sub_topic,
          concept_tags, difficulty, question_type, question_text, options,
          correct_option, solution_text, marks, negative_marks, source,
          generation_prompt_version, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id`,
        [
          q.subject,
          q.section_name,
          q.section_type,
          q.unit || null,
          q.topic || null,
          q.sub_topic || null,
          q.concept_tags || [],
          q.difficulty,
          q.question_type,
          q.question_text,
          JSON.stringify(q.options || []),
          q.correct_option,
          q.solution_text || '',
          q.marks,
          q.negative_marks,
          q.source || 'LLM',
          q.generation_prompt_version || 'v1.0',
          q.image_url || null
        ]
      );
      
      const questionId = result.rows[0].id;
      console.log(`      ✓ Inserted question ID: ${questionId}`);
      
      await db.query(
        `INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (exam_mock_id, question_id) DO NOTHING`,
        [mockTestId, questionId, examId, orderIndex]
      );
      console.log(`      ✓ Linked to mock (order: ${orderIndex})`);
      
      savedIds.push(questionId);
    } catch (error) {
      console.error(`      ❌ Failed to save question ${i + 1} in batch:`, error.message);
      console.error(`      Question data:`, JSON.stringify(q, null, 2));
      throw error;
    }
  }
  
  console.log(`  ✅ Batch save complete: ${savedIds.length} questions saved`);
  return savedIds;
}

/**
 * Generate questions in batches and save periodically (fast + no progress loss).
 */
async function generateAllQuestionsWithRetry(allParams, examId, mockTestId) {
  const successful = [];
  const failed = [];
  const total = allParams.length;
  let savedCount = 0;
  let pendingSave = []; // Buffer for batch saving
  
  console.log(`\n📊 Generating ${total} questions in batches of ${BATCH_SIZE}, saving every ${SAVE_BATCH_SIZE}...\n`);
  
  for (let i = 0; i < allParams.length; i += BATCH_SIZE) {
    const batch = allParams.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allParams.length / BATCH_SIZE);
    
    console.log(`\n🔢 Batch ${batchNumber}/${totalBatches} (Questions ${i + 1}-${Math.min(i + BATCH_SIZE, total)})`);
    console.log('─'.repeat(80));
    
    // Generate batch concurrently
    const batchResults = await Promise.all(
      batch.map(params => generateQuestionWithRetry(params))
    );
    
    // Collect successful questions
    for (const result of batchResults) {
      if (result.success) {
        successful.push(result);
        pendingSave.push(result.question);
        console.log(`  ✓ Generated: ${result.question.subject} - ${result.question.topic}`);
      } else {
        failed.push(result);
        console.log(`  ✗ Failed: ${result.params.subject} - ${result.params.topic}`);
      }
    }
    
    console.log(`  📦 Pending save buffer: ${pendingSave.length} questions`);
    
    // Save to DB when we have SAVE_BATCH_SIZE questions or at the end
    const isLastBatch = (i + BATCH_SIZE >= allParams.length);
    const shouldSave = pendingSave.length >= SAVE_BATCH_SIZE || isLastBatch;
    
    console.log(`  🔍 Save check: buffer=${pendingSave.length}, threshold=${SAVE_BATCH_SIZE}, isLastBatch=${isLastBatch}, shouldSave=${shouldSave}`);
    
    if (shouldSave && pendingSave.length > 0) {
      try {
        const startOrderIndex = savedCount + 1;
        const savedIds = await saveBatchToDatabase(pendingSave, examId, mockTestId, startOrderIndex);
        savedCount += savedIds.length;
        console.log(`  💾 Saved ${savedIds.length} questions to DB (${savedCount}/${total} total saved)`);
        pendingSave = []; // Clear buffer
      } catch (saveErr) {
        console.error(`  ❌ Batch save failed: ${saveErr.message}`);
        // Mark pending questions as failed
        pendingSave.forEach(q => {
          const failedResult = successful.find(s => s.question === q);
          if (failedResult) {
            failed.push({ ...failedResult, error: saveErr.message });
            successful.splice(successful.indexOf(failedResult), 1);
          }
        });
        pendingSave = [];
      }
    }
    
    const successRate = ((savedCount / (i + batchResults.length)) * 100).toFixed(1);
    console.log(`\n📈 Progress: ${i + batchResults.length}/${total} attempted, ${savedCount} saved (${successRate}% save rate)`);
    
    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < allParams.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return { successful, failed, savedCount };
}

/**
 * Insert questions into database
 */
async function saveQuestionsToDatabase(questions, examId, mockTestId) {
  console.log(`\n💾 Saving ${questions.length} questions to database...`);
  
  const insertedIds = [];
  let savedCount = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i].question;
    try {
      const result = await db.query(
        `INSERT INTO questions (
          subject, section_name, section_type, unit, topic, sub_topic,
          concept_tags, difficulty, question_type, question_text, options,
          correct_option, solution_text, marks, negative_marks, source,
          generation_prompt_version, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id`,
        [
          q.subject,
          q.section_name,
          q.section_type,
          q.unit || null,
          q.topic || null,
          q.sub_topic || null,
          q.concept_tags || [],
          q.difficulty,
          q.question_type,
          q.question_text,
          JSON.stringify(q.options || []),
          q.correct_option,
          q.solution_text || '',
          q.marks,
          q.negative_marks,
          q.source || 'LLM',
          q.generation_prompt_version || 'v1.0',
          q.image_url || null
        ]
      );
      insertedIds.push(result.rows[0].id);
      savedCount++;
      
      if ((savedCount) % 10 === 0) {
        console.log(`  ✅ Saved ${savedCount}/${questions.length} questions`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to save question ${i + 1}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ All ${savedCount} questions saved to database`);
  
  // Link questions to mock test
  console.log(`\n🔗 Linking questions to mock test...`);
  for (let i = 0; i < insertedIds.length; i++) {
    await db.query(
      `INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (exam_mock_id, question_id) DO NOTHING`,
      [mockTestId, insertedIds[i], examId, i + 1]
    );
  }
  
  console.log(`✅ All questions linked to mock test`);
  
  return insertedIds;
}

/**
 * Main execution function
 */
async function generateJeeMainMock() {
  console.log('🚀 JEE Main Mock Test Generator (Gemini API)');
  console.log('='.repeat(80));
  console.log(`📝 Mock Number: ${ORDER_INDEX}`);
  console.log(`🔧 Mode: ${DRY_RUN ? 'DRY RUN (no database save)' : 'PRODUCTION'}`);
  console.log('='.repeat(80));
  
  // Check Gemini service availability
  try {
    await geminiService.ensureInitialized();
    console.log('✅ Gemini service initialized successfully\n');
  } catch (error) {
    console.error('❌ Gemini service not available:', error.message);
    console.error('   Make sure GOOGLE_API_KEY is set in .env');
    process.exit(1);
  }
  
  // Initialize database
  if (!DRY_RUN) {
    try {
      await db.init();
      console.log('✅ Database connected\n');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }
  
  // Get exam ID
  let examId, mockTestId;
  if (!DRY_RUN) {
    const examRow = await db.query(
      'SELECT id FROM exams_taxonomies WHERE LOWER(name) = LOWER($1)',
      [JEE_MAIN_EXAM_NAME]
    );
    
    if (examRow.rows.length === 0) {
      console.error(`❌ Exam "${JEE_MAIN_EXAM_NAME}" not found. Run seed-exams first.`);
      process.exit(1);
    }
    
    examId = examRow.rows[0].id;
    console.log(`✅ Found exam: ${JEE_MAIN_EXAM_NAME} (ID: ${examId})\n`);
    
    // Create or reuse mock test entry
    const existing = await db.query(
      'SELECT id, status FROM exam_mocks WHERE exam_id = $1 AND order_index = $2',
      [examId, ORDER_INDEX]
    );
    
    if (existing.rows.length > 0) {
      mockTestId = existing.rows[0].id;
      await db.query('DELETE FROM exam_mock_questions WHERE exam_mock_id = $1', [mockTestId]);
      console.log(`♻️  Reusing existing Mock ${ORDER_INDEX}, clearing old questions\n`);
    } else {
      const insertResult = await db.query(
        `INSERT INTO exam_mocks (exam_id, order_index, status, created_by)
         VALUES ($1, $2, 'generating', 'system')
         RETURNING id`,
        [examId, ORDER_INDEX]
      );
      mockTestId = insertResult.rows[0].id;
      console.log(`✨ Created new Mock ${ORDER_INDEX} entry\n`);
    }
  }
  
  // Generate question parameters for all subjects
  console.log('📋 Generating question distribution...\n');
  const allParams = [];
  
  for (const [subject, config] of Object.entries(TOPIC_DISTRIBUTION)) {
    const params = generateQuestionParams(subject, config);
    allParams.push(...params);
    
    console.log(`  ${subject}:`);
    console.log(`    - Total: ${params.length} questions`);
    console.log(`    - MCQ: ${config.mcqCount} questions`);
    console.log(`    - Numerical: ${config.numericalCount} questions`);
    console.log(`    - Topics covered: ${config.topics.length}`);
    
    // Count difficulty distribution
    const difficulties = params.reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
      return acc;
    }, {});
    console.log(`    - Difficulty: Easy=${difficulties.easy || 0}, Medium=${difficulties.medium || 0}, Hard=${difficulties.hard || 0}`);
  }
  
  console.log(`\n📊 Total questions to generate: ${allParams.length}`);
  
  if (DRY_RUN) {
    console.log('\n✅ DRY RUN: Question distribution calculated successfully');
    console.log('   Remove --dry-run flag to actually generate questions');
    process.exit(0);
  }
  
  // Generate questions one-by-one and save each to DB immediately
  const startTime = Date.now();
  const { successful, failed, savedCount } = await generateAllQuestionsWithRetry(allParams, examId, mockTestId);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Generated & saved: ${savedCount}/${allParams.length} questions`);
  console.log(`❌ Failed: ${failed.length}/${allParams.length} questions`);
  console.log(`⏱️  Time taken: ${duration} minutes`);
  
  if (failed.length > 0) {
    console.log('\n⚠️  Failed questions:');
    failed.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.params.subject} - ${f.params.topic} (${f.params.difficulty})`);
      console.log(`     Error: ${f.error}`);
    });
    
    if (savedCount < 60) {
      console.error('\n❌ Too many failures. Need at least 60 questions for a valid mock test.');
      console.error(`   You have ${savedCount} saved. You can re-run the script to resume (it will clear and re-seed Mock 1).`);
      process.exit(1);
    }
    
    console.log(`\n⚠️  Proceeding with ${savedCount} saved questions`);
  }
  
  try {
    // Update mock test status (questions already saved one-by-one)
    await db.query(
      'UPDATE exam_mocks SET status = $1, total_questions = $2 WHERE id = $3',
      ['ready', savedCount, mockTestId]
    );
    
    // Update exam total_mocks_generated
    const countResult = await db.query(
      'SELECT COALESCE(MAX(order_index), 0) as max_num FROM exam_mocks WHERE exam_id = $1',
      [examId]
    );
    const totalMocks = parseInt(countResult.rows[0].max_num, 10);
    await db.query(
      'UPDATE exams_taxonomies SET total_mocks_generated = $1 WHERE id = $2',
      [totalMocks, examId]
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MOCK TEST GENERATED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log(`📝 Mock Number: ${ORDER_INDEX}`);
    console.log(`📊 Total Questions: ${savedCount}`);
    console.log(`💯 Total Marks: ${savedCount * MARKS_PER_QUESTION}`);
    console.log(`⏱️  Generation Time: ${duration} minutes`);
    console.log('='.repeat(80));
    
    // Show subject-wise breakdown
    console.log('\n📋 Subject-wise Breakdown:');
    for (const subject of Object.keys(TOPIC_DISTRIBUTION)) {
      const subjectQuestions = successful.filter(q => q.params.subject === subject);
      const mcqs = subjectQuestions.filter(q => q.params.question_type === 'mcq_single').length;
      const numericals = subjectQuestions.filter(q => q.params.question_type === 'numerical').length;
      console.log(`  ${subject}: ${subjectQuestions.length} questions (${mcqs} MCQ + ${numericals} Numerical)`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update mock status:', error.message);
    process.exit(1);
  }
}

// Execute
generateJeeMainMock().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
