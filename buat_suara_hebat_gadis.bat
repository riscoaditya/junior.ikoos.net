@echo off
setlocal
title Membuat Suara Hebat - Gadis Neural

echo.
echo Membuat audio "Bismillahirrahmanirrahim!" dengan voice id-ID-GadisNeural...
echo.

where py >nul 2>nul
if errorlevel 1 (
    echo Python belum terpasang atau perintah "py" tidak ditemukan.
    echo Silakan instal Python dari python.org, lalu jalankan file ini kembali.
    pause
    exit /b 1
)

py -m pip install --user --quiet edge-tts
if errorlevel 1 (
    echo Gagal memasang edge-tts. Pastikan komputer terhubung ke internet.
    pause
    exit /b 1
)

py -m edge_tts ^
  --voice "id-ID-GadisNeural" ^
  --text "Bismillah Hirrohman Nirrohim !" ^
  --rate="-5%%" ^
  --pitch="+8Hz" ^
  --write-media "%~dp0Bismillahirrahmanirrahim.mp3"

if errorlevel 1 (
    echo.
    echo Gagal membuat audio. Periksa koneksi internet, lalu coba kembali.
    pause
    exit /b 1
)

echo.
echo Berhasil. File tersimpan di:
echo %~dp0Hebat-Gadis.mp3
echo.
pause
endlocal
