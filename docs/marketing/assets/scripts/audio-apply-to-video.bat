@echo off
setlocal
cd /d "%~dp0"

rem --- edit this (filename only, must exist in ..\audio\) ---
set "AUDIO_NAME=Atmospheria - Francis Preve.mp3"
rem -----------------------------------------------------------

set "AUDIO_DIR=..\audio"
set "VIDEO_IN=..\video\demo-video.webm"
set "AUDIO_FILE=%AUDIO_DIR%\%AUDIO_NAME%"

where ffmpeg >nul 2>&1
if errorlevel 1 goto :no_ffmpeg
if not exist "%VIDEO_IN%" goto :no_video
if not exist "%AUDIO_FILE%" goto :no_audio

call :set_output "%AUDIO_FILE%"

echo.
echo Video:  %VIDEO_IN%
echo Audio:  %AUDIO_FILE%
echo Output: %OUTPUT%
echo.

ffmpeg -y ^
  -i "%VIDEO_IN%" ^
  -i "%AUDIO_FILE%" ^
  -map 0:v:0 -map 1:a:0 ^
  -c:v libx264 -pix_fmt yuv420p -crf 22 ^
  -c:a aac -b:a 192k ^
  -shortest ^
  "%OUTPUT%"

if errorlevel 1 goto :ffmpeg_failed

echo.
echo Done: %OUTPUT%
pause
exit /b 0

:no_ffmpeg
echo ffmpeg was not found on PATH. Install it or run from a terminal where ffmpeg is available.
pause
exit /b 1

:no_video
echo Missing video: %VIDEO_IN%
pause
exit /b 1

:no_audio
echo Missing audio: %AUDIO_FILE%
echo Edit AUDIO_NAME at the top of this script.
pause
exit /b 1

:ffmpeg_failed
echo.
echo ffmpeg failed.
pause
exit /b 1

:set_output
set "OUTPUT=..\video\demo-video-with-music-%~n1.mp4"
exit /b 0
