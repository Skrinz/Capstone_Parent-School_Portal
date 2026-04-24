/*
  Warning:

  - This migration will fail if duplicate lrn_number values already exist in the students table.
*/

DROP INDEX IF EXISTS "students_lrn_number_syear_start_key";

CREATE UNIQUE INDEX "students_lrn_number_key" ON "students"("lrn_number");
