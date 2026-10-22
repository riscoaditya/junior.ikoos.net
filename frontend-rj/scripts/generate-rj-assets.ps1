$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "public\assets\rj\commands"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

function New-PathRoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Brush($color) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($color))
}

function New-Pen($color, [float]$width = 6) {
  $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($color)), $width
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  return $pen
}

function Fill-Ellipse($g, $color, [float]$x, [float]$y, [float]$w, [float]$h) {
  $brush = New-Brush $color
  $g.FillEllipse($brush, $x, $y, $w, $h)
  $brush.Dispose()
}

function Fill-Rect($g, $color, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r = 0) {
  $brush = New-Brush $color
  if ($r -gt 0) {
    $path = New-PathRoundRect $x $y $w $h $r
    $g.FillPath($brush, $path)
    $path.Dispose()
  } else {
    $g.FillRectangle($brush, $x, $y, $w, $h)
  }
  $brush.Dispose()
}

function Stroke-Line($g, $color, [float]$width, [float]$x1, [float]$y1, [float]$x2, [float]$y2) {
  $pen = New-Pen $color $width
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)
  $pen.Dispose()
}

function Stroke-Path($g, $color, [float]$width, $path) {
  $pen = New-Pen $color $width
  $g.DrawPath($pen, $path)
  $pen.Dispose()
}

function Fill-Polygon($g, $color, [System.Drawing.PointF[]]$points) {
  $brush = New-Brush $color
  $g.FillPolygon($brush, $points)
  $brush.Dispose()
}

function Draw-Seed($g, $main, $accent) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddBezier(84, 184, 38, 98, 114, 44, 165, 66)
  $path.AddBezier(213, 88, 191, 178, 120, 203, 84, 184)
  $path.CloseFigure()
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 54, 46, 150, 160),
    [System.Drawing.ColorTranslator]::FromHtml("#fff3b4"),
    [System.Drawing.ColorTranslator]::FromHtml($main),
    45
  )
  $g.FillPath($brush, $path)
  $brush.Dispose()
  Stroke-Path $g "#9a5d18" 8 $path
  Stroke-Line $g $accent 5 104 170 155 78
  Fill-Ellipse $g "#ffffff" 92 77 34 22
  $path.Dispose()
}

function Draw-Drop($g) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddBezier(128, 38, 78, 100, 70, 134, 83, 164)
  $path.AddBezier(100, 203, 157, 209, 176, 166, 185, 137)
  $path.AddBezier(185, 137, 194, 108, 158, 68, 128, 38)
  $path.CloseFigure()
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 68, 35, 122, 170),
    [System.Drawing.ColorTranslator]::FromHtml("#b8f7ff"),
    [System.Drawing.ColorTranslator]::FromHtml("#00a2ff"),
    58
  )
  $g.FillPath($brush, $path)
  $brush.Dispose()
  Stroke-Path $g "#006cc7" 7 $path
  Fill-Ellipse $g "#ffffff" 108 82 28 40
  $path.Dispose()
}

function Draw-Sun($g) {
  for ($i = 0; $i -lt 12; $i++) {
    $angle = ($i * 30) * [Math]::PI / 180
    $x1 = 128 + [Math]::Cos($angle) * 72
    $y1 = 128 + [Math]::Sin($angle) * 72
    $x2 = 128 + [Math]::Cos($angle) * 100
    $y2 = 128 + [Math]::Sin($angle) * 100
    Stroke-Line $g "#ffbf00" 13 $x1 $y1 $x2 $y2
  }
  Fill-Ellipse $g "#ffe86c" 65 65 126 126
  Fill-Ellipse $g "#ffc400" 76 76 104 104
  Fill-Ellipse $g "#fff7a8" 88 84 36 30
}

function Draw-Flag($g) {
  Stroke-Line $g "#102a56" 12 77 48 77 206
  $points = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 83, 50),
    (New-Object System.Drawing.PointF 184, 70),
    (New-Object System.Drawing.PointF 155, 101),
    (New-Object System.Drawing.PointF 184, 134),
    (New-Object System.Drawing.PointF 83, 116)
  )
  Fill-Polygon $g "#ff3f62" $points
  $pen = New-Pen "#102a56" 8
  $g.DrawPolygon($pen, $points)
  $pen.Dispose()
}

