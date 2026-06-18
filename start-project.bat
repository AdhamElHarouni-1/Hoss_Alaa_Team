@echo off
cd /d "%~dp0"
node scripts\seed.js
node backend\server.js
