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

// CLAT Format Configuration (UG: 120 questions, 2 hours, +1/-0.25)
const clatFormat = {
  clat_ug: {
    format_id: "clat_ug",
    name: "CLAT UG Practice Test",
    duration_minutes: 120,
    total_marks: 120,
    difficulty_weightage: { easy: 40, medium: 40, hard: 20 },
    sections: {
      english: {
        name: "English Language",
        marks: 24,
        subsections: { section_a: { type: "MCQ", questions: 24, marks_per_question: 1 } }
      },
      gk: {
        name: "Current Affairs & General Knowledge",
        marks: 30,
        subsections: { section_a: { type: "MCQ", questions: 30, marks_per_question: 1 } }
      },
      legal: {
        name: "Legal Reasoning",
        marks: 30,
        subsections: { section_a: { type: "MCQ", questions: 30, marks_per_question: 1 } }
      },
      logical: {
        name: "Logical Reasoning",
        marks: 24,
        subsections: { section_a: { type: "MCQ", questions: 24, marks_per_question: 1 } }
      },
      quantitative: {
        name: "Quantitative Techniques",
        marks: 12,
        subsections: { section_a: { type: "MCQ", questions: 12, marks_per_question: 1 } }
      }
    },
    marking_scheme: { correct: 1, incorrect: -0.25, unattempted: 0 },
    rules: [
      "Total duration: 2 hours (120 minutes)",
      "120 questions: English 24, GK 30, Legal Reasoning 30, Logical Reasoning 24, Quantitative 12",
      "Correct answer: +1 mark, Incorrect: -0.25 marks",
      "All questions are MCQ type"
    ]
  }
};

// CUET UG Format Configuration (per section: 50 questions, 60 min, +5/-1)
const cuetFormat = {
  cuet_ug: {
    format_id: "cuet_ug",
    name: "CUET UG Practice Test",
    duration_minutes: 60,
    total_marks: 250,
    difficulty_weightage: { easy: 45, medium: 35, hard: 20 },
    sections: {
      domain: {
        name: "Domain / General Test",
        marks: 250,
        subsections: { section_a: { type: "MCQ", questions: 50, marks_per_question: 5 } }
      }
    },
    marking_scheme: { correct: 5, incorrect: -1, unattempted: 0 },
    rules: [
      "Duration: 60 minutes per section (50 questions)",
      "Correct answer: +5 marks, Incorrect: -1 mark",
      "All questions are MCQ type",
      "Practice mode - answer at your own pace"
    ]
  }
};

// AILET Format Configuration (150 questions, 1.5 hours, +1/-0.25)
const ailetFormat = {
  ailet: {
    format_id: "ailet",
    name: "AILET Practice Test",
    duration_minutes: 90,
    total_marks: 150,
    difficulty_weightage: { easy: 40, medium: 40, hard: 20 },
    sections: {
      english: {
        name: "English",
        marks: 35,
        subsections: { section_a: { type: "MCQ", questions: 35, marks_per_question: 1 } }
      },
      gk: {
        name: "General Knowledge",
        marks: 35,
        subsections: { section_a: { type: "MCQ", questions: 35, marks_per_question: 1 } }
      },
      legal: {
        name: "Legal Aptitude",
        marks: 35,
        subsections: { section_a: { type: "MCQ", questions: 35, marks_per_question: 1 } }
      },
      reasoning: {
        name: "Reasoning",
        marks: 35,
        subsections: { section_a: { type: "MCQ", questions: 35, marks_per_question: 1 } }
      },
      maths: {
        name: "Elementary Mathematics",
        marks: 10,
        subsections: { section_a: { type: "MCQ", questions: 10, marks_per_question: 1 } }
      }
    },
    marking_scheme: { correct: 1, incorrect: -0.25, unattempted: 0 },
    rules: [
      "Total duration: 1.5 hours (90 minutes)",
      "150 questions across English, GK, Legal Aptitude, Reasoning, and Mathematics",
      "Correct answer: +1 mark, Incorrect: -0.25 marks",
      "All questions are MCQ type"
    ]
  }
};

// NATA Format Configuration (Aptitude: 60 questions, 60 min)
const nataFormat = {
  nata_aptitude: {
    format_id: "nata_aptitude",
    name: "NATA Aptitude Practice Test",
    duration_minutes: 60,
    total_marks: 200,
    difficulty_weightage: { easy: 40, medium: 40, hard: 20 },
    sections: {
      aptitude: {
        name: "Aptitude",
        marks: 200,
        subsections: { section_a: { type: "MCQ", questions: 60, marks_per_question: 2 } }
      }
    },
    marking_scheme: { correct: 2, incorrect: -0.5, unattempted: 0 },
    rules: [
      "Duration: 60 minutes",
      "60 questions - Aptitude (MCQ)",
      "Correct answer: +2 marks, Incorrect: -0.5 marks",
      "Practice mode - answer at your own pace"
    ]
  }
};

// BITSAT Format Configuration (150 questions, 3 hours, +3/-1)
const bitsatFormat = {
  bitsat: {
    format_id: "bitsat",
    name: "BITSAT Practice Test",
    duration_minutes: 180,
    total_marks: 450,
    difficulty_weightage: { easy: 50, medium: 30, hard: 20 },
    sections: {
      physics: {
        name: "Physics",
        marks: 150,
        subsections: { section_a: { type: "MCQ", questions: 50, marks_per_question: 3 } }
      },
      chemistry: {
        name: "Chemistry",
        marks: 150,
        subsections: { section_a: { type: "MCQ", questions: 50, marks_per_question: 3 } }
      },
      mathematics: {
        name: "Mathematics",
        marks: 150,
        subsections: { section_a: { type: "MCQ", questions: 50, marks_per_question: 3 } }
      }
    },
    marking_scheme: { correct: 3, incorrect: -1, unattempted: 0 },
    rules: [
      "Total duration: 3 hours (180 minutes)",
      "150 questions: Physics 50, Chemistry 50, Mathematics 50",
      "Correct answer: +3 marks, Incorrect: -1 mark",
      "All questions are MCQ type"
    ]
  }
};

// Generic engineering/entrance format (duration, questions, marks) for remaining exams
function genericExamFormat(examCode, examName, durationMinutes, totalQuestions, totalMarks, correctMark = 1, incorrectMark = -0.25) {
  const perQuestion = totalMarks / totalQuestions;
  return {
    [examCode]: {
      format_id: examCode,
      name: `${examName} Practice Test`,
      duration_minutes: durationMinutes,
      total_marks: totalMarks,
      difficulty_weightage: { easy: 50, medium: 30, hard: 20 },
      sections: {
        general: {
          name: "General",
          marks: totalMarks,
          subsections: { section_a: { type: "MCQ", questions: totalQuestions, marks_per_question: Math.round(perQuestion * 100) / 100 } }
        }
      },
      marking_scheme: { correct: correctMark, incorrect: incorrectMark, unattempted: 0 },
      rules: [
        `Total duration: ${durationMinutes} minutes`,
        `${totalQuestions} questions, ${totalMarks} total marks`,
        `Correct answer: +${correctMark} mark(s), Incorrect: ${incorrectMark} mark(s)`,
        "Practice mode - answer questions at your own pace",
        "Questions are AI-generated based on exam syllabus",
        "You can exit anytime - progress is saved"
      ]
    }
  };
}

const viteeeFormat = genericExamFormat("viteee", "VITEEE", 150, 125, 125, 1, -0.25);
const srmjeeeFormat = genericExamFormat("srmjeee", "SRMJEEE", 150, 105, 105, 1, -0.25);
const wbjeeFormat = genericExamFormat("wbjee", "WBJEE", 180, 155, 200, 1, -0.25);
const mhtcetFormat = genericExamFormat("mht_cet", "MHT CET", 90, 150, 150, 1, 0);
const kcetFormat = genericExamFormat("kcet", "KCET", 180, 180, 180, 1, 0);
const tneaFormat = genericExamFormat("tnea", "TNEA", 120, 100, 100, 1, 0);
const apeamcetFormat = genericExamFormat("ap_eamcet", "AP EAMCET", 180, 160, 160, 1, -0.25);
const tseamcetFormat = genericExamFormat("ts_eamcet", "TS EAMCET", 180, 160, 160, 1, -0.25);
const gujcetFormat = genericExamFormat("gujcet", "Gujarat CET", 180, 120, 120, 1, -0.25);
const rjeeFormat = genericExamFormat("rjee", "Rajasthan JEE", 180, 100, 100, 1, -0.25);
const upseeFormat = genericExamFormat("upsee", "UPSEE", 180, 150, 150, 1, -0.25);
const comedkFormat = genericExamFormat("comedk", "COMEDK", 180, 180, 180, 1, -0.25);
const kiiteeFormat = genericExamFormat("kiitee", "KIITEE", 180, 120, 120, 1, -0.25);
const jipmerFormat = genericExamFormat("jipmer", "JIPMER", 150, 200, 200, 1, -0.25);
const nestFormat = genericExamFormat("nest", "NEST", 180, 180, 180, 1, -0.25);
const iiserFormat = genericExamFormat("iiser_aptitude", "IISER Aptitude Test", 180, 90, 90, 1, -0.25);

