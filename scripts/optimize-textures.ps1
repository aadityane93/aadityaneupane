Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot 'source-textures'
$textureRoot = Join-Path $projectRoot 'public\textures'
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' } |
  Select-Object -First 1

$textures = @(
  @{ Source = 'desk-022-col-metalness-4k.png'; Output = 'desk-color-2k.jpg'; Size = 2048; Format = 'jpeg' },
  @{ Source = 'desk-022-nrm-metalness-4k.png'; Output = 'desk-normal-2k.png'; Size = 2048; Format = 'png' },
  @{ Source = 'a4-sheet-006-ao-metalness-4k.png'; Output = 'paper-art-1k.jpg'; Size = 1024; Format = 'jpeg' }
)

foreach ($texture in $textures) {
  $sourcePath = Join-Path $sourceRoot $texture.Source
  $outputPath = Join-Path $textureRoot $texture.Output
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $bitmap = New-Object System.Drawing.Bitmap $texture.Size, $texture.Size, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($source, 0, 0, $texture.Size, $texture.Size)

    if ($texture.Format -eq 'jpeg') {
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]90)
      try {
        $bitmap.Save($outputPath, $jpegCodec, $encoderParams)
      } finally {
        $encoderParams.Dispose()
      }
    } else {
      $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $source.Dispose()
  }

  Write-Output "$($texture.Source) -> $($texture.Output)"
}
