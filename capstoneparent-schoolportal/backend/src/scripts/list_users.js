const prisma = require("../config/database");

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { email: true }
  });
  console.log("USERS_LIST:" + JSON.stringify(users));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
