#!/usr/bin/env node

/**
 * Script to systematically fix accessibility issues identified in the audit
 */

import fs from 'fs';
import path from 'path';

class AccessibilityIssueFixer {
  constructor() {
    this.issuesFixed = 0;
    this.filesModified = 0;
    this.fixesApplied = [];
  }

  async fixIssues() {
    console.log('🔧 Starting systematic accessibility issue fixes...');

    try {
      // 1. Fix missing alt attributes (Critical)
      await this.fixMissingAltAttributes();

      // 2. Fix form accessibility issues (High)
      await this.fixFormAccessibility();

      // 3. Fix button accessibility (High)
      await this.fixButtonAccessibility();

      // 4. Fix link text issues (Medium)
      await this.fixLinkAccessibility();

      // 5. Add skip links (Medium)
      await this.addSkipLinks();

      // 6. Fix page titles (High)
      await this.fixPageTitles();

      // 7. Add language attributes (High)
      await this.addLanguageAttributes();

      // 8. Enhance ARIA implementation (Medium)
      await this.enhanceARIAImplementation();

      console.log('✅ Accessibility issue fixes completed!');
      console.log(`📊 Summary: ${this.issuesFixed} issues fixed across ${this.filesModified} files`);

    } catch (error) {
      console.error('❌ Accessibility issue fixing failed:', error);
      process.exit(1);
    }
  }

