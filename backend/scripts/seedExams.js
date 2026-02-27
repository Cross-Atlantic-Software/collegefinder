/**
 * Seed Exams Taxonomies
 * 
 * This script populates the exams_taxonomies table with common exam options
 * Run with: npm run seed-exams
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
    difficulty_weightage: { easy: 50, medium: 30, hard: 20 },
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

// NEET-UG Format Configuration (Physics, Chemistry, Biology - all MCQ)
const neetFormat = {
  neet_ug: {
    format_id: "neet_ug",
    name: "NEET-UG",
    duration_minutes: 180,
    total_marks: 720,
    difficulty_weightage: { easy: 45, medium: 35, hard: 20 },
    sections: {
      physics: {
        name: "Physics",
        marks: 180,
        subsections: {
          section_a: { type: "MCQ", questions: 45, marks_per_question: 4 }
        }
      },
      chemistry: {
        name: "Chemistry",
        marks: 180,
        subsections: {
          section_a: { type: "MCQ", questions: 45, marks_per_question: 4 }
        }
      },
      biology: {
        name: "Biology",
        marks: 360,
        subsections: {
          section_a: { type: "MCQ", questions: 90, marks_per_question: 4 }
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
      "180 questions: Physics 45, Chemistry 45, Biology 90",
      "Correct answer: +4 marks, Incorrect: -1 mark",
      "All questions are MCQ type"
    ]
  }
};

// JEE Advanced Paper 1 Format Configuration
const jeeAdvancedFormat = {
  jee_advanced_paper1: {
    format_id: "jee_advanced_paper1",
    name: "JEE Advanced Paper 1",
    duration_minutes: 180,
    total_marks: 183,
    difficulty_weightage: { easy: 30, medium: 50, hard: 20 },
    sections: {
      physics: {
        name: "Physics",
        marks: 61,
        subsections: {
          section_a: { type: "MCQ", questions: 6, marks_per_question: 4 },
          section_b: { type: "Numerical", questions: 8, marks_per_question: 3 }
        }
      },
      chemistry: {
        name: "Chemistry",
        marks: 61,
        subsections: {
          section_a: { type: "MCQ", questions: 6, marks_per_question: 4 },
          section_b: { type: "Numerical", questions: 8, marks_per_question: 3 }
        }
      },
      mathematics: {
        name: "Mathematics",
        marks: 61,
        subsections: {
          section_a: { type: "MCQ", questions: 6, marks_per_question: 4 },
          section_b: { type: "Numerical", questions: 8, marks_per_question: 3 }
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
      "Physics, Chemistry, Mathematics - Section A (MCQ) and Section B (Numerical)",
      "Correct answer: +4 marks (MCQ) or +3 marks (Numerical), Incorrect: -1 mark",
      "Numerical answers must be integers between 0-9999"
    ]
  }
};

// AIIMS MBBS Format Configuration
const aiimsFormat = {
  aiims_mbbs: {
    format_id: "aiims_mbbs",
    name: "AIIMS MBBS",
    duration_minutes: 210,
    total_marks: 200,
    difficulty_weightage: { easy: 40, medium: 40, hard: 20 },
    sections: {
      physics: {
        name: "Physics",
        marks: 60,
        subsections: {
          section_a: { type: "MCQ", questions: 60, marks_per_question: 1 }
        }
      },
      chemistry: {
        name: "Chemistry",
        marks: 60,
        subsections: {
          section_a: { type: "MCQ", questions: 60, marks_per_question: 1 }
        }
      },
      biology: {
        name: "Biology",
        marks: 60,
        subsections: {
          section_a: { type: "MCQ", questions: 60, marks_per_question: 1 }
        }
      },
      general_knowledge: {
        name: "General Knowledge",
        marks: 20,
        subsections: {
          section_a: { type: "MCQ", questions: 20, marks_per_question: 1 }
        }
      }
    },
    marking_scheme: {
      correct: 1,
      incorrect: -0.33,
      unattempted: 0
    },
    rules: [
      "Total duration: 3.5 hours (210 minutes)",
      "200 questions: Physics 60, Chemistry 60, Biology 60, GK 20",
      "Correct answer: +1 mark, Incorrect: -0.33 marks",
      "All questions are MCQ type"
    ]
  }
};

const examsData = [
  { name: "JEE Main", code: "JEE_MAIN", description: "Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges", format: jeeMainFormat },
  { name: "JEE Advanced", code: "JEE_ADVANCED", description: "Joint Entrance Examination Advanced - for admission to IITs", format: jeeAdvancedFormat },
  { name: "NEET", code: "NEET", description: "National Eligibility cum Entrance Test - for admission to medical and dental colleges", format: neetFormat },
  { name: "CUET", code: "CUET", description: "Common University Entrance Test - for admission to central universities" },
  { name: "CLAT", code: "CLAT", description: "Common Law Admission Test - for admission to NLUs and other law colleges" },
  { name: "AILET", code: "AILET", description: "All India Law Entrance Test - for admission to NLU Delhi" },
  { name: "NATA", code: "NATA", description: "National Aptitude Test in Architecture - for admission to architecture colleges" },
  { name: "BITSAT", code: "BITSAT", description: "Birla Institute of Technology and Science Admission Test" },
  { name: "VITEEE", code: "VITEEE", description: "VIT Engineering Entrance Examination" },
  { name: "SRMJEEE", code: "SRMJEEE", description: "SRM Joint Engineering Entrance Examination" },
  { name: "WBJEE", code: "WBJEE", description: "West Bengal Joint Entrance Examination" },
  { name: "MHT CET", code: "MHT_CET", description: "Maharashtra Common Entrance Test" },
  { name: "KCET", code: "KCET", description: "Karnataka Common Entrance Test" },
  { name: "TNEA", code: "TNEA", description: "Tamil Nadu Engineering Admission" },
  { name: "AP EAMCET", code: "AP_EAMCET", description: "Andhra Pradesh Engineering, Agriculture and Medical Common Entrance Test" },
  { name: "TS EAMCET", code: "TS_EAMCET", description: "Telangana State Engineering, Agriculture and Medical Common Entrance Test" },
  { name: "Gujarat CET", code: "GUJCET", description: "Gujarat Common Entrance Test" },
  { name: "Rajasthan JEE", code: "RJEE", description: "Rajasthan Joint Entrance Examination" },
  { name: "UPSEE", code: "UPSEE", description: "Uttar Pradesh State Entrance Examination" },
  { name: "COMEDK", code: "COMEDK", description: "Consortium of Medical, Engineering and Dental Colleges of Karnataka" },
  { name: "KIITEE", code: "KIITEE", description: "KIIT Entrance Examination" },
  { name: "JIPMER", code: "JIPMER", description: "Jawaharlal Institute of Postgraduate Medical Education and Research Entrance Exam" },
  { name: "AIIMS", code: "AIIMS", description: "All India Institute of Medical Sciences Entrance Exam", format: aiimsFormat },
  { name: "NEST", code: "NEST", description: "National Entrance Screening Test - for admission to NISER and CEBS" },
  { name: "IISER Aptitude Test", code: "IISER_APTITUDE", description: "Indian Institutes of Science Education and Research Aptitude Test" },
];

async function seedExams() {
  try {
    await db.init();
    console.log('✅ Database connected\n');

    console.log('🌱 Starting to seed exams...');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const exam of examsData) {
      const existing = await Exam.findByCode(exam.code);
      if (existing) {
        // Update existing exam with format if it has one
        if (exam.format) {
          await Exam.update(existing.id, exam);
          console.log(`🔄 Updated "${exam.name}" with format configuration`);
        } else {
          console.log(`⏭️  Skipped "${exam.name}" (already exists)`);
        }
        skippedCount++;
      } else {
        const newExam = await Exam.create(exam);
        console.log(`✅ Inserted "${newExam.name}" with ID: ${newExam.id}`);
        insertedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Inserted: ${insertedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${examsData.length}`);

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exams:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

seedExams();

