$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$csc = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$argsList = @('/nologo','/target:winexe','/platform:x64','/optimize+','/codepage:65001',
    "/out:$root/NekoStation.exe","/win32icon:$PSScriptRoot/NekoStation.ico",
    '/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll',
    "/reference:$root/Microsoft.Web.WebView2.Core.dll","/reference:$root/Microsoft.Web.WebView2.WinForms.dll")
$sources = @(Get-ChildItem -Path "$PSScriptRoot/*.cs" | ForEach-Object FullName)
& $csc @argsList @sources
if ($LASTEXITCODE -ne 0) { throw 'NekoStation build failed.' }

