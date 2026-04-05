CREATE TABLE "class_list_students" (
    "cls_id" SERIAL NOT NULL,
    "clist_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "class_list_students_pkey" PRIMARY KEY ("cls_id")
);

CREATE UNIQUE INDEX "class_list_students_clist_id_student_id_key"
ON "class_list_students"("clist_id", "student_id");

CREATE UNIQUE INDEX "subject_record_students_srecord_id_student_id_key"
ON "subject_record_students"("srecord_id", "student_id");

ALTER TABLE "class_list_students"
ADD CONSTRAINT "class_list_students_clist_id_fkey"
FOREIGN KEY ("clist_id") REFERENCES "class_lists"("clist_id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_list_students"
ADD CONSTRAINT "class_list_students_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("student_id")
ON DELETE CASCADE ON UPDATE CASCADE;
