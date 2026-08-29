param(
    [string]$Method,
    [string]$Url,
    [string]$BodyPath,
    [string]$Auth
)

$ErrorActionPreference = 'Stop'

$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$bodyBytes = [System.IO.File]::ReadAllBytes($BodyPath)

$request = [System.Net.HttpWebRequest]::Create($Url)
$request.Method = $Method
$request.ContentType = 'application/json; charset=utf-8'
$request.Accept = 'application/json'
$request.Timeout = 300000
$request.ReadWriteTimeout = 300000
if ($Auth) { $request.Headers.Add('Authorization', $Auth) }

$requestStream = $request.GetRequestStream()
$requestStream.Write($bodyBytes, 0, $bodyBytes.Length)
$requestStream.Close()

$response = $request.GetResponse()
$responseStream = $response.GetResponseStream()
$reader = New-Object System.IO.StreamReader($responseStream, [System.Text.Encoding]::UTF8)
$responseBody = $reader.ReadToEnd()
$reader.Close()
$response.Close()

[Console]::Write($responseBody)
