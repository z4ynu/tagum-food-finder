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

  [long]$RelationId = 15986415,

  [string]$ExpectedReferenceCode = "1102319000",

  [string]$ExpectedOfficialName = "City of Tagum",

  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\validation\snapshots")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$osmiumImage = "docker.io/iboates/osmium@sha256:a67987f7d822d951ae1979de656ab7bd8051605f79d2751ea4800cc6057124be"
$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
$actualMd5 = (Get-FileHash -Algorithm MD5 -LiteralPath $resolvedInput).Hash.ToLowerInvariant()

if ($actualMd5 -ne $ExpectedMd5.ToLowerInvariant()) {
  throw "Source MD5 mismatch. Expected $ExpectedMd5 but received $actualMd5."
}

New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

$inputDirectory = Split-Path -Parent $resolvedInput
$inputName = Split-Path -Leaf $resolvedInput
$outputStem = "osm-relation-$RelationId"
$outputPbf = Join-Path $resolvedOutput "$outputStem.osm.pbf"
$outputGeoJson = Join-Path $resolvedOutput "$outputStem.geojson"
$outputManifest = Join-Path $resolvedOutput "$outputStem.manifest.json"
$inputMount = "type=bind,source=$inputDirectory,target=/input,readonly"
$outputMount = "type=bind,source=$resolvedOutput,target=/output"

& docker image inspect $osmiumImage | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "The pinned Osmium image is not available locally."
}

& docker run --rm --mount $inputMount --mount $outputMount $osmiumImage getid -r -t --overwrite "/input/$inputName" "r$RelationId" -o "/output/$outputStem.osm.pbf"
if ($LASTEXITCODE -ne 0) {
  throw "Osmium failed to extract relation $RelationId."
}

& docker run --rm --mount $outputMount $osmiumImage export --stop-on-error --overwrite --geometry-types=polygon --attributes=type,id,version,timestamp --add-unique-id=type_id "/output/$outputStem.osm.pbf" -o "/output/$outputStem.geojson"
if ($LASTEXITCODE -ne 0) {
  throw "Osmium failed to export relation $RelationId as GeoJSON."
}

$geoJson = Get-Content -Raw -LiteralPath $outputGeoJson | ConvertFrom-Json
$features = @($geoJson.features)

if ($features.Count -ne 1) {
  throw "Expected one boundary feature but found $($features.Count)."
}

$feature = $features[0]
if ($feature.geometry.type -notin @("Polygon", "MultiPolygon")) {
  throw "Expected polygonal geometry but found $($feature.geometry.type)."
}

if ($feature.properties.ref -ne $ExpectedReferenceCode) {
  throw "Boundary reference mismatch. Expected $ExpectedReferenceCode."
}

if ($feature.properties.official_name -ne $ExpectedOfficialName) {
  throw "Boundary name mismatch. Expected $ExpectedOfficialName."
}

$manifest = [ordered]@{
  schemaVersion = 1
  generatedAt = [DateTimeOffset]::UtcNow.ToString("o")
  relationId = $RelationId
  source = [ordered]@{
    fileName = $inputName
    md5 = $actualMd5
    url = $SourceUrl
    version = $SourceVersion
  }
  extractor = [ordered]@{
    image = $osmiumImage
    osmiumVersion = "1.19.0"
  }
  outputs = [ordered]@{
    geoJsonFile = Split-Path -Leaf $outputGeoJson
    geoJsonSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $outputGeoJson).Hash.ToLowerInvariant()
    pbfFile = Split-Path -Leaf $outputPbf
    pbfSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $outputPbf).Hash.ToLowerInvariant()
  }
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $outputManifest -Encoding utf8NoBOM

Write-Output "Extracted relation $RelationId to $outputGeoJson"
Write-Output "Manifest: $outputManifest"
