import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const sampleRows = [
  { id: 'ORD-001', customer: 'James Mwangi', amount: 45000, status: 'completed', date: '2025-05-01' },
  { id: 'ORD-002', customer: 'Safari Hotels Ltd', amount: 128000, status: 'completed', date: '2025-05-10' },
  { id: 'ORD-003', customer: 'Nairobi General Hospital', amount: 89000, status: 'pending', date: '2025-05-15' },
];

async function main() {
  console.log('Seeding reporting service...');

  const existing = await prisma.generatedReport.count();
  if (existing > 0) {
    console.log('Reports already seeded, skipping.');
    return;
  }

  const report = await prisma.generatedReport.create({
    data: {
      reportType: 'sales',
      title: 'Sample Sales Report – May 2025',
      status: 'completed',
      rowCount: sampleRows.length,
      summary: {
        totalRevenue: 262000,
        orderCount: 3,
        averageOrderValue: 87333.33,
      },
      dataSnapshot: {
        columns: ['id', 'customer', 'amount', 'status', 'date'],
        rows: sampleRows,
      },
      generatedBy: 'system',
      filters: {
        create: {
          dateFrom: new Date('2025-05-01'),
          dateTo: new Date('2025-05-31'),
        },
      },
    },
  });

  console.log(`Seeded sample report: ${report.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
