// scripts/verify-native-modules.js
/**
 * سكريبت فحص وتأكيد قدرة Electron على تحميل الوحدات الأصلية
 * (better-sqlite3 و sharp) دون حدوث أخطاء NODE_MODULE_VERSION
 */
const path = require('path');
const cp = require('child_process');

function checkModulesInCurrentProcess() {
  const results = {
    runtime: process.versions.electron ? `Electron ${process.versions.electron}` : `Node ${process.version}`,
    modulesAbi: process.versions.modules,
    betterSqlite3: false,
    sharp: false,
    errors: []
  };

  try {
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.exec("CREATE TABLE test_abi (id INT, val TEXT); INSERT INTO test_abi VALUES (1, 'ok');");
    const row = db.prepare('SELECT val FROM test_abi WHERE id = 1').get();
    if (row && row.val === 'ok') {
      results.betterSqlite3 = true;
    }
    db.close();
  } catch (err) {
    results.errors.push({ module: 'better-sqlite3', error: err.message, code: err.code });
  }

  try {
    const sharp = require('sharp');
    const sharpVersion = sharp.versions || {};
    results.sharp = true;
    results.sharpVersion = sharpVersion;
  } catch (err) {
    results.errors.push({ module: 'sharp', error: err.message, code: err.code });
  }

  return results;
}

function verifyUnderElectron() {
  // البحث عن مسار ثنائية electron داخل المشروع
  const electronPackage = require('electron/package.json');
  const electronVer = electronPackage.version;

  // مسار electron executable في Windows
  let electronExe = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
  if (process.platform === 'darwin') {
    electronExe = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
  } else if (process.platform === 'linux') {
    electronExe = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron');
  }

  const childScript = path.join(__dirname, 'verify-native-modules.js');

  const res = cp.spawnSync(electronExe, [childScript, '--run-check'], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1'
    },
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000
  });

  return {
    electronVersion: electronVer,
    exitCode: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    success: res.status === 0 && (res.stdout || '').includes('NATIVE_MODULES_OK')
  };
}

if (process.argv.includes('--run-check')) {
  const result = checkModulesInCurrentProcess();
  if (result.betterSqlite3 && result.sharp) {
    console.log('NATIVE_MODULES_OK');
    console.log(JSON.stringify(result));
    process.exit(0);
  } else {
    console.error('NATIVE_MODULES_FAIL');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  console.log('[*] Testing native modules under Electron 29 environment...');
  const verifyRes = verifyUnderElectron();
  if (verifyRes.success) {
    console.log(`✓ SUCCESS: better-sqlite3 and sharp loaded cleanly in Electron ${verifyRes.electronVersion}!`);
    console.log('  Details:', verifyRes.stdout.trim());
    process.exit(0);
  } else {
    console.error('✕ FAILED: Native modules could not be loaded in Electron:');
    console.error('  Exit code:', verifyRes.exitCode);
    console.error('  Stderr:', verifyRes.stderr);
    console.error('  Stdout:', verifyRes.stdout);
    process.exit(1);
  }
}

module.exports = {
  checkModulesInCurrentProcess,
  verifyUnderElectron
};
