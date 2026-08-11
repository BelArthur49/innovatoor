@echo off
cd /d "%~dp0"
echo Starting local server at http://localhost:8000/map.html
echo Press Control+C to stop.
python -m http.server 8000
pause