  async fixMissingAltAttributes() {
    console.log('🖼️ Fixing missing alt attributes...');

    const componentFiles = this.findReactComponents();

    componentFiles.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const originalContent = content;

        // Fix Next.js Image components without alt
        const nextImgRegex = /<Image([^>]*?)\s*\/>/g;
        content = content.replace(nextImgRegex, (match, attrs) => {
          if (!attrs.includes('alt=')) {
            modified = true;
            this.issuesFixed++;

            // Determine appropriate alt text based on context
            const altText = this.generateAltText(match, attrs, filePath);

            return `<Image${attrs} alt="${altText}" />`;
          }
          return match;
        });

        // Fix regular img tags without alt
        const imgRegex = /<img([^>]*?)\s*\/?>/g;
        content = content.replace(imgRegex, (match, attrs) => {
          if (!attrs.includes('alt=')) {
            modified = true;
            this.issuesFixed++;

            // Determine appropriate alt text based on context
            const altText = this.generateAltText(match, attrs, filePath);

            return `<img${attrs} alt="${altText}" />`;
          }
          return match;
        });

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.filesModified++;
          this.fixesApplied.push({
            file: path.relative(process.cwd(), filePath),
            type: 'Alt Text Added',
            description: 'Added alt attributes to images'
          });
        }

      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  }

  generateAltText(element, attrs, filePath) {
    const fileName = path.basename(filePath).toLowerCase();

    // Check for specific patterns to generate appropriate alt text
    if (attrs.includes('logo') || fileName.includes('logo')) {
      return 'mariia-hub logo';
    }

    if (attrs.includes('avatar') || attrs.includes('profile')) {
      return 'User profile picture';
    }

    if (attrs.includes('icon') || fileName.includes('icon')) {
      return 'Decorative icon';
    }

    if (fileName.includes('beauty') && attrs.includes('hero')) {
      return 'Beauty treatment hero image';
    }

    if (fileName.includes('fitness') && attrs.includes('hero')) {
      return 'Fitness program hero image';
    }

    if (fileName.includes('gallery')) {
      return 'Service gallery image';
    }

    if (fileName.includes('testimonial')) {
      return 'Client testimonial photo';
    }

    if (fileName.includes('team')) {
      return 'Team member photo';
    }

    // Check for size indicators - small images are likely decorative
    if (attrs.includes('w-8') || attrs.includes('w-6') || attrs.includes('w-4') ||
        attrs.includes('h-8') || attrs.includes('h-6') || attrs.includes('h-4')) {
      return ''; // Empty alt for decorative small images
    }

    // Default based on context
    if (fileName.includes('admin')) {
      return 'Admin interface icon';
    }

    if (fileName.includes('booking')) {
      return 'Booking interface element';
    }

    if (fileName.includes('service')) {
      return 'Service related image';
    }

    return 'Image'; // Generic fallback
  }

  async fixFormAccessibility() {
    console.log('📝 Fixing form accessibility issues...');

    const componentFiles = this.findReactComponents();

    componentFiles.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const originalContent = content;

        // Add htmlFor to labels that don't have it
        const labelRegex = /<label([^>]*)>([^<]*)<\/label>/g;
        content = content.replace(labelRegex, (match, attrs, text) => {
          if (!attrs.includes('htmlFor=') && !attrs.includes('for=')) {
            modified = true;
            this.issuesFixed++;
            return `<label${attrs} htmlFor="${this.generateId(text)}">${text}</label>`;
          }
          return match;
        });

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.filesModified++;
          this.fixesApplied.push({
            file: path.relative(process.cwd(), filePath),
            type: 'Form Labels',
            description: 'Added htmlFor attributes to form labels'
          });
        }

      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  }

  generateId(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async fixButtonAccessibility() {
    console.log('🔘 Fixing button accessibility issues...');

    const componentFiles = this.findReactComponents();

    componentFiles.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Add aria-label to buttons that might need it
        const buttonRegex = /<Button([^>]*)>([^<]*)<\/Button>/g;
        content = content.replace(buttonRegex, (match, attrs, text) => {
          // If button has no text content, add aria-label
          if (!text.trim() && !attrs.includes('aria-label=')) {
            modified = true;
            this.issuesFixed++;
            const action = this.inferButtonAction(attrs, filePath);
            return `<Button${attrs} aria-label="${action}">${text}</Button>`;
          }
          return match;
        });

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.filesModified++;
          this.fixesApplied.push({
            file: path.relative(process.cwd(), filePath),
            type: 'Button Accessibility',
            description: 'Added aria-label to buttons without text content'
          });
        }

      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  }

  inferButtonAction(attrs, filePath) {
    const fileName = path.basename(filePath).toLowerCase();

    if (attrs.includes('submit')) return 'Submit form';
    if (attrs.includes('cancel')) return 'Cancel action';
    if (attrs.includes('delete')) return 'Delete item';
    if (attrs.includes('edit')) return 'Edit item';
    if (attrs.includes('save')) return 'Save changes';
    if (attrs.includes('close')) return 'Close dialog';
    if (fileName.includes('booking')) return 'Book appointment';
    if (fileName.includes('contact')) return 'Send message';

    return 'Action button'; // Generic fallback
  }

  async fixLinkAccessibility() {
    console.log('🔗 Fixing link accessibility issues...');

    const componentFiles = this.findReactComponents();

    componentFiles.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix generic link text
        const linkRegex = /<a([^>]*)>(click here|read more|learn more|here|more)<\/a>/gi;
        content = content.replace(linkRegex, (match, attrs, text) => {
          modified = true;
          this.issuesFixed++;

          // Generate better link text based on context
          const betterText = this.generateBetterLinkText(text, attrs, filePath);
          return `<a${attrs}>${betterText}</a>`;
        });

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.filesModified++;
          this.fixesApplied.push({
            file: path.relative(process.cwd(), filePath),
            type: 'Link Text',
            description: 'Improved descriptive link text'
          });
        }

      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  }

  generateBetterLinkText(currentText, attrs, filePath) {
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName.includes('booking')) return 'Book your appointment';
    if (fileName.includes('contact')) return 'Contact us for more information';
    if (fileName.includes('about')) return 'Learn more about our services';
    if (fileName.includes('service')) return 'View service details';
    if (fileName.includes('price')) return 'View pricing information';

    // Capitalize first letter and make more descriptive
    return currentText.charAt(0).toUpperCase() + currentText.slice(1) + ' about our services';
  }

  async addSkipLinks() {
    console.log('⏩ Adding skip links...');

    // Check if main layout file exists
    const mainLayoutPath = 'src/App.tsx';

    if (fs.existsSync(mainLayoutPath)) {
      try {
        let content = fs.readFileSync(mainLayoutPath, 'utf8');

        // Check if skip links already exist
        if (!content.includes('skip-to-main')) {
          const skipLinks = `
        {/* Skip Links for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        <a
          href="#navigation"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-64 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to navigation
        </a>
`;

          // Add skip links after the opening body tag or at the beginning of the return
          const bodyMatch = content.match(/<body[^>]*>/);
          if (bodyMatch) {
            content = content.replace(bodyMatch[0], bodyMatch[0] + skipLinks);
          } else {
            // Add at the beginning of the main component
            const returnMatch = content.match(/return\s*\(/);
            if (returnMatch) {
              content = content.replace(returnMatch[0], returnMatch[0] + skipLinks + '\n        ');
            }
          }

          fs.writeFileSync(mainLayoutPath, content);
          this.filesModified++;
          this.issuesFixed++;
          this.fixesApplied.push({
            file: mainLayoutPath,
            type: 'Skip Links',
            description: 'Added skip navigation links for keyboard users'
          });
        }

      } catch (error) {
        console.error(`Error adding skip links:`, error.message);
      }
    }
  }

  async fixPageTitles() {
    console.log('📄 Fixing page titles...');

    const indexHtmlPath = 'index.html';

    if (fs.existsSync(indexHtmlPath)) {
      try {
        let content = fs.readFileSync(indexHtmlPath, 'utf8');

        // Check if title exists and is descriptive
        const titleMatch = content.match(/<title>([^<]+)<\/title>/);

        if (!titleMatch || titleMatch[1].trim() === 'Vite + React + TS') {
          const newTitle = '<title>mariia-hub - Beauty & Fitness Services in Warsaw</title>';

          if (titleMatch) {
            content = content.replace(titleMatch[0], newTitle);
          } else {
            // Add title in head
            const headMatch = content.match(/<head>/);
            if (headMatch) {
              content = content.replace(headMatch[0], headMatch[0] + '\n    ' + newTitle + '\n');
            }
          }

          fs.writeFileSync(indexHtmlPath, content);
          this.filesModified++;
          this.issuesFixed++;
          this.fixesApplied.push({
            file: indexHtmlPath,
            type: 'Page Title',
            description: 'Added descriptive page title'
          });
        }

      } catch (error) {
        console.error(`Error fixing page title:`, error.message);
      }
    }
  }

  async addLanguageAttributes() {
    console.log('🌍 Adding language attributes...');

    const indexHtmlPath = 'index.html';

    if (fs.existsSync(indexHtmlPath)) {
      try {
        let content = fs.readFileSync(indexHtmlPath, 'utf8');

        // Check if html tag has lang attribute
        const htmlMatch = content.match(/<html([^>]*)>/);

        if (htmlMatch && !htmlMatch[1].includes('lang=')) {
          const newHtmlTag = `<html${htmlMatch[1]} lang="en">`;
          content = content.replace(htmlMatch[0], newHtmlTag);

          fs.writeFileSync(indexHtmlPath, content);
          this.filesModified++;
          this.issuesFixed++;
          this.fixesApplied.push({
            file: indexHtmlPath,
            type: 'Language Attribute',
            description: 'Added lang attribute to html element'
          });
        }

      } catch (error) {
        console.error(`Error adding language attribute:`, error.message);
      }
    }
  }

  async enhanceARIAImplementation() {
    console.log('🎯 Enhancing ARIA implementation...');

    const componentFiles = this.findReactComponents();

    componentFiles.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Add ARIA landmarks to main sections
        if (content.includes('<main') && !content.includes('role="main"')) {
          content = content.replace('<main', '<main role="main"');
          modified = true;
        }

        if (content.includes('<nav') && !content.includes('aria-label')) {
          content = content.replace('<nav', '<nav aria-label="Main navigation"');
          modified = true;
        }

        if (content.includes('<header') && !content.includes('role="banner"')) {
          content = content.replace('<header', '<header role="banner"');
          modified = true;
        }

        if (content.includes('<footer') && !content.includes('role="contentinfo"')) {
          content = content.replace('<footer', '<footer role="contentinfo"');
          modified = true;
        }

        // Add live regions for dynamic content
        if (content.includes('toast') || content.includes('notification')) {
          if (!content.includes('aria-live')) {
            content = content.replace(/toast|notification/g, (match) => {
              return match + ' aria-live="polite" aria-atomic="true"';
            });
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.filesModified++;
          this.issuesFixed++;
          this.fixesApplied.push({
            file: path.relative(process.cwd(), filePath),
            type: 'ARIA Enhancement',
            description: 'Added ARIA landmarks and live regions'
          });
        }

      } catch (error) {
        console.error(`Error enhancing ARIA in ${filePath}:`, error.message);
      }
    });
  }

  findReactComponents() {
    const srcDir = path.join(process.cwd(), 'src');
    const componentFiles = [];

    function scanDirectory(dir) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            componentFiles.push(filePath);
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    }

    scanDirectory(srcDir);
    return componentFiles;
  }

  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        issuesFixed: this.issuesFixed,
        filesModified: this.filesModified,
        fixesApplied: this.fixesApplied.length
      },
      fixes: this.fixesApplied
    };

    const outputPath = path.join(process.cwd(), 'accessibility-audit-results', 'accessibility-fixes.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`📄 Fix report generated: ${outputPath}`);
    return report;
  }
}

// Run the fixes
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new AccessibilityIssueFixer();
  fixer.fixIssues().then(() => {
    fixer.generateFixReport();
  }).catch(console.error);
}

export default AccessibilityIssueFixer;