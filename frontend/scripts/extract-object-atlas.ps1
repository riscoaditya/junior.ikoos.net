param(
  [string]$AtlasDir = (Join-Path $PSScriptRoot '..\public\assets\stages\shared\source-atlases'),
  [string]$OutDir = (Join-Path $PSScriptRoot '..\public\assets\stages\shared\objects'),
  [string]$CharacterOutDir = (Join-Path $PSScriptRoot '..\public\assets\stages\shared\characters')
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class ObjectAtlasExtractor
{
    public static void Extract(string atlasPath, string outputDir, string[] names, int columns, int rows, int outputSize)
    {
        if (!File.Exists(atlasPath))
        {
            throw new FileNotFoundException("Atlas not found", atlasPath);
        }

        Directory.CreateDirectory(outputDir);

        using (var atlas = new Bitmap(atlasPath))
        {
            for (var index = 0; index < names.Length; index++)
            {
                var column = index % columns;
                var row = index / columns;
                var left = (int)Math.Round(column * atlas.Width / (double)columns);
                var top = (int)Math.Round(row * atlas.Height / (double)rows);
                var right = (int)Math.Round((column + 1) * atlas.Width / (double)columns);
                var bottom = (int)Math.Round((row + 1) * atlas.Height / (double)rows);

                using (var cell = Crop(atlas, new Rectangle(left, top, right - left, bottom - top)))
                {
                    Color keyColor;
                    using (var transparent = RemoveConnectedGreenScreen(cell, out keyColor))
                    using (var normalized = NormalizeToSquare(transparent, outputSize, keyColor))
                    {
                        if (NeedsGlobalKeyCleanup(names[index]))
                        {
                            RemoveStrongKeyColor(normalized, keyColor);
                        }

                        var outPath = Path.Combine(outputDir, names[index] + ".png");
                        normalized.Save(outPath, ImageFormat.Png);
                    }
                }
            }
        }
    }

    private static Bitmap Crop(Bitmap source, Rectangle rect)
    {
        var bitmap = new Bitmap(rect.Width, rect.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(bitmap))
        {
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImage(source, new Rectangle(0, 0, rect.Width, rect.Height), rect, GraphicsUnit.Pixel);
        }
        return bitmap;
    }

    private static Bitmap RemoveConnectedGreenScreen(Bitmap source, out Color keyColor)
    {
        var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(bitmap))
        {
            graphics.DrawImage(source, 0, 0, source.Width, source.Height);
        }

        var width = bitmap.Width;
        var height = bitmap.Height;
        var visited = new bool[width, height];
        var queue = new Queue<Point>();

        var localKeyColor = ReadKeyColor(bitmap);
        keyColor = localKeyColor;

        Action<int, int> enqueue = (x, y) =>
        {
            if (x < 0 || y < 0 || x >= width || y >= height || visited[x, y]) return;
            if (!IsBackground(bitmap.GetPixel(x, y), localKeyColor)) return;
            visited[x, y] = true;
            queue.Enqueue(new Point(x, y));
        };

        for (var x = 0; x < width; x++)
        {
            enqueue(x, 0);
            enqueue(x, height - 1);
        }

        for (var y = 0; y < height; y++)
        {
            enqueue(0, y);
            enqueue(width - 1, y);
        }

        while (queue.Count > 0)
        {
            var point = queue.Dequeue();
            var color = bitmap.GetPixel(point.X, point.Y);
            bitmap.SetPixel(point.X, point.Y, Color.Transparent);

            enqueue(point.X + 1, point.Y);
            enqueue(point.X - 1, point.Y);
            enqueue(point.X, point.Y + 1);
            enqueue(point.X, point.Y - 1);
        }

        RemoveKeyColorIslands(bitmap, localKeyColor);
        RemoveKeyFringe(bitmap, localKeyColor);

        return bitmap;
    }

    private static Color ReadKeyColor(Bitmap bitmap)
    {
        long totalR = 0;
        long totalG = 0;
        long totalB = 0;
        var count = 0;
        var sampleSize = Math.Min(12, Math.Min(bitmap.Width, bitmap.Height) / 6);

        Action<int, int> sampleCorner = (startX, startY) =>
        {
            for (var y = startY; y < startY + sampleSize; y++)
            {
                for (var x = startX; x < startX + sampleSize; x++)
                {
                    var color = bitmap.GetPixel(x, y);
                    totalR += color.R;
                    totalG += color.G;
                    totalB += color.B;
                    count++;
                }
            }
        };

        sampleCorner(0, 0);
        sampleCorner(bitmap.Width - sampleSize, 0);
        sampleCorner(0, bitmap.Height - sampleSize);
        sampleCorner(bitmap.Width - sampleSize, bitmap.Height - sampleSize);

        return Color.FromArgb(
            (int)(totalR / count),
            (int)(totalG / count),
            (int)(totalB / count)
        );
    }

    private static bool IsBackground(Color color, Color key)
    {
        if (color.A < 8) return true;

        var distanceToKey = Math.Sqrt(
            (color.R - key.R) * (color.R - key.R) +
            (color.G - key.G) * (color.G - key.G) +
            (color.B - key.B) * (color.B - key.B)
        );

        return distanceToKey < 120;
    }

    private static void RemoveKeyColorIslands(Bitmap bitmap, Color key)
    {
        for (var y = 0; y < bitmap.Height; y++)
        {
            for (var x = 0; x < bitmap.Width; x++)
            {
                var color = bitmap.GetPixel(x, y);
                if (color.A < 8 || !IsBackground(color, key)) continue;
                bitmap.SetPixel(x, y, Color.Transparent);
            }
        }
    }

    private static void RemoveKeyFringe(Bitmap bitmap, Color key)
    {
        var transparent = new bool[bitmap.Width, bitmap.Height];

        for (var y = 0; y < bitmap.Height; y++)
        {
            for (var x = 0; x < bitmap.Width; x++)
            {
                transparent[x, y] = bitmap.GetPixel(x, y).A < 16;
            }
        }

        for (var y = 1; y < bitmap.Height - 1; y++)
        {
            for (var x = 1; x < bitmap.Width - 1; x++)
            {
                var color = bitmap.GetPixel(x, y);
                if (color.A < 16) continue;
                if (!TouchesTransparent(transparent, x, y)) continue;
                if (!LooksLikeKeyFringe(color, key)) continue;
                bitmap.SetPixel(x, y, Color.Transparent);
            }
        }
    }

    private static bool TouchesTransparent(bool[,] transparent, int x, int y)
    {
        return transparent[x + 1, y] || transparent[x - 1, y] || transparent[x, y + 1] || transparent[x, y - 1];
    }

    private static bool LooksLikeKeyFringe(Color color, Color key)
    {
        if (key.R > 180 && key.B > 180 && key.G < 100)
        {
            return color.R > 130 && color.B > 85 && color.G < 145;
        }

        if (key.G > 180 && key.R < 100 && key.B < 100)
        {
            return color.G > 150 && color.R < 140 && color.B < 140;
        }

        return false;
    }

    private static bool NeedsGlobalKeyCleanup(string name)
    {
        switch (name)
        {
            case "friend":
            case "ali-main":
            case "teman-main":
            case "gift":
            case "soap":
            case "flower":
                return false;
            default:
                return true;
        }
    }

    private static void RemoveStrongKeyColor(Bitmap bitmap, Color key)
    {
        for (var y = 0; y < bitmap.Height; y++)
        {
            for (var x = 0; x < bitmap.Width; x++)
            {
                var color = bitmap.GetPixel(x, y);
                if (color.A < 16) continue;
                if (!LooksLikeStrongKeyColor(color, key)) continue;
                bitmap.SetPixel(x, y, Color.Transparent);
            }
        }
    }

    private static bool LooksLikeStrongKeyColor(Color color, Color key)
    {
        if (key.R > 180 && key.B > 180 && key.G < 100)
        {
            return color.R > 110 && color.B > 75 && color.G < 190;
        }

        if (key.G > 180 && key.R < 100 && key.B < 100)
        {
            return color.G > 150 && color.R < 140 && color.B < 140;
        }

        return false;
    }

    private static Bitmap NormalizeToSquare(Bitmap source, int outputSize, Color key)
    {
        var bounds = FindOpaqueBounds(source);
        var output = new Bitmap(outputSize, outputSize, PixelFormat.Format32bppArgb);

        using (var graphics = Graphics.FromImage(output))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.SmoothingMode = SmoothingMode.AntiAlias;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

            var maxSubjectSize = outputSize - 34;
            var scale = Math.Min(maxSubjectSize / (double)bounds.Width, maxSubjectSize / (double)bounds.Height);
            var destWidth = Math.Max(1, (int)Math.Round(bounds.Width * scale));
            var destHeight = Math.Max(1, (int)Math.Round(bounds.Height * scale));
            var destX = (outputSize - destWidth) / 2;
            var destY = (outputSize - destHeight) / 2;

            graphics.DrawImage(source, new Rectangle(destX, destY, destWidth, destHeight), bounds, GraphicsUnit.Pixel);
        }

        RemoveKeyColorIslands(output, key);
        RemoveKeyFringe(output, key);
        RemoveKeyFringe(output, key);
        RemoveTinyOpaqueIslands(output, 90);

        return output;
    }

    private static void RemoveTinyOpaqueIslands(Bitmap bitmap, int minArea)
    {
        var width = bitmap.Width;
        var height = bitmap.Height;
        var visited = new bool[width, height];
        var queue = new Queue<Point>();
        var component = new List<Point>();

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                if (visited[x, y] || bitmap.GetPixel(x, y).A < 16) continue;

                component.Clear();
                visited[x, y] = true;
                queue.Enqueue(new Point(x, y));

                while (queue.Count > 0)
                {
                    var point = queue.Dequeue();
                    component.Add(point);
                    TryQueueOpaque(bitmap, visited, queue, point.X + 1, point.Y);
                    TryQueueOpaque(bitmap, visited, queue, point.X - 1, point.Y);
                    TryQueueOpaque(bitmap, visited, queue, point.X, point.Y + 1);
                    TryQueueOpaque(bitmap, visited, queue, point.X, point.Y - 1);
                }

                if (component.Count >= minArea) continue;

                foreach (var point in component)
                {
                    bitmap.SetPixel(point.X, point.Y, Color.Transparent);
                }
            }
        }
    }

    private static void TryQueueOpaque(Bitmap bitmap, bool[,] visited, Queue<Point> queue, int x, int y)
    {
        if (x < 0 || y < 0 || x >= bitmap.Width || y >= bitmap.Height || visited[x, y]) return;
        if (bitmap.GetPixel(x, y).A < 16) return;
        visited[x, y] = true;
        queue.Enqueue(new Point(x, y));
    }

    private static Rectangle FindOpaqueBounds(Bitmap bitmap)
    {
        var minX = bitmap.Width;
        var minY = bitmap.Height;
        var maxX = -1;
        var maxY = -1;

        for (var y = 0; y < bitmap.Height; y++)
        {
            for (var x = 0; x < bitmap.Width; x++)
            {
                if (bitmap.GetPixel(x, y).A < 16) continue;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }

        if (maxX < minX || maxY < minY)
        {
            return new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        }

        var padding = 8;
        minX = Math.Max(0, minX - padding);
        minY = Math.Max(0, minY - padding);
        maxX = Math.Min(bitmap.Width - 1, maxX + padding);
        maxY = Math.Min(bitmap.Height - 1, maxY + padding);

        return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
    }
}
"@

