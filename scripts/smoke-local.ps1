$ErrorActionPreference = 'Stop'

$base = if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { 'http://localhost:3000' }

function Assert-Status($name, $response, $expected) {
  if ($response.StatusCode -ne $expected) {
    throw "$name failed. Expected $expected got $($response.StatusCode)"
  }
  Write-Output "$name ok ($($response.StatusCode))"
}

Write-Output "Smoke checks against $base"

# Public page checks
$r = Invoke-WebRequest -Uri "$base/" -Method Get -UseBasicParsing
Assert-Status "home" $r 200

$r = Invoke-WebRequest -Uri "$base/account/login" -Method Get -UseBasicParsing
Assert-Status "login page" $r 200

$r = Invoke-WebRequest -Uri "$base/checkout" -Method Get -UseBasicParsing
Assert-Status "checkout page" $r 200

# Admin guard checks (should reject without auth)
try {
  Invoke-WebRequest -Uri "$base/api/admin/inventory/suppliers" -Method Post -ContentType 'application/json' -Body '{"name":"Test Supplier"}' -ErrorAction Stop -UseBasicParsing | Out-Null
  throw 'admin suppliers no-auth should fail but succeeded'
} catch {
  if ($_.Exception.Response) {
    $status = [int]$_.Exception.Response.StatusCode
    if ($status -ne 403) {
      throw "admin suppliers no-auth expected 403 got $status"
    }
    Write-Output "admin suppliers no-auth guard ok (403)"
  } else {
    throw
  }
}

try {
  Invoke-WebRequest -Uri "$base/api/admin/inventory/alerts" -Method Post -ContentType 'application/json' -Body '{"thresholdDays":30}' -ErrorAction Stop -UseBasicParsing | Out-Null
  throw 'admin alerts no-auth should fail but succeeded'
} catch {
  if ($_.Exception.Response) {
    $status = [int]$_.Exception.Response.StatusCode
    if ($status -ne 403) {
      throw "admin alerts no-auth expected 403 got $status"
    }
    Write-Output "admin alerts no-auth guard ok (403)"
  } else {
    throw
  }
}

Write-Output 'All local smoke checks passed.'
