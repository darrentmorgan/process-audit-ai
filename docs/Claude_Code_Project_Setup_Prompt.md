# Claude Code Project Setup Prompt

Copy and paste this prompt into Claude Code while in your project directory to automatically create all necessary ClickUp tasks and project structure.

---

## 🚀 CLAUDE CODE PROJECT SETUP PROMPT

```
I need you to analyze this codebase and automatically set up a complete ClickUp project management structure for this software development project. Here's what I need you to do:

## 📋 CLICKUP WORKSPACE INTEGRATION

**ClickUp Space**: 🚀 Software Development (Space ID: 90165097160)

### REQUIRED TASKS TO CREATE:

1. **PROJECT EPIC** (in List ID: 901611068371 - Active Projects):
   - Analyze the codebase to understand the project type, tech stack, and main features
   - Create a comprehensive project epic task using the template structure
   - Include actual GitHub repository URL from this project
   - Set realistic timeline based on codebase complexity
   - Add appropriate tags: ["epic", "active-project", "[detected-tech-stack]"]

2. **SPRINT TASKS** (in List ID: 901611068377 - Development Sprints):
   - Analyze current development status and create relevant sprint tasks
   - Break down remaining work into story-pointed tasks
   - Create tasks for any obvious missing features or improvements
   - Include GitHub integration with proper branch naming
   - Add tags: ["sprint", "development", "[component-type]"]

3. **BUG ANALYSIS** (in List ID: 901611068380 - Bug Reports):
   - Scan code for potential issues, TODOs, or FIXME comments
   - Create bug tasks for any identified issues
   - Include code location references and severity assessment
   - Add tags: ["bug", "analysis", "[severity-level]"]

4. **TECHNICAL DEBT ASSESSMENT** (in List ID: 901611068382 - Technical Debt):
   - Identify areas needing refactoring or improvement
   - Create tasks for code quality improvements
   - Include performance optimization opportunities
   - Add tags: ["technical-debt", "refactoring", "[component]"]

5. **DOCUMENTATION TASKS** (in List ID: 901611068384 - Documentation Tasks):
   - Analyze current documentation and identify gaps
   - Create tasks for missing README sections, API docs, etc.
   - Include code documentation improvements needed
   - Add tags: ["documentation", "missing-docs", "[doc-type]"]

6. **DEPLOYMENT & DEVOPS** (in List ID: 901611068385 - DevOps & Infrastructure):
   - Analyze current deployment setup and CI/CD pipeline
   - Create tasks for missing DevOps infrastructure
   - Include monitoring, testing, and deployment improvements
   - Add tags: ["devops", "infrastructure", "[environment]"]

## 🔧 TASK DETAILS TO INCLUDE:

### For Each Task Created:
- **Assignee**: darren@baliluxurystays.com
- **Realistic due dates** based on complexity
- **Story points** using Fibonacci scale (1,2,3,5,8,13)
- **Priority levels** based on importance
- **Detailed descriptions** with code references where applicable
- **GitHub repository link** in task description
- **ClickUp task ID integration** for commit referencing

### Task Naming Convention:
- Epic: "🎯 [Project Name]: [Main Goal]"
- Sprint: "🏃‍♂️ Sprint [X]: [Sprint Goal]"
- Development: "⚡ [Feature/Component]: [Description]"
- Bug: "🐛 Fix: [Issue Description]"
- Docs: "📖 Documentation: [Doc Type]"
- DevOps: "⚙️ Infrastructure: [Setup Type]"

## 🔗 GITHUB INTEGRATION SETUP:

1. **Analyze the current Git setup** and provide branch strategy recommendations
2. **Create GitHub integration tasks** for setting up proper workflow
3. **Include commit message conventions** with ClickUp task IDs
4. **Set up PR template recommendations** in a GitHub integration task

## 📊 PROJECT ANALYSIS REQUIREMENTS:

Please analyze and include in your tasks:

1. **Codebase Assessment**:
   - Primary programming language(s)
   - Frameworks and libraries used
   - Database technology (if any)
   - Testing framework presence
   - CI/CD pipeline status

2. **Development Status**:
   - Current completion percentage estimate
   - Major features already implemented
   - Missing critical functionality
   - Code quality assessment

3. **Technical Stack Documentation**:
   - Dependencies and versions
   - Environment setup requirements
   - Build and deployment processes
   - Testing coverage status

## 🎯 DELIVERABLES EXPECTED:

After analysis, create:
- 1 Project Epic task with complete project overview
- 3-5 Sprint tasks based on remaining work
- 2-4 Bug/issue tasks from code analysis
- 1-3 Technical debt tasks for improvements
- 2-3 Documentation tasks for missing docs
- 1-2 DevOps tasks for infrastructure needs

## 📈 SUCCESS CRITERIA:

- All tasks should have realistic timelines
- Story points should reflect actual complexity
- GitHub repository properly linked
- Tasks should be actionable and specific
- Project structure should reflect actual codebase needs
- Integration with existing ClickUp workflow maintained

Please start by analyzing the codebase, then create all the ClickUp tasks with proper organization, realistic estimates, and comprehensive descriptions. Make sure each task includes the GitHub repository URL and follows the established ClickUp conventions.
```

---

## 📝 USAGE INSTRUCTIONS

1. **Navigate to your project directory** in Claude Code
2. **Copy the entire prompt above** (between the triple backticks)
3. **Paste into Claude Code** and press Enter
4. **Claude will analyze your codebase** and automatically create all necessary ClickUp tasks
5. **Review the created tasks** and adjust timelines/priorities as needed
6. **Connect GitHub integration** following the provided setup guide

## 🔧 CUSTOMIZATION OPTIONS

### For Different Project Types:
- **Web Applications**: Focus on frontend/backend separation
- **APIs**: Emphasize documentation and testing tasks
- **Libraries**: Include packaging and publishing tasks
- **Mobile Apps**: Add platform-specific considerations
- **Data Projects**: Include data pipeline and analysis tasks

### For Different Team Sizes:
- **Solo Development**: Reduce sprint complexity, focus on sequential tasks
- **Small Team (2-3)**: Include collaboration and code review processes
- **Larger Team**: Add coordination tasks and role-specific assignments

### For Different Project Phases:
- **New Projects**: Heavy focus on architecture and setup tasks
- **Existing Projects**: Emphasize feature development and improvements
- **Legacy Projects**: Priority on refactoring and modernization
- **Maintenance Projects**: Focus on bug fixes and incremental improvements

---

**Prompt Created By**: Claude Code Development Expert
**Compatible With**: All programming languages and project types
**ClickUp Integration**: Full compatibility with Software Development space
**Last Updated**: September 14, 2025