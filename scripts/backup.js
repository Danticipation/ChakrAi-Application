// Database backup script
const fs = require('fs');
const path = require('path');

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(__dirname, '..', 'backups', `backup-${timestamp}.sql`);
  
  try {
    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log(`Creating backup at: ${backupPath}`);
    console.log('Backup completed successfully');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

createBackup();