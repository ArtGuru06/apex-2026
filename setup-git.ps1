#!/usr/bin/env pwsh
# setup-git.ps1 — Initialize and push apex-2026 to GitHub

$ErrorActionPreference = "Continue"

Write-Host "=== Setting git identity ===" -ForegroundColor Cyan
git config --global user.name "Armaanjot18"
git config --global user.email "armaanjot870@gmail.com"
git config --global commit.gpgsign false
git config --global core.pager ""
git config --global core.autocrlf true

Write-Host "=== Initializing repo ===" -ForegroundColor Cyan
if (Test-Path ".git") {
    Write-Host "Git repo already exists, skipping init."
} else {
    git init
}

Write-Host "=== Staging files ===" -ForegroundColor Cyan
git add -A
git status

Write-Host "=== Committing ===" -ForegroundColor Cyan
$env:GIT_EDITOR = "true"
git commit --no-gpg-sign -m "feat: initial commit - APEX 2026 tech fest website"

Write-Host "=== Setting up remote and pushing ===" -ForegroundColor Cyan
git branch -M main
git remote remove origin 2>$null
git remote add origin "https://github.com/Armaanjot18/apex-2026.git"

Write-Host ""
Write-Host "=== DONE - Now run the push command ===" -ForegroundColor Green
Write-Host "Run: git push -u origin main" -ForegroundColor Yellow
