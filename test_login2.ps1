$guid = [guid]::NewGuid().ToString('N').Substring(0, 8)
$username = "debug_$guid"
$email = "$username@example.com"
$password = "TestPass-$guid"
$base = "http://localhost:33235"

$signupJson = @{username = $username; email = $email; password = $password } | ConvertTo-Json -Compress
$loginJson = @{username = $username; password = $password } | ConvertTo-Json -Compress

Write-Host "--- SIGNUP ---"
$signupResp = curl.exe -s -w "\nHTTP_STATUS:%{http_code}\n" -H "Content-Type: application/json" -d $signupJson "$base/api/auth/signup"
Write-Host $signupResp

Write-Host "--- LOGIN ---"
$loginResp = curl.exe -s -w "\nHTTP_STATUS:%{http_code}\n" -H "Content-Type: application/json" -d $loginJson "$base/api/auth/login"
Write-Host $loginResp

