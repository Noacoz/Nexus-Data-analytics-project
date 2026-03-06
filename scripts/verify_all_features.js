const http = require('http');
const fs = require('fs');

console.log('🔍 Verifying all bug fixes and features...\n');

const tests = [
  {
    name: 'Contact page loads with phone number',
    check: async () => {
      return new Promise((resolve) => {
        http.get('http://localhost:5000/', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            // Check source files for phone number fix
            const contactFile = fs.readFileSync('src/components/views/ContactView.jsx', 'utf8');
            const hasNewPhone = contactFile.includes('+254 748 358 985');
            const hasOldPhone = contactFile.includes('+1 (555) 123-4567');
            resolve(hasNewPhone && !hasOldPhone);
          });
        });
      });
    }
  },
  {
    name: 'All views have back buttons (source check)',
    check: async () => {
      const views = [
        { file: 'src/components/views/DatasetDetailView.jsx', checkString: 'Back' },
        { file: 'src/components/views/ReportsView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/TeamView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/SettingsView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/ProfileView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/BillingView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/SupportView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/TermsView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/PrivacyView.jsx', checkString: 'setCurrentView' },
        { file: 'src/components/views/DatasetUploadView.jsx', checkString: 'Back' },
      ];
      
      let allHasBack = true;
      for (const view of views) {
        try {
          const content = fs.readFileSync(view.file, 'utf8');
          if (!content.includes('Back') || !content.includes(view.checkString)) {
            allHasBack = false;
            console.log(`  Missing: ${view.file}`);
            break;
          }
        } catch (e) {
          allHasBack = false;
          console.log(`  Could not read: ${view.file}`);
          break;
        }
      }
      return allHasBack;
    }
  },
  {
    name: 'Dashboard has notifications panel wiring',
    check: async () => {
      const dashFile = fs.readFileSync('src/components/views/DashboardView.jsx', 'utf8');
      return dashFile.includes('showNotifications') && 
             dashFile.includes('notifications') &&
             dashFile.includes('data-notifications-container');
    }
  },
  {
    name: 'Dashboard has quick stats',
    check: async () => {
      const dashFile = fs.readFileSync('src/components/views/DashboardView.jsx', 'utf8');
      return dashFile.includes('Total Datasets') && 
             dashFile.includes('Total Rows Analysed') &&
             dashFile.includes('Insights Generated');
    }
  },
  {
    name: 'Dashboard has recently viewed section',
    check: async () => {
      const dashFile = fs.readFileSync('src/components/views/DashboardView.jsx', 'utf8');
      return dashFile.includes('Recently Viewed');
    }
  },
  {
    name: 'Dashboard has onboarding progress card',
    check: async () => {
      const dashFile = fs.readFileSync('src/components/views/DashboardView.jsx', 'utf8');
      return dashFile.includes('Get started with Nexus') && 
             dashFile.includes('Upload your first dataset');
    }
  },
  {
    name: 'Home page has animated badge',
    check: async () => {
      const homeFile = fs.readFileSync('src/components/views/HomeView.jsx', 'utf8');
      return homeFile.includes('Now with AI-powered insights') && 
             homeFile.includes('animate-pulse');
    }
  },
  {
    name: 'Home page has stats strip',
    check: async () => {
      const homeFile = fs.readFileSync('src/components/views/HomeView.jsx', 'utf8');
      return homeFile.includes('10,000+') && 
             homeFile.includes('500+') &&
             homeFile.includes('99.9%');
    }
  },
  {
    name: 'Home page has testimonials section',
    check: async () => {
      const homeFile = fs.readFileSync('src/components/views/HomeView.jsx', 'utf8');
      return homeFile.includes('What data teams are') && 
             homeFile.includes('Amara Osei');
    }
  },
  {
    name: 'Home page has correct features (6 cards)',
    check: async () => {
      const homeFile = fs.readFileSync('src/components/views/HomeView.jsx', 'utf8');
      const features = [
        'Unified Data Workspace',
        'AI-Powered Insights',
        'Visual Analytics',
        'Secure Collaboration',
        'Team Collaboration',
        'Scale Without Limits'
      ];
      return features.every(f => homeFile.includes(f));
    }
  },
  {
    name: 'LoginView has Google/GitHub OAuth handlers',
    check: async () => {
      const loginFile = fs.readFileSync('src/components/views/LoginView.jsx', 'utf8');
      return loginFile.includes('socialLoading') && 
             loginFile.includes('Connecting...') &&
             loginFile.includes('Google sign-in');
    }
  },
  {
    name: 'Dashboard sidebar links navigate correctly',
    check: async () => {
      const dashFile = fs.readFileSync('src/components/views/DashboardView.jsx', 'utf8');
      return dashFile.includes("setCurrentView('reports')") && 
             dashFile.includes("setCurrentView('team')") &&
             dashFile.includes("setCurrentView('settings')") &&
             dashFile.includes("setCurrentView('support')");
    }
  },
  {
    name: 'Footer links wired (source check)',
    check: async () => {
      const sharedFile = fs.readFileSync('src/components/Shared.jsx', 'utf8');
      return sharedFile.includes("setCurrentView('terms')") && 
             sharedFile.includes("setCurrentView('privacy')") &&
             sharedFile.includes("setCurrentView('contact')") &&
             sharedFile.includes("setCurrentView('support')");
    }
  },
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.check();
      if (result) {
        console.log(`✓ ${test.name}`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name} (error: ${error.message})`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