function Draw-Finish($g) {
  Stroke-Line $g "#102a56" 11 77 48 77 207
  for ($row = 0; $row -lt 4; $row++) {
    for ($col = 0; $col -lt 4; $col++) {
      $color = if (($row + $col) % 2 -eq 0) { "#111827" } else { "#ffffff" }
      Fill-Rect $g $color (84 + $col * 24) (53 + $row * 22) 24 22
    }
  }
  $pen = New-Pen "#102a56" 7
  $g.DrawRectangle($pen, 84, 53, 96, 88)
  $pen.Dispose()
}

function Draw-Arrow($g, $direction) {
  $points = @()
  if ($direction -eq "right") {
    $points = [System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF 48, 105),
      (New-Object System.Drawing.PointF 132, 105),
      (New-Object System.Drawing.PointF 132, 72),
      (New-Object System.Drawing.PointF 209, 128),
      (New-Object System.Drawing.PointF 132, 184),
      (New-Object System.Drawing.PointF 132, 151),
      (New-Object System.Drawing.PointF 48, 151)
    )
  } elseif ($direction -eq "left") {
    $points = [System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF 208, 105),
      (New-Object System.Drawing.PointF 124, 105),
      (New-Object System.Drawing.PointF 124, 72),
      (New-Object System.Drawing.PointF 47, 128),
      (New-Object System.Drawing.PointF 124, 184),
      (New-Object System.Drawing.PointF 124, 151),
      (New-Object System.Drawing.PointF 208, 151)
    )
  } elseif ($direction -eq "up") {
    $points = [System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF 105, 208),
      (New-Object System.Drawing.PointF 105, 124),
      (New-Object System.Drawing.PointF 72, 124),
      (New-Object System.Drawing.PointF 128, 47),
      (New-Object System.Drawing.PointF 184, 124),
      (New-Object System.Drawing.PointF 151, 124),
      (New-Object System.Drawing.PointF 151, 208)
    )
  } else {
    $points = [System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF 105, 48),
      (New-Object System.Drawing.PointF 105, 132),
      (New-Object System.Drawing.PointF 72, 132),
      (New-Object System.Drawing.PointF 128, 209),
      (New-Object System.Drawing.PointF 184, 132),
      (New-Object System.Drawing.PointF 151, 132),
      (New-Object System.Drawing.PointF 151, 48)
    )
  }
  Fill-Polygon $g "#ffffff" $points
  $pen = New-Pen "#102a56" 9
  $g.DrawPolygon($pen, $points)
  $pen.Dispose()
}

function Draw-Shovel($g) {
  Stroke-Line $g "#5b351c" 15 77 66 164 176
  $points = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 151, 156),
    (New-Object System.Drawing.PointF 197, 184),
    (New-Object System.Drawing.PointF 165, 218),
    (New-Object System.Drawing.PointF 128, 184)
  )
  Fill-Polygon $g "#c9d3dc" $points
  $pen = New-Pen "#334155" 7
  $g.DrawPolygon($pen, $points)
  $pen.Dispose()
  Fill-Rect $g "#a05a28" 57 42 58 38 17
}

function Draw-Soil($g) {
  Fill-Ellipse $g "#7a3d1d" 56 128 148 58
  Fill-Ellipse $g "#a65f31" 74 102 56 40
  Fill-Ellipse $g "#8f4d25" 111 92 72 52
  Fill-Ellipse $g "#623017" 97 143 39 21
  Fill-Ellipse $g "#c78148" 80 117 30 20
}

function Draw-Sprout($g) {
  Draw-Soil $g
  Stroke-Line $g "#138c36" 13 128 151 128 82
  $left = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 126, 110),
    (New-Object System.Drawing.PointF 69, 80),
    (New-Object System.Drawing.PointF 95, 135)
  )
  $right = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 132, 102),
    (New-Object System.Drawing.PointF 190, 70),
    (New-Object System.Drawing.PointF 162, 130)
  )
  Fill-Polygon $g "#4ade80" $left
  Fill-Polygon $g "#22c55e" $right
  $pen = New-Pen "#08783a" 6
  $g.DrawPolygon($pen, $left)
  $g.DrawPolygon($pen, $right)
  $pen.Dispose()
}

