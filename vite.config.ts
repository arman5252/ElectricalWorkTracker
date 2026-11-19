import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

function localDataSyncPlugin(): Plugin {
  return {
    name: 'local-data-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const cleanUrl = req.url.split('?')[0];

        // 1. JSON Local Sync endpoint
        if (cleanUrl.endsWith('/api/local-sync')) {
          const publicDir = path.resolve(process.cwd(), 'public');
          const dataFilePath = path.join(publicDir, 'shared_data.json');

          if (req.method === 'GET') {
            try {
              if (fs.existsSync(dataFilePath)) {
                const content = fs.readFileSync(dataFilePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(content);
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({}));
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                if (!fs.existsSync(publicDir)) {
                  fs.mkdirSync(publicDir, { recursive: true });
                }
                fs.writeFileSync(dataFilePath, body, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: 'Saved locally to public/shared_data.json' }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // 2. Excel Live Auto-Save endpoint (POST /api/save-excel)
        if (cleanUrl.endsWith('/api/save-excel') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const cables = Array.isArray(payload) ? payload : (payload.cables || []);

              if (!cables.length) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No cable records provided' }));
                return;
              }

              // Transform cables into professional spreadsheet format
              const rows = cables.map((c: any) => ({
                'Sr. No.': c.srNo || '',
                'Cable Designation': c.cableTag || '',
                'Schedule Type': c.scheduleType || '',
                'Section': c.section || '',
                'From Location': c.fromLocation || '',
                'From Equipment / Panel': c.fromEquipment || '',
                'To Location': c.toLocation || '',
                'To Equipment / Panel': c.toEquipment || '',
                'No. of Runs': c.runs || 1,
                'Cable Size': c.cableSize || '',
                'Cable Type': c.cableType || '',
                'Description / Scope': c.description || '',
                'Voltage': c.voltage || '',
                // 3 Construction & Commissioning Phases
                'Cable Laying Status': c.cableLayingStatus || 'Pending',
                'Cable Laying Remarks': c.cableLayingRemarks || '',
                'Pre-Commissioning Status': c.preCommissioningStatus || 'Pending',
                'Pre-Commissioning Remarks': c.preCommissioningRemarks || '',
                'Commissioning Status': c.commissioningStatus || 'Pending',
                'Commissioning Remarks': c.commissioningRemarks || '',
                // Approver Sign-offs
                'Approve: Naim Bhai': c.approvedBy1 || '',
                'Approve: Mosaddik Bhai': c.approvedBy2 || '',
                'Approve: Fahad Sir': c.approvedBy3 || '',
                'Last Updated': c.updatedAt || new Date().toISOString()
              }));

              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(rows);

              // Set column widths
              ws['!cols'] = [
                { wch: 8 },  // Sr. No.
                { wch: 18 }, // Cable Designation
                { wch: 25 }, // Schedule Type
                { wch: 30 }, // Section
                { wch: 18 }, // From Location
                { wch: 24 }, // From Equipment
                { wch: 18 }, // To Location
                { wch: 24 }, // To Equipment
                { wch: 10 }, // No. of Runs
                { wch: 16 }, // Cable Size
                { wch: 12 }, // Cable Type
                { wch: 45 }, // Description
                { wch: 10 }, // Voltage
                { wch: 20 }, // Cable Laying Status
                { wch: 25 }, // Cable Laying Remarks
                { wch: 22 }, // Pre-Commissioning Status
                { wch: 25 }, // Pre-Commissioning Remarks
                { wch: 22 }, // Commissioning Status
                { wch: 25 }, // Commissioning Remarks
                { wch: 16 }, // Naim Bhai
                { wch: 18 }, // Mosaddik Bhai
                { wch: 18 }, // Fahad Sir
                { wch: 24 }  // Last Updated
              ];

              XLSX.utils.book_append_sheet(wb, ws, 'Master Cable Schedule');

              // Write to local project directory
              const projectDir = process.cwd();
              const localFilePath = path.join(projectDir, 'Bergen_Engines_Cable_Schedule_Live.xlsx');
              XLSX.writeFile(wb, localFilePath);

              // Also write to parent Downloads folder for instant access
              const downloadsDir = path.resolve(projectDir, '..');
              const downloadsFilePath = path.join(downloadsDir, 'Bergen_Engines_Cable_Schedule_Live.xlsx');
              try {
                XLSX.writeFile(wb, downloadsFilePath);
              } catch (_) {}

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: 'Saved to Excel successfully',
                localFilePath,
                downloadsFilePath,
                recordCount: cables.length,
                timestamp: new Date().toLocaleTimeString()
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 3. Direct Excel Download endpoint (GET /api/download-excel)
        if (cleanUrl.endsWith('/api/download-excel') && req.method === 'GET') {
          const filePath = path.join(process.cwd(), 'Bergen_Engines_Cable_Schedule_Live.xlsx');
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="Bergen_Engines_Cable_Schedule_Live.xlsx"');
            fs.createReadStream(filePath).pipe(res);
            return;
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Excel file not generated yet' }));
            return;
          }
        }

        // 4. Excel Read endpoint (GET /api/read-excel)
        if (cleanUrl.endsWith('/api/read-excel') && req.method === 'GET') {
          const filePath = path.join(process.cwd(), 'Bergen_Engines_Cable_Schedule_Live.xlsx');
          if (fs.existsSync(filePath)) {
            try {
              const buf = fs.readFileSync(filePath);
              const wb = XLSX.read(buf, { type: 'buffer' });
              const sheetName = wb.SheetNames[0];
              const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, count: data.length, data }));
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No live Excel file found' }));
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    localDataSyncPlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
});