$AtlasDir = (Resolve-Path $AtlasDir).Path
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path

$atlasA = Join-Path $AtlasDir 'object-atlas-a.png'
$atlasB = Join-Path $AtlasDir 'object-atlas-b.png'

$namesA = @(
  'friend',
  'starToken',
  'mosqueTarget',
  'gift',
  'rainbow',
  'pond',
  'tree',
  'food',
  'book',
  'shelf',
  'trash',
  'bin',
  'soap',
  'moon',
  'mountain',
  'planCard'
)

$namesB = @(
  'hand',
  'wudhuStation',
  'prayerMat',
  'donationBox',
  'apple',
  'honestPath',
  'queueMarker',
  'pencil',
  'aidBox',
  'rabbit',
  'carrot',
  'flower',
  'wateringCan',
  'beeCharacter',
  'ikoobotCharacter',
  'certificate'
)

[ObjectAtlasExtractor]::Extract($atlasA, $OutDir, $namesA, 4, 4, 512)
[ObjectAtlasExtractor]::Extract($atlasB, $OutDir, $namesB, 4, 4, 512)

Copy-Item -LiteralPath (Join-Path $OutDir 'moon.png') -Destination (Join-Path $OutDir 'crescent.png') -Force

$characterAtlas = Join-Path $AtlasDir 'character-atlas-stage-1.png'
if (Test-Path -LiteralPath $characterAtlas) {
  New-Item -ItemType Directory -Force -Path $CharacterOutDir | Out-Null
  $CharacterOutDir = (Resolve-Path $CharacterOutDir).Path
  [ObjectAtlasExtractor]::Extract($characterAtlas, $CharacterOutDir, @('ali-main', 'teman-main'), 2, 1, 768)
}

$count = (Get-ChildItem -LiteralPath $OutDir -Filter '*.png').Count
Write-Output "Generated $count PNG object assets in $OutDir"
if (Test-Path -LiteralPath $characterAtlas) {
  Write-Output "Generated 2 PNG character assets in $CharacterOutDir"
}
