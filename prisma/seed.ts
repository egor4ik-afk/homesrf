import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pro = await prisma.tarif.upsert({
    where: { name: 'PRO' },
    update: {},
    create: { name: 'PRO', priceRub: 299, durationDays: 30, status: 'active' },
  });

  await prisma.tarif.upsert({
    where: { name: 'STD' },
    update: {},
    create: { name: 'STD', priceRub: 149, durationDays: 30, status: 'hidden' },
  });

  const server = await prisma.vpnServer.upsert({
    where: { ip: '0.0.0.0' },
    update: {},
    create: { ip: '0.0.0.0', name: 'placeholder-server', assignCountry: 'RU', isHealthy: true },
  });

  await prisma.tarifVpnServer.upsert({
    where: { tarifId_vpnServerId: { tarifId: pro.id, vpnServerId: server.id } },
    update: {},
    create: { tarifId: pro.id, vpnServerId: server.id },
  });

  console.log('Сид применён: тарифы PRO/STD, плейсхолдер-сервер, связка PRO↔сервер.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
