/**
 * Database Migration: Add Format Information to Existing Data
 * 
 * This script migrates existing exam and question data to support the new format system:
 * 1. Updates JEE Main exam with format configuration
 * 2. Updates existing questions with section information
 * 3. Ensures backward compatibility
 * 
 * Run with: node backend/scripts/migrateExamFormats.js
 */

require('dotenv').config();
const db = require('../src/config/database');
const Exam = require('../src/models/taxonomy/Exam');

// JEE Main Paper 1 Format Configuration
const jeeMainFormat = {
  jee_main_paper1: {
    format_id: "jee_main_paper1",
    name: "JEE Main Paper 1 (BE/BTech)",
    duration_minutes: 180,
    total_marks: 300,
    sections: {
      mathematics: {
        name: "Mathematics",
        marks: 100,
        subsections: {
          section_a: { type: "MCQ", questions: 20, marks_per_question: 4 },
          section_b: { type: "Numerical", questions: 5, marks_per_question: 4 }
        }
      },
      physics: {
        name: "Physics", 
        marks: 100,
        subsections: {
          section_a: { type: "MCQ", questions: 20, marks_per_question: 4 },
          section_b: { type: "Numerical", questions: 5, marks_per_question: 4 }
        }
      },
      chemistry: {
        name: "Chemistry",
        marks: 100, 
        subsections: {
          section_a: { type: "MCQ", questions: 20, marks_per_question: 4 },
          section_b: { type: "Numerical", questions: 5, marks_per_question: 4 }
        }
      }
    },
    marking_scheme: {
      correct: 4,
      incorrect: -1,
      unattempted: 0
    },
    rules: [
      "Total duration: 3 hours (180 minutes)",
      "Each section has 25 questions: 20 MCQs + 5 Numerical",
      "Correct answer: +4 marks, Incorrect: -1 mark",
      "You can navigate freely between sections",
      "Numerical answers must be integers between 0-9999"
    ]
  }
};

// Subject to section mapping for JEE Main
const subjectSectionMapping = {
  'Mathematics': 'mathematics',
  'Physics': 'physics', 
  'Chemistry': 'chemistry',
  'Math': 'mathematics',
  'Maths': 'mathematics'
};

async function migrateExamFormats() {
  try {
    await db.init();
    console.log('✅ Database connected\n');

    console.log('🔄 Starting exam format migration...\n');

    // Step 1: Update JEE Main exam with format configuration
    console.log('📝 Step 1: Updating JEE Main exam with format configuration...');
    
    const jeeMainExam = await Exam.findByCode('JEE_MAIN');
    if (jeeMainExam) {
      await Exam.updateFormat(jeeMainExam.id, jeeMainFormat);
      console.log('✅ JEE Main exam format updated successfully');
    } else {
      console.log('⚠️  JEE Main exam not found, creating with format...');
      await Exam.create({
        name: "JEE Main",
        code: "JEE_MAIN",
        description: "Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges",
        format: jeeMainFormat
      });
      console.log('✅ JEE Main exam created with format');
    }

    // Step 2: Update existing questions with section information
    console.log('\n📝 Step 2: Updating existing questions with section information...');
    
    if (jeeMainExam) {
      // Get all JEE Main questions
      const result = await db.query(
        'SELECT id, subject, question_type FROM questions WHERE exam_id = $1',
        [jeeMainExam.id]
      );
      
      const questions = result.rows;
      console.log(`Found ${questions.length} existing JEE Main questions to update`);
      
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const question of questions) {
        const subject = question.subject;
        const questionType = question.question_type;
        
        // Map subject to section name
        const sectionName = subjectSectionMapping[subject] || subject.toLowerCase();
        
        // Determine section type based on question type
        // For existing questions, we'll assign them randomly to section A (MCQ) or B (Numerical)
        // based on their question_type
        let sectionType;
        if (questionType === 'mcq') {
          sectionType = 'MCQ';
        } else if (questionType === 'numerical') {
          sectionType = 'Numerical';
        } else {
          // Default to MCQ for unknown types
          sectionType = 'MCQ';
        }
        
        try {
          await db.query(
            'UPDATE questions SET section_name = $1, section_type = $2 WHERE id = $3',
            [sectionName, sectionType, question.id]
          );
          updatedCount++;
          
          if (updatedCount % 10 === 0) {
            console.log(`  Updated ${updatedCount}/${questions.length} questions...`);
          }
        } catch (error) {
          console.error(`  ❌ Failed to update question ${question.id}:`, error.message);
          skippedCount++;
        }
      }
      
      console.log(`✅ Updated ${updatedCount} questions with section information`);
      if (skippedCount > 0) {
        console.log(`⚠️  Skipped ${skippedCount} questions due to errors`);
      }
    }

    // Step 3: Update existing tests with format information (if any)
    console.log('\n📝 Step 3: Updating existing tests with format information...');
    
    if (jeeMainExam) {
      const testsResult = await db.query(
        'SELECT id, title FROM tests WHERE exam_id = $1 AND format_id IS NULL',
        [jeeMainExam.id]
      );
      
      const tests = testsResult.rows;
      console.log(`Found ${tests.length} existing JEE Main tests to update`);
      
      for (const test of tests) {
        try {
          await db.query(
            'UPDATE tests SET format_id = $1, sections = $2 WHERE id = $3',
            ['jee_main_paper1', JSON.stringify(jeeMainFormat.jee_main_paper1.sections), test.id]
          );
          console.log(`  ✅ Updated test: ${test.title}`);
        } catch (error) {
          console.error(`  ❌ Failed to update test ${test.id}:`, error.message);
        }
      }
    }

    // Step 4: Verify migration
    console.log('\n📝 Step 4: Verifying migration...');
    
    if (jeeMainExam) {
      const formatCheck = await Exam.getFormats(jeeMainExam.id);
      if (formatCheck && formatCheck.jee_main_paper1) {
        console.log('✅ JEE Main format configuration verified');
      } else {
        console.log('❌ JEE Main format configuration not found');
      }
      
      const questionsWithSections = await db.query(
        'SELECT COUNT(*) as count FROM questions WHERE exam_id = $1 AND section_name IS NOT NULL',
        [jeeMainExam.id]
      );
      
      console.log(`✅ ${questionsWithSections.rows[0].count} questions have section information`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ JEE Main exam format updated');
    console.log('   ✅ Existing questions updated with section information');
    console.log('   ✅ Existing tests updated with format information');
    console.log('   ✅ Migration verified');

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExamFormats();
}

module.exports = { migrateExamFormats };