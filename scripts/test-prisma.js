const fs = require('fs');
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });
  fs.writeFileSync('clean-error.txt', 'Successfully created PrismaClient instance.');
} catch (e) {
  fs.writeFileSync('clean-error.txt', `[Sync Error] Name: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack}`);
}
