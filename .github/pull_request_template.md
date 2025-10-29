## 📝 Pull Request Template

### 🎯 Purpose
<!-- Brief description of what this PR accomplishes -->

### 🔄 Changes Made
<!-- List the main changes -->

### 🧪 Testing Checklist

#### Preview Environment Testing
- [ ] **Preview Link**: Check the automated comment below for the preview URL
- [ ] **Functionality**: Test all affected features in preview
- [ ] **Responsive**: Check mobile, tablet, and desktop views
- [ ] **Cross-browser**: Test in Chrome, Firefox, Safari
- [ ] **Accessibility**: Run accessibility tests
- [ ] **Performance**: Check Lighthouse scores (>90)
- [ ] **Error Handling**: Verify error states display correctly

#### Test Credentials (Preview Environment)
- **Admin**: admin1@staging.mariia-hub.com / staging123!
- **Client**: any email / client123!

#### Test Scenarios
- [ ] User authentication flow
- [ ] Service browsing and booking
- [ ] Payment processing (test mode)
- [ ] Email notifications
- [ ] Admin dashboard features
- [ ] Multi-language support (EN/PL)

### 📸 Screenshots / Videos
<!-- Add screenshots or videos of the changes -->

### 🔗 Related Issues
<!-- Link any related issues or tickets -->
Closes #

### 📋 Technical Details

#### Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💄 UI/UX improvement
- [ ] ⚡ Performance improvement
- [ ] 📝 Documentation
- [ ] 🔧 Configuration
- [ ] 🚀 Deployment

#### Database Changes
- [ ] No database changes
- [ ] Schema changes (migrations included)
- [ ] Data migrations
- [ ] Seed data updates

#### API Changes
- [ ] No API changes
- [ ] New endpoints
- [ ] Modified endpoints
- [ ] Breaking changes

### ⚠️ Breaking Changes
<!-- List any breaking changes and migration instructions -->

### 📊 Performance Impact
- [ ] No performance impact
- [ ] Improved performance
- [ ] May impact performance (explain)

### 🔒 Security Considerations
<!-- Any security implications or improvements -->

### 🚀 Deployment Notes

#### Preview Environment
- **Automatic Deployment**: ✅ This PR will be automatically deployed to preview
- **Test Data**: Preview environment will be seeded with test data
- **URL**: Will be posted as a comment below

#### Production Deployment
- [ ] Ready for production
- [ ] Requires testing in staging
- [ ] Requires manual deployment steps
- [ ] Dependencies on other changes/teams

### 📚 Documentation Updates
- [ ] No documentation needed
- [ ] Documentation updated in this PR
- [ ] Documentation updates needed after merge

### ✅ Pre-merge Checklist

#### Code Quality
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is clean and maintainable
- [ ] Comments added where necessary
- [ ] No console.log statements
- [ ] No TODO comments left

#### Testing
- [ ] All tests pass locally
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed in preview

#### Build & Deploy
- [ ] Build passes locally (`npm run build`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Preview deployment successful

### 📝 Additional Notes
<!-- Any additional context or notes -->

---

## 🔗 Quick Links

- **Preview Environment**: Will be automatically posted below
- **Storybook**: Not available yet
- **Design System**: Not available yet
- **API Documentation**: Not available yet
- **Staging Guide**: [View Guide](docs/STAGING_ENVIRONMENT_GUIDE.md)

## 📋 Review Process

1. **Automated Checks**: GitHub Actions will run automatically
2. **Preview Deployment**: A preview URL will be generated automatically
3. **Review**: Request review from team members
4. **Testing**: Test thoroughly in the preview environment
5. **Approval**: Get required approvals
6. **Merge**: Merge to target branch

### 👥 Required Reviewers
<!-- @mention required reviewers -->

### 🔔 Notifications
<!-- @mention people who should be notified -->

---

### 🤖 Automated Checks Status

- [ ] Build Passed
- [ ] Tests Passed
- [ ] Type Check Passed
- [ ] Linting Passed
- [ ] Security Scan Passed
- [ ] Preview Deployed

---

💡 **Tip**: Use the preview environment to test your changes before merging. The preview URL will be posted as a comment below automatically.