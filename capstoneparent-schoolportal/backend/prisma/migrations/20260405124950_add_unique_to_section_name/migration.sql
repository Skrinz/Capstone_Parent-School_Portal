/*
  Warnings:

  - A unique constraint covering the columns `[section_name]` on the table `sections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "sections_section_name_key" ON "sections"("section_name");
