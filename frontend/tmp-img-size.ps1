Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem "c:\xampp\htdocs\IKOOS\junior.ikoos.net\frontend\public\assets\stages\stage-7\backgrounds\*.png"
foreach ($f in $files) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  Write-Output ("{0} {1}x{2}" -f $f.Name, $img.Width, $img.Height)
  $img.Dispose()
}
