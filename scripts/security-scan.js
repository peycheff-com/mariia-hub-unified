#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, relative, extname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

console.log('🔒 Security Scan Starting...')
console.log('================================')

// 1. Check for exposed secrets
console.log('\n1️⃣  Scanning for exposed secrets...')

const secretsFound = []
const secretPatterns = [
  { name: 'Supabase anon key', pattern: /eyJ[a-zA-Z0-9\-_]*?\.eyJ[a-zA-Z0-9\-_]*?/g },
  { name: 'Generic API key', pattern: /[a-zA-Z0-9]{32,}/g },
  { name: 'Stripe test key', pattern: /pk_test_[a-zA-Z0-9]{24,}/g },
  { name: 'Stripe live key', pattern: /pk_live_[a-zA-Z0-9]{24,}/g },
  { name: 'Password field', pattern: /password\s*=\s*["'][^"']{8,}["']/gi },
  { name: 'Secret token', pattern: /token\s*=\s*["'][^"']{20,}["']/gi },
]

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    const relativePath = relative(process.cwd(), filePath)

    secretPatterns.forEach(({ name, pattern }) => {
      const matches = content.match(pattern)
      if (matches) {
        secretsFound.push({
          file: relativePath,
          type: name,
          matches: matches.slice(0, 3) // Limit to 3 matches per file
        })
      }
    })

    // Check for dangerouslySetInnerHTML
    if (content.includes('dangerouslySetInnerHTML') && !content.includes('DOMPurify')) {
      secretsFound.push({
        file: relativePath,
        type: 'XSS: dangerouslySetInnerHTML without sanitization',
        matches: ['dangerouslySetInnerHTML']
      })
    }

    // Check for eval usage
    if (content.includes('eval(') || content.includes('new Function(')) {
      secretsFound.push({
        file: relativePath,
        type: 'Code injection: eval or new Function usage',
        matches: ['eval/new Function']
      })
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env*']) {
  const files = readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    const fullPath = join(dir, file.name)

    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanDirectory(fullPath, extensions)
    } else if (file.isFile() && extensions.some(ext => extname(file.name).endsWith(ext))) {
      scanFile(fullPath)
    }
  }
}

// Scan source code
scanDirectory(join(__dirname, '../src'))
scanDirectory(join(__dirname, '../supabase/functions'))

// Check environment files
const envFiles = ['.env', '.env.local', '.env.development', '.env.staging']
for (const envFile of envFiles) {
  if (existsSync(join(__dirname, '..', envFile))) {
    scanFile(join(__dirname, '..', envFile))
  }
}

// 2. Check package dependencies for vulnerabilities
console.log('\n2️⃣  Checking for vulnerable dependencies...')

let vulnerabilities = []
try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' })
  const auditData = JSON.parse(auditOutput)

  if (auditData.metadata && auditData.metadata.vulnerabilities) {
    vulnerabilities = Object.entries(auditData.metadata.vulnerabilities)
      .filter(([, count]) => count > 0)
      .map(([severity, count]) => ({ severity, count }))
  }
} catch (error) {
  console.log('   ⚠️  Could not run npm audit')
}

// 3. Check file permissions
console.log('\n3️⃣  Checking file permissions...')

const permissionIssues = []
const criticalFiles = [
  'package.json',
  '.env.example',
  'tsconfig.json',
  'vite.config.ts'
]

for (const file of criticalFiles) {
  const filePath = join(__dirname, '..', file)
  if (existsSync(filePath)) {
    try {
      const stats = statSync(filePath)
      const mode = (stats.mode & parseInt('777', 8)).toString(8)
      if (mode !== '644' && mode !== '600') {
        permissionIssues.push({
          file,
          currentMode: mode,
          recommendedMode: '644'
        })
      }
    } catch (error) {
      // Skip if can't check
    }
  }
}

// 4. Generate report
console.log('\n📊 Generating Security Report...')

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalIssues: secretsFound.length + vulnerabilities.length + permissionIssues.length,
    secretsFound: secretsFound.length,
    vulnerabilitiesFound: vulnerabilities.reduce((sum, v) => sum + v.count, 0),
    permissionIssues: permissionIssues.length
  },
  findings: {
    secrets: secretsFound,
    vulnerabilities: vulnerabilities,
    permissions: permissionIssues
  },
  recommendations: []
}

// Add recommendations based on findings
if (secretsFound.length > 0) {
  report.recommendations.push('IMMEDIATE: Remove or rotate any exposed secrets')
}

if (vulnerabilities.length > 0) {
  report.recommendations.push('Update vulnerable packages: npm audit fix')
}

if (permissionIssues.length > 0) {
  report.recommendations.push('Fix file permissions: chmod 644 <file>')
}

// Save report
const reportDir = join(__dirname, '../security-reports')
if (!existsSync(reportDir)) {
  execSync(`mkdir -p ${reportDir}`)
}

const reportFile = join(reportDir, `security-report-${Date.now()}.json`)
writeFileSync(reportFile, JSON.stringify(report, null, 2))

// Display summary
console.log('\n📋 Security Scan Results')
console.log('========================')
console.log(`\n📁 Report saved to: ${reportFile}`)

console.log('\n🔍 Issues Found:')
if (secretsFound.length === 0 && vulnerabilities.length === 0 && permissionIssues.length === 0) {
  console.log('   ✅ No security issues found!')
} else {
  if (secretsFound.length > 0) {
    console.log(`\n   🚨 Secrets/Issues (${secretsFound.length}):`)
    secretsFound.forEach(issue => {
      console.log(`      - ${issue.file}: ${issue.type}`)
    })
  }

  if (vulnerabilities.length > 0) {
    console.log(`\n   ⚠️  Vulnerabilities:`)
    vulnerabilities.forEach(v => {
      console.log(`      - ${v.severity}: ${v.count} packages`)
    })
  }

  if (permissionIssues.length > 0) {
    console.log(`\n   🔒 Permission Issues:`)
    permissionIssues.forEach(issue => {
      console.log(`      - ${issue.file}: ${issue.currentMode} (should be ${issue.recommendedMode})`)
    })
  }
}

console.log('\n💡 Recommendations:')
report.recommendations.forEach(rec => {
  console.log(`   - ${rec}`)
})

// Exit with error code if issues found
process.exit(report.summary.totalIssues > 0 ? 1 : 0)