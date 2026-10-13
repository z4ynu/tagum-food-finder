[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$InputPath,

  [Parameter(Mandatory)]
  [ValidatePattern("^[a-fA-F0-9]{32}$")]
  [string]$ExpectedMd5,

  [Parameter(Mandatory)]
  [string]$SourceVersion,

  [Parameter(Mandatory)]
  [string]$SourceUrl,

  [string]$BoundaryPath = (Join-Path $PSScriptRoot "..\validation\snapshots\osm-relation-15986415.geojson"),

  [ValidatePattern("^[a-fA-F0-9]{64}$")]
  [string]$ExpectedBoundarySha256 = "6b4633950b60c7402d0e8373354eb2df34ffe7e460464e934800f304543e2af0",

  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\validation\snapshots")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$osmiumImage = "docker.io/iboates/osmium@sha256:a67987f7d822d951ae1979de656ab7bd8051605f79d2751ea4800cc6057124be"
$filterExpressions = @(
  "nwr/amenity=restaurant,cafe,fast_food,food_court,ice_cream,bar,biergarten,pub",
  "nwr/shop=bakery,coffee,confectionery,deli,ice_cream,pastry,tea"
)

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedBoundary = (Resolve-Path -LiteralPath $BoundaryPath).Path
$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
$actualMd5 = (Get-FileHash -Algorithm MD5 -LiteralPath $resolvedInput).Hash.ToLowerInvariant()
$actualBoundarySha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedBoundary).Hash.ToLowerInvariant()

if ($actualMd5 -ne $ExpectedMd5.ToLowerInvariant()) {
  throw "Source MD5 mismatch. Expected $ExpectedMd5 but received $actualMd5."
}

if ($actualBoundarySha256 -ne $ExpectedBoundarySha256.ToLowerInvariant()) {
  throw "Boundary SHA-256 mismatch. Expected $ExpectedBoundarySha256 but received $actualBoundarySha256."
}

$boundary = Get-Content -Raw -LiteralPath $resolvedBoundary | ConvertFrom-Json
$boundaryFeatures = @($boundary.features)
if ($boundaryFeatures.Count -ne 1 -or $boundaryFeatures[0].properties.ref -ne "1102319000") {
  throw "Boundary file does not identify the approved Tagum PSGC 1102319000 geometry."
}

New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

$inputDirectory = Split-Path -Parent $resolvedInput
$inputName = Split-Path -Leaf $resolvedInput
$boundaryDirectory = Split-Path -Parent $resolvedBoundary
$boundaryName = Split-Path -Leaf $resolvedBoundary
$clipPbf = Join-Path $resolvedOutput "osm-tagum-clip.osm.pbf"
$foodPbf = Join-Path $resolvedOutput "osm-tagum-food-places.osm.pbf"
$foodGeoJsonSequence = Join-Path $resolvedOutput "osm-tagum-food-places.geojsonseq"
$manifestPath = Join-Path $resolvedOutput "osm-tagum-food-places.manifest.json"
$inputMount = "type=bind,source=$inputDirectory,target=/input,readonly"
$boundaryMount = "type=bind,source=$boundaryDirectory,target=/boundary,readonly"
$outputMount = "type=bind,source=$resolvedOutput,target=/output"

& docker image inspect $osmiumImage | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "The pinned Osmium image is not available locally."
}

& docker run --rm --mount $inputMount --mount $boundaryMount --mount $outputMount $osmiumImage extract --polygon "/boundary/$boundaryName" --strategy=complete_ways --set-bounds --overwrite "/input/$inputName" -o "/output/$(Split-Path -Leaf $clipPbf)"
if ($LASTEXITCODE -ne 0) {
  throw "Osmium failed to clip the source to the approved Tagum boundary."
}

& docker run --rm --mount $outputMount $osmiumImage tags-filter --overwrite "/output/$(Split-Path -Leaf $clipPbf)" @filterExpressions -o "/output/$(Split-Path -Leaf $foodPbf)"
if ($LASTEXITCODE -ne 0) {
  throw "Osmium failed to filter Tagum food-place candidates."
}

& docker run --rm --mount $outputMount $osmiumImage export --stop-on-error --overwrite --attributes=type,id,version,timestamp --add-unique-id=type_id -f geojsonseq "/output/$(Split-Path -Leaf $foodPbf)" -o "/output/$(Split-Path -Leaf $foodGeoJsonSequence)"
if ($LASTEXITCODE -ne 0) {
  throw "Osmium failed to export the food-place candidates as GeoJSON sequence."
}

$recordCount = @(Get-Content -LiteralPath $foodGeoJsonSequence).Count
$manifest = [ordered]@{
  schemaVersion = 1
  generatedAt = [DateTimeOffset]::UtcNow.ToString("o")
  source = [ordered]@{
    fileName = $inputName
    md5 = $actualMd5
    url = $SourceUrl
    version = $SourceVersion
  }
  boundary = [ordered]@{
    fileName = $boundaryName
    relationId = 15986415
    sha256 = $actualBoundarySha256
  }
  extractor = [ordered]@{
    image = $osmiumImage
    osmiumVersion = "1.19.0"
    filters = $filterExpressions
  }
  outputs = [ordered]@{
    geoJsonSequenceFile = Split-Path -Leaf $foodGeoJsonSequence
    geoJsonSequenceRecords = $recordCount
    geoJsonSequenceSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $foodGeoJsonSequence).Hash.ToLowerInvariant()
    pbfFile = Split-Path -Leaf $foodPbf
    pbfSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $foodPbf).Hash.ToLowerInvariant()
  }
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8NoBOM

Write-Output "Exported $recordCount Tagum food-place features to $foodGeoJsonSequence"
Write-Output "Manifest: $manifestPath"
