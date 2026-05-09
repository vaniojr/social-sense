# GitHub Setup Instructions - Social Sense

**Status:** ✅ Local Git repository initialized  
**Branch:** main  
**First Commit:** Ready to push  

---

## 🚀 Quick Start - 3 Steps (2 minutes)

### Step 1: Create Repository on GitHub

```bash
1. Go to: https://github.com/new
2. Repository name: social-sense
3. Description: Real-time opinion intelligence platform (Politics, Influencers, Brands)
4. Visibility: Choose Public or Private
5. DO NOT initialize with README (we already have one)
6. Click "Create repository"
7. You'll see a page with commands to run
```

### Step 2: Get Your Repository URL

After clicking "Create repository", GitHub shows:

```
Quick setup — if you've done this kind of thing before
…or push an existing repository from the command line

git remote add origin https://github.com/YOUR_USERNAME/social-sense.git
git branch -M main
git push -u origin main
```

**Copy the URL:** `https://github.com/YOUR_USERNAME/social-sense.git`

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Push to GitHub

Run these commands in your terminal:

```bash
cd /Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My\ Drive/Projects/social-sense

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/social-sense.git

# Verify it's added
git remote -v
# Should show:
# origin    https://github.com/YOUR_USERNAME/social-sense.git (fetch)
# origin    https://github.com/YOUR_USERNAME/social-sense.git (push)

# Push to GitHub
git push -u origin main
```

---

## ✅ Verify It Worked

After pushing, you should see:

```
Enumerating objects: 21, done.
Counting objects: 100% (21/21), done.
Delta compression using up to 8 threads
Compressing objects: 100% (20/20), done.
Writing objects: 100% (21/21), 6.78 KiB | 6.78 KiB/s, done.
Total 21 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/YOUR_USERNAME/social-sense.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

Then visit: `https://github.com/YOUR_USERNAME/social-sense`

You should see all your files on GitHub! 🎉

---

## 📋 What's Being Pushed

```
✅ Documentation
   ├── CLAUDE.md
   ├── README.md
   ├── FINAL_STACK_CONFIRMATION.md
   ├── .env.example
   └── docs/
       ├── ARCHITECTURE.md
       ├── DESIGN.md
       ├── SETUP_LOCAL.md
       ├── DEPLOYMENT_GUIDE.md
       ├── EMAIL_SETUP.md
       └── API.md

✅ Configuration
   ├── .gitignore
   └── .git/ (local repo tracking)

⏸️ NOT included
   ├── .env (secrets - .gitignore blocks it)
   ├── node_modules/ (will install locally)
   └── src/ (frontend/backend code - you'll create next)
```

---

## 🔧 Troubleshooting

### "fatal: remote origin already exists"

```bash
# If you get this error, remove the old remote:
git remote remove origin

# Then add the correct one:
git remote add origin https://github.com/YOUR_USERNAME/social-sense.git
git push -u origin main
```

### "Authentication failed"

If GitHub asks for authentication:

**Option A: Use Personal Access Token (Recommended)**
```bash
# Generate at: https://github.com/settings/tokens
# Settings → Developer settings → Personal access tokens → Generate new token
# Scopes: repo, workflow

# When pushing, use token as password:
git push -u origin main
# When prompted for password, paste the token
```

**Option B: Use SSH (Advanced)**
```bash
# Setup SSH key (one time):
ssh-keygen -t ed25519 -C "vaniojr@gmail.com"
# Add to GitHub: https://github.com/settings/ssh

# Then use SSH URL instead:
git remote add origin git@github.com:YOUR_USERNAME/social-sense.git
git push -u origin main
```

### Verify repository is public (if wanted)

```bash
# Go to: https://github.com/YOUR_USERNAME/social-sense/settings
# Scroll to "Danger Zone"
# Repository visibility should be "Public" or "Private"
```

---

## 📝 After Pushing

### Check GitHub
Visit: https://github.com/YOUR_USERNAME/social-sense

You should see:
- ✅ README.md displayed
- ✅ All docs/ files listed
- ✅ Commit history showing "Initial commit"
- ✅ Branch: main

### Update Your Local Config (if different username)

If your GitHub username is different from local git config:

```bash
# Check current config
git config user.name
git config user.email

# Update if needed (local only, just this repo)
git config user.name "Your Real Name"
git config user.email "your@email.com"

# Or globally (all repos):
git config --global user.name "Your Real Name"
git config --global user.email "your@email.com"
```

---

## 🎯 Next Steps After GitHub Push

Once your repo is on GitHub:

1. **Verify it's there:** Visit https://github.com/YOUR_USERNAME/social-sense
2. **Clone it** (to test):
   ```bash
   git clone https://github.com/YOUR_USERNAME/social-sense.git
   cd social-sense
   git status  # Should show "On branch main, nothing to commit"
   ```

3. **Start Phase 1:** Follow [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
   - Clone repo
   - Setup Docker + PostgreSQL
   - Create React frontend
   - Create Node/Python backend

4. **Setup CI/CD** (later):
   - Vercel will auto-deploy frontend on push
   - Railway will auto-deploy backend on push
   - Just push to main → automatic deployment

---

## 💡 Git Tips

### Check current status
```bash
git status
# Shows what's staged, unstaged, untracked
```

### View commit history
```bash
git log --oneline
# Shows all commits
```

### Make changes & commit
```bash
# After editing files:
git add .                    # Stage all changes
git commit -m "Fix: ..."     # Commit
git push                     # Push to GitHub
# That's it! Changes live on GitHub
```

### Create a new branch (for features)
```bash
git checkout -b feature/geographic-analysis
# Make changes
git add .
git commit -m "Add geographic analysis feature"
git push -u origin feature/geographic-analysis
# Then create Pull Request on GitHub
```

---

## ✅ Checklist

Before moving to Phase 1 (Setup Local):

- [ ] Repository created on GitHub
- [ ] `git push -u origin main` executed
- [ ] Can visit https://github.com/YOUR_USERNAME/social-sense
- [ ] All files appear on GitHub
- [ ] `git status` shows "On branch main, nothing to commit"

**Once all checked:** Ready to start [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)! 🚀

---

## 📞 Common Commands Reference

```bash
# Clone repo (to another machine)
git clone https://github.com/YOUR_USERNAME/social-sense.git

# Check status
git status

# See what changed
git diff

# Stage changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push

# Pull latest from GitHub
git pull

# Create new branch
git checkout -b feature-name

# Switch branch
git checkout branch-name

# See all branches
git branch -a

# Delete branch (local)
git branch -d feature-name

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

**Questions?** Check GitHub's docs: https://docs.github.com/

**Ready?** Let me know once you push! Then we start Phase 1. 🚀
