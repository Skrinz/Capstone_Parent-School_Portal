const { generateElementaryReportCard, generateKindergartenReportCard } = require('./reportCardGenerator');

const GRADE_GENERATORS = {
  'Kindergarten': generateKindergartenReportCard,
  'Grade 1':      generateElementaryReportCard,
  'Grade 2':      generateElementaryReportCard,
  'Grade 3':      generateElementaryReportCard,
  'Grade 4':      generateElementaryReportCard,
  'Grade 5':      generateElementaryReportCard,
  'Grade 6':      generateElementaryReportCard,
};

const generateReportCard = (gradeLevel) => GRADE_GENERATORS[gradeLevel] ?? null;

module.exports = { generateReportCard };