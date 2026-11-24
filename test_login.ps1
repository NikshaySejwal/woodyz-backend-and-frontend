$guid = [guid]::NewGuid().ToString('N').Substring(0, 10)
$username = "debug_$guid"
$email = "$username@example.com"
$password = "TestPass-$guid!"
$base = "http://localhost:33235"

$signupBody = @{username = $username; email = $email; password = $password } | ConvertTo-Json -Compress
$loginBody = @{username = $username; password = $password } | ConvertTo-Json -Compress

Write-Host "--- SIGNUP ---"
try {
    $resp = Invoke-WebRequest -Uri "$base/api/auth/signup" -Method POST -ContentType "application/json" -Body $signupBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status:" $resp.StatusCode
    Write-Host $resp.Content
}
catch {
    if ($_.Exception.Response) {
        $status = $_.Exception.Response.StatusCode.Value__
        $body = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
    } else {
        $status = "NoResponse"
        $body = $_.Exception.Message
    }
    Write-Host "Status:" $status
    Write-Host $body
}

Write-Host "--- LOGIN ---"
try {
    $resp = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status:" $resp.StatusCode
    Write-Host $resp.Content
}
catch {
    if ($_.Exception.Response) {
        $status = $_.Exception.Response.StatusCode.Value__
        $body = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
    } else {
        $status = "NoResponse"
        $body = $_.Exception.Message
    }
    Write-Host "Status:" $status
    Write-Host $body
}

