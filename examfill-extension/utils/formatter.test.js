/**
 * Standalone test for the email-split formatters.
 * Run:  node examfill-extension/utils/formatter.test.js
 */

const Formatter = require('./formatter');

const cases = [
  ['emailLocal(\'sharmaharsh634@gmail.com\')',    Formatter.emailLocal('sharmaharsh634@gmail.com'),    'sharmaharsh634'],
  ['emailDomain(\'sharmaharsh634@gmail.com\')',   Formatter.emailDomain('sharmaharsh634@gmail.com'),   'gmail.com'],
  ['emailDomainAt(\'sharmaharsh634@gmail.com\')', Formatter.emailDomainAt('sharmaharsh634@gmail.com'), '@gmail.com'],
  ['emailLocal(\'noatsign\')',                    Formatter.emailLocal('noatsign'),                    'noatsign'],
  ['emailDomain(\'noatsign\')',                   Formatter.emailDomain('noatsign'),                   ''],
  ['emailDomainAt(\'noatsign\')',                 Formatter.emailDomainAt('noatsign'),                 ''],
  ['emailLocal(\'\')',                            Formatter.emailLocal(''),                            ''],
  ['emailLocal(null)',                            Formatter.emailLocal(null),                          ''],
];

let failed = 0;
for (const [name, actual, expected] of cases) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} => ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`);
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed === 0 ? 0 : 1);
