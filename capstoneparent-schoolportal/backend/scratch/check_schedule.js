const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findFirst({
    where: { lrn_number: '123123123123' },
    include: {
      class_lists: {
        include: {
          class_list: true
        }
      }
    }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log('Student:', student.fname, student.lname);
  for (const clp of student.class_lists) {
    console.log('Class ID:', clp.class_list.clist_id);
    console.log('Class Schedule Path:', clp.class_list.class_sched);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