const examsData = [
  { name: "JEE Main", code: "JEE_MAIN", description: "Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges", format: jeeMainFormat },
  { name: "JEE Advanced", code: "JEE_ADVANCED", description: "Joint Entrance Examination Advanced - for admission to IITs", format: jeeAdvancedFormat },
  { name: "NEET", code: "NEET", description: "National Eligibility cum Entrance Test - for admission to medical and dental colleges", format: neetFormat },
  { name: "CUET", code: "CUET", description: "Common University Entrance Test - for admission to central universities", format: cuetFormat },
  { name: "CLAT", code: "CLAT", description: "Common Law Admission Test - for admission to NLUs and other law colleges", format: clatFormat },
  { name: "AILET", code: "AILET", description: "All India Law Entrance Test - for admission to NLU Delhi", format: ailetFormat },
  { name: "NATA", code: "NATA", description: "National Aptitude Test in Architecture - for admission to architecture colleges", format: nataFormat },
  { name: "BITSAT", code: "BITSAT", description: "Birla Institute of Technology and Science Admission Test", format: bitsatFormat },
  { name: "VITEEE", code: "VITEEE", description: "VIT Engineering Entrance Examination", format: viteeeFormat },
  { name: "SRMJEEE", code: "SRMJEEE", description: "SRM Joint Engineering Entrance Examination", format: srmjeeeFormat },
  { name: "WBJEE", code: "WBJEE", description: "West Bengal Joint Entrance Examination", format: wbjeeFormat },
  { name: "MHT CET", code: "MHT_CET", description: "Maharashtra Common Entrance Test", format: mhtcetFormat },
  { name: "KCET", code: "KCET", description: "Karnataka Common Entrance Test", format: kcetFormat },
  { name: "TNEA", code: "TNEA", description: "Tamil Nadu Engineering Admission", format: tneaFormat },
  { name: "AP EAMCET", code: "AP_EAMCET", description: "Andhra Pradesh Engineering, Agriculture and Medical Common Entrance Test", format: apeamcetFormat },
  { name: "TS EAMCET", code: "TS_EAMCET", description: "Telangana State Engineering, Agriculture and Medical Common Entrance Test", format: tseamcetFormat },
  { name: "Gujarat CET", code: "GUJCET", description: "Gujarat Common Entrance Test", format: gujcetFormat },
  { name: "Rajasthan JEE", code: "RJEE", description: "Rajasthan Joint Entrance Examination", format: rjeeFormat },
  { name: "UPSEE", code: "UPSEE", description: "Uttar Pradesh State Entrance Examination", format: upseeFormat },
  { name: "COMEDK", code: "COMEDK", description: "Consortium of Medical, Engineering and Dental Colleges of Karnataka", format: comedkFormat },
  { name: "KIITEE", code: "KIITEE", description: "KIIT Entrance Examination", format: kiiteeFormat },
  { name: "JIPMER", code: "JIPMER", description: "Jawaharlal Institute of Postgraduate Medical Education and Research Entrance Exam", format: jipmerFormat },
  { name: "AIIMS", code: "AIIMS", description: "All India Institute of Medical Sciences Entrance Exam", format: aiimsFormat },
  { name: "NEST", code: "NEST", description: "National Entrance Screening Test - for admission to NISER and CEBS", format: nestFormat },
  { name: "IISER Aptitude Test", code: "IISER_APTITUDE", description: "Indian Institutes of Science Education and Research Aptitude Test", format: iiserFormat },
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

