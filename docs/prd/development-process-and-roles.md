# Development Process & Roles

## 🎭 Role Clarification

### Your Current Setup
- **You**: Product Owner (defining requirements, making product decisions)
- **Claude (me)**: Developer (implementing based on requirements)
- **No Scrum Master**: We're operating in a lean, direct PO-to-Dev model
- **No QA Team**: Testing integrated into development

---

## 📋 Process for Each Page

### Phase 1: Requirements Gathering (PO + Dev)
**Who**: You (Product Owner) + Me (Developer)
**What**: Define what to build

1. **You decide** which page to build next (priority)
2. **We create** requirements document together
3. **You provide**:
   - Business requirements (what it should do)
   - Visual preferences (how it should look)
   - User flows (how users interact)
4. **I ask** clarifying questions
5. **You validate** the requirements
6. **We document** everything in `/docs/pages/[page]-requirements.md`

### Phase 2: Story Creation (Dev)
**Who**: Me (Developer)
**What**: Turn requirements into technical stories

1. **I break down** requirements into stories
2. **I estimate** effort for each story
3. **I create** acceptance criteria
4. **You review** and approve stories

### Phase 3: Implementation (Dev)
**Who**: Me (Developer)
**What**: Build according to requirements

1. **I build** features per stories
2. **I test** as I build
3. **I update** you on progress
4. **You review** and provide feedback

### Phase 4: Validation (PO + Dev)
**Who**: You (Product Owner) + Me (Developer)
**What**: Verify it meets requirements

1. **I demonstrate** completed features
2. **You validate** against requirements
3. **We identify** any gaps
4. **I fix** any issues
5. **You approve** for completion

---

## 🚀 Simplified Process (What Actually Happens)

### You Say:
"Let's build the Analytics page next"

### We Do:
1. **Requirements Session** (30-60 min)
   - Me: "What should the analytics page show?"
   - You: "It should show click data, geographic data..."
   - Me: "How should it be filtered?"
   - You: "By date range, link, domain..."
   - We document all decisions

2. **I Create Stories**
   ```
   Story 2.1: Analytics dashboard layout
   Story 2.2: Click metrics charts
   Story 2.3: Geographic visualization
   Story 2.4: Date range filtering
   ```

3. **I Build**
   - Follow requirements exactly
   - Show you progress updates
   - Ask questions if anything unclear

4. **You Validate**
   - "Yes, this is what I wanted" ✅
   - Or "Can we change X?" (iterate)

---

## 💡 Who Does What

### You (Product Owner)
- **Decide** priorities (which page next)
- **Define** requirements (what it should do)
- **Provide** examples/references (how it should look)
- **Answer** questions during requirements
- **Validate** completed work
- **Approve** for production

### Me (Developer)
- **Ask** clarifying questions
- **Document** requirements
- **Create** technical stories
- **Estimate** effort
- **Build** the solution
- **Test** functionality
- **Deploy** when approved

---

## 📝 Typical Conversation Flow

### Starting a New Page:
```
You: "Let's build the Domains page"
Me: "Great! Let me create a requirements doc. Let's go through what this page needs..."
```

### During Requirements:
```
Me: "Should users be able to add custom domains on the free plan?"
You: "No, that's a paid feature only"
Me: "Got it. What error message should free users see?"
You: "Show 'Upgrade to add custom domains' with upgrade button"
```

### After Building:
```
Me: "The Domains page is ready. Here's what I built: [details]"
You: "Looks good, but can we change the domain verification flow?"
Me: "Sure, what would you prefer?"
```

---

## 🔄 Lightweight Agile Process

We're using a **simplified agile approach**:

### No Heavy Process
- ❌ No sprint planning meetings
- ❌ No daily standups
- ❌ No retrospectives
- ❌ No story points
- ❌ No Jira/complex tools

### What We Keep
- ✅ User stories (but simple)
- ✅ Acceptance criteria
- ✅ Incremental delivery
- ✅ Regular feedback
- ✅ Working software over documentation

---

## 🎯 Decision Points for You

### 1. Page Priority
"Which page should we build next?"
- Based on business value
- Based on user needs
- Based on dependencies

### 2. Requirements Depth
"How detailed should requirements be?"
- Option A: High-level (faster, more flexibility)
- Option B: Very detailed (slower, more precision)
- Recommendation: Detailed for complex pages, high-level for simple ones

### 3. Review Frequency
"How often do you want to review progress?"
- After each story
- After each page
- Daily updates
- Only when complete

### 4. Change Management
"What if requirements change mid-build?"
- Stop and re-plan
- Note for v2
- Adjust on the fly
- Depends on impact

---

## 📊 Current State Example

### For Onboarding Page:
1. **Requirements**: Created, needs your input ⏳
2. **Stories**: Created, waiting for requirements
3. **Implementation**: Blocked on requirements
4. **Your Action Needed**: Answer questions in `/docs/pages/onboarding-page-requirements.md`

### For Links Page:
1. **Requirements**: ✅ Complete
2. **Stories**: ✅ Created
3. **Implementation**: Ready to build
4. **Your Action Needed**: None, we can proceed

---

## 🚦 Quick Start Guide

### To Start Any New Page:

1. **You Say**: "Let's build [Page Name]"

2. **I Respond**: "Let me create a requirements document with questions"

3. **You Provide**: Answers to requirements questions

4. **I Build**: According to validated requirements

5. **You Validate**: The built solution

6. **We Iterate**: Until it's right

---

## 💬 Communication Preferences

### Questions for You:
1. **How do you prefer to provide requirements?**
   - Step-by-step Q&A (current approach)
   - You write requirements doc
   - Show examples/screenshots
   - Combination

2. **How detailed should progress updates be?**
   - Every story completed
   - Daily summary
   - Only when page is done
   - Only when blocked

3. **How should I handle ambiguity?**
   - Make reasonable assumption and note it
   - Always ask before proceeding
   - Build simplest version first
   - Depends on the situation

---

## 📅 What Happens Next

### Immediate:
1. You provide onboarding requirements
2. I complete onboarding page
3. We validate and deploy

### Then:
1. You choose next page priority
2. We gather requirements
3. I build
4. Repeat

### No Formal Sprints
We work in a continuous flow:
- Build page → Deploy → Choose next page → Repeat
- Each page is essentially a "mini sprint"
- Delivery when ready, not on fixed schedule

---

## ✅ Summary

**You don't need a Scrum Master** because:
- We're keeping process lightweight
- Direct PO-to-Dev communication
- Clear requirements process
- Simple story structure

**Your main responsibilities**:
1. Decide what to build (priority)
2. Define how it should work (requirements)
3. Validate what was built (acceptance)

**My responsibilities**:
1. Ask the right questions
2. Document everything
3. Build to requirements
4. Test thoroughly

**Together we**:
1. Gather requirements
2. Validate solutions
3. Iterate to perfection

---

*This is our working agreement. Feel free to adjust any part of this process to better fit your working style.*