function Draw-WateringCan($g) {
  Fill-Rect $g "#1ea7f7" 73 99 104 78 24
  Fill-Rect $g "#1087d8" 73 157 104 24 12
  Stroke-Line $g "#0860a8" 9 78 105 45 83
  Stroke-Line $g "#0860a8" 9 44 83 30 111
  $pen = New-Pen "#0860a8" 8
  $g.DrawArc($pen, 92, 50, 76, 78, 185, 170)
  $g.DrawArc($pen, 164, 104, 52, 54, -72, 154)
  $pen.Dispose()
  Fill-Ellipse $g "#9fe8ff" 109 120 36 24
}

function Draw-Stone($g) {
  $points = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 69, 161),
    (New-Object System.Drawing.PointF 78, 100),
    (New-Object System.Drawing.PointF 128, 70),
    (New-Object System.Drawing.PointF 186, 96),
    (New-Object System.Drawing.PointF 202, 153),
    (New-Object System.Drawing.PointF 154, 190),
    (New-Object System.Drawing.PointF 96, 188)
  )
  Fill-Polygon $g "#95a3b3" $points
  $pen = New-Pen "#526071" 8
  $g.DrawPolygon($pen, $points)
  $pen.Dispose()
  Stroke-Line $g "#cbd5e1" 6 96 103 130 83
  Stroke-Line $g "#6b7280" 5 133 84 155 176
}

function Draw-Car($g) {
  Fill-Rect $g "#f97316" 55 122 148 48 18
  $roof = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 86, 122),
    (New-Object System.Drawing.PointF 111, 86),
    (New-Object System.Drawing.PointF 157, 86),
    (New-Object System.Drawing.PointF 184, 122)
  )
  Fill-Polygon $g "#fb3f50" $roof
  $pen = New-Pen "#102a56" 7
  $g.DrawPolygon($pen, $roof)
  $g.DrawRectangle($pen, 55, 122, 148, 48)
  $pen.Dispose()
  Fill-Rect $g "#b7efff" 112 95 35 26 6
  Fill-Ellipse $g "#102a56" 78 154 34 34
  Fill-Ellipse $g "#102a56" 166 154 34 34
  Fill-Ellipse $g "#e5edf8" 87 163 16 16
  Fill-Ellipse $g "#e5edf8" 175 163 16 16
}

function Draw-Wait($g) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddLine(83, 48, 174, 48)
  $path.AddLine(174, 84, 142, 128)
  $path.AddLine(174, 172, 174, 208)
  $path.AddLine(83, 208, 83, 172)
  $path.AddLine(114, 128, 83, 84)
  $path.CloseFigure()
  Fill-Rect $g "#ffffff" 83 48 91 160 14
  Stroke-Path $g "#102a56" 8 $path
  Fill-Polygon $g "#f59e0b" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 104, 74), (New-Object System.Drawing.PointF 153, 74), (New-Object System.Drawing.PointF 128, 111)))
  Fill-Polygon $g "#f59e0b" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 128, 145), (New-Object System.Drawing.PointF 104, 187), (New-Object System.Drawing.PointF 153, 187)))
  $path.Dispose()
}

function Draw-Repeat($g) {
  $pen = New-Pen "#102a56" 11
  $g.DrawArc($pen, 57, 61, 139, 102, 190, 220)
  $g.DrawArc($pen, 57, 93, 139, 102, 10, 220)
  $pen.Dispose()
  Fill-Polygon $g "#ffffff" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 188, 53), (New-Object System.Drawing.PointF 201, 108), (New-Object System.Drawing.PointF 151, 87)))
  Fill-Polygon $g "#ffffff" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 68, 203), (New-Object System.Drawing.PointF 55, 148), (New-Object System.Drawing.PointF 105, 169)))
  $font = New-Object System.Drawing.Font("Arial", 34, [System.Drawing.FontStyle]::Bold)
  $brush = New-Brush "#102a56"
  $g.DrawString("x3", $font, $brush, 100, 105)
  $font.Dispose()
  $brush.Dispose()
}

function Draw-Fruit($g, $ripe) {
  $color1 = if ($ripe) { "#fff0a6" } else { "#eaffbd" }
  $color2 = if ($ripe) { "#ff4055" } else { "#4cd543" }
  $color3 = if ($ripe) { "#b80f29" } else { "#168a31" }
  Fill-Ellipse $g $color2 65 76 126 126
  Fill-Ellipse $g $color1 86 92 35 30
  Stroke-Line $g "#7a3b18" 13 127 84 143 45
  $leaf = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 144, 55),
    (New-Object System.Drawing.PointF 196, 45),
    (New-Object System.Drawing.PointF 166, 88)
  )
  Fill-Polygon $g "#4ade80" $leaf
  $pen = New-Pen $color3 7
  $g.DrawEllipse($pen, 65, 76, 126, 126)
  $pen.Dispose()
}

function Draw-Basket($g) {
  $pen = New-Pen "#743a1a" 9
  $g.DrawArc($pen, 76, 56, 104, 86, 180, 180)
  $pen.Dispose()
  Fill-Rect $g "#c47a34" 62 116 132 74 22
  Stroke-Line $g "#743a1a" 7 62 139 194 139
  Stroke-Line $g "#743a1a" 7 78 119 92 187
  Stroke-Line $g "#743a1a" 7 128 116 128 190
  Stroke-Line $g "#743a1a" 7 178 119 164 187
  Draw-Fruit $g $true
}

function Draw-People($g, $count) {
  for ($i = 0; $i -lt $count; $i++) {
    $x = 74 + ($i * 46)
    $shirt = "#1ea7f7"
    if ($i % 2 -eq 0) { $shirt = "#22c55e" }
    Fill-Ellipse $g "#ffd5a8" $x 70 42 42
    Fill-Rect $g $shirt ($x - 7) 115 56 78 24
    Fill-Ellipse $g "#2f1f16" ($x + 5) 64 34 18
  }
}

function Draw-Talk($g) {
  Fill-Rect $g "#ffffff" 47 66 162 112 24
  $tail = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 92, 176), (New-Object System.Drawing.PointF 75, 214), (New-Object System.Drawing.PointF 130, 176))
  Fill-Polygon $g "#ffffff" $tail
  $path = New-PathRoundRect 47 66 162 112 24
  Stroke-Path $g "#102a56" 8 $path
  $path.Dispose()
  Fill-Ellipse $g "#102a56" 82 113 14 14
  Fill-Ellipse $g "#102a56" 121 113 14 14
  Fill-Ellipse $g "#102a56" 160 113 14 14
}

function Draw-Sound($g) {
  Fill-Polygon $g "#ffffff" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 50, 108), (New-Object System.Drawing.PointF 86, 108), (New-Object System.Drawing.PointF 137, 68), (New-Object System.Drawing.PointF 137, 188), (New-Object System.Drawing.PointF 86, 148), (New-Object System.Drawing.PointF 50, 148)))
  $pen = New-Pen "#102a56" 8
  $g.DrawPolygon($pen, [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 50, 108), (New-Object System.Drawing.PointF 86, 108), (New-Object System.Drawing.PointF 137, 68), (New-Object System.Drawing.PointF 137, 188), (New-Object System.Drawing.PointF 86, 148), (New-Object System.Drawing.PointF 50, 148)))
  $g.DrawArc($pen, 145, 96, 40, 64, -48, 96)
  $g.DrawArc($pen, 155, 72, 66, 112, -48, 96)
  $pen.Dispose()
}

function Draw-Cube($g) {
  Fill-Polygon $g "#22c55e" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 128, 37), (New-Object System.Drawing.PointF 200, 78), (New-Object System.Drawing.PointF 128, 119), (New-Object System.Drawing.PointF 56, 78)))
  Fill-Polygon $g "#fbbf24" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 56, 78), (New-Object System.Drawing.PointF 128, 119), (New-Object System.Drawing.PointF 128, 210), (New-Object System.Drawing.PointF 56, 168)))
  Fill-Polygon $g "#f97316" ([System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 200, 78), (New-Object System.Drawing.PointF 128, 119), (New-Object System.Drawing.PointF 128, 210), (New-Object System.Drawing.PointF 200, 168)))
  $pen = New-Pen "#102a56" 7
  $g.DrawPolygon($pen, [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 128, 37), (New-Object System.Drawing.PointF 200, 78), (New-Object System.Drawing.PointF 200, 168), (New-Object System.Drawing.PointF 128, 210), (New-Object System.Drawing.PointF 56, 168), (New-Object System.Drawing.PointF 56, 78)))
  $g.DrawLine($pen, 128, 119, 128, 210)
  $g.DrawLine($pen, 56, 78, 128, 119)
  $g.DrawLine($pen, 200, 78, 128, 119)
  $pen.Dispose()
}

function Save-Icon($name, $bg1, $bg2, [scriptblock]$draw) {
  $bitmap = New-Object System.Drawing.Bitmap 256, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 15, 52, 78))
  $g.FillEllipse($shadow, 45, 202, 166, 24)
  $shadow.Dispose()

  & $draw $g
  $path = Join-Path $outDir "$name.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bitmap.Dispose()
}

Save-Icon "start" "#ffe680" "#ffb703" { param($g) Draw-Flag $g }
Save-Icon "finish" "#d7b8ff" "#8b5cf6" { param($g) Draw-Finish $g }
Save-Icon "move-right" "#6ad7ff" "#168eea" { param($g) Draw-Arrow $g "right" }
Save-Icon "move-left" "#6ad7ff" "#168eea" { param($g) Draw-Arrow $g "left" }
Save-Icon "move-up" "#6ad7ff" "#168eea" { param($g) Draw-Arrow $g "up" }
Save-Icon "move-down" "#6ad7ff" "#168eea" { param($g) Draw-Arrow $g "down" }
Save-Icon "seed-sunflower" "#fff2a3" "#f59e0b" { param($g) Draw-Seed $g "#d88a19" "#9a5d18" }
Save-Icon "seed-bean" "#ffe1a2" "#c47b2e" { param($g) Draw-Seed $g "#b9772c" "#7c4a20" }
Save-Icon "seed-mango" "#ffe58b" "#f5b21b" { param($g) Draw-Seed $g "#edbd2f" "#a56a13" }
Save-Icon "dig" "#dca36b" "#9a5a2d" { param($g) Draw-Shovel $g }
Save-Icon "insert-seed" "#fff2a3" "#f59e0b" { param($g) Draw-Seed $g "#d88a19" "#9a5d18"; Draw-Soil $g }
Save-Icon "cover-soil" "#86efac" "#22c55e" { param($g) Draw-Sprout $g }
Save-Icon "watering-can" "#8be7ff" "#168eea" { param($g) Draw-WateringCan $g }
Save-Icon "stone" "#d4dde6" "#8492a6" { param($g) Draw-Stone $g }
Save-Icon "toy-car" "#ffbc70" "#f97316" { param($g) Draw-Car $g }
Save-Icon "water" "#91ecff" "#0ea5e9" { param($g) Draw-Drop $g }
Save-Icon "sun" "#fff18a" "#f59e0b" { param($g) Draw-Sun $g }
Save-Icon "wait" "#dac0ff" "#a855f7" { param($g) Draw-Wait $g }
Save-Icon "repeat3" "#7bed9f" "#16a34a" { param($g) Draw-Repeat $g }
Save-Icon "fruit-green" "#b8ff8e" "#22c55e" { param($g) Draw-Fruit $g $false }
Save-Icon "fruit-ripe" "#ffb4bc" "#f43f5e" { param($g) Draw-Fruit $g $true }
Save-Icon "harvest" "#ffd98a" "#f59e0b" { param($g) Draw-Basket $g }
Save-Icon "take-fruit" "#ffb4bc" "#f43f5e" { param($g) Draw-Fruit $g $true; Draw-Basket $g }
Save-Icon "share-ali" "#8eead5" "#14b8a6" { param($g) Draw-People $g 1 }
Save-Icon "share-family" "#9bf2b4" "#22c55e" { param($g) Draw-People $g 3 }
Save-Icon "share-friend" "#a5e9ff" "#38bdf8" { param($g) Draw-People $g 2 }
Save-Icon "talk" "#ddbcff" "#a855f7" { param($g) Draw-Talk $g }
Save-Icon "sound" "#86efac" "#10b981" { param($g) Draw-Sound $g }
Save-Icon "cube" "#d2ffe1" "#20c66c" { param($g) Draw-Cube $g }

Write-Host "Generated RJ PNG assets in $outDir"
