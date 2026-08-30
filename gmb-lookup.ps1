param(
    [string]$CompanyName,
    [string]$City,
    [string]$Segment
)

$ErrorActionPreference = 'Stop'

$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Google Places API key (substituir por chave real)
$API_KEY = "AIzaSyDUMMYKEYFORNOW"

# Se a chave for dummy, retorna imediatamente (evita timeout desnecessário)
if ($API_KEY -eq "AIzaSyDUMMYKEYFORNOW") {
    [Console]::Write('{"status":"API_KEY_NOT_CONFIGURED","candidates":[]}')
    exit 0
}

$query = "$CompanyName $City $Segment"
$encodedQuery = [System.Uri]::EscapeDataString($query)
$url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=$encodedQuery&inputtype=textquery&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_rating_total,reviews,opening_hours,photos,types,url&key=$API_KEY"

try {
    $request = [System.Net.HttpWebRequest]::Create($url)
    $request.Method = "GET"
    $request.ContentType = 'application/json'
    $request.Accept = 'application/json'
    $request.Timeout = 10000

    $response = $request.GetResponse()
    $responseStream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream, [System.Text.Encoding]::UTF8)
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()

    [Console]::Write($responseBody)
}
catch {
    $errorJson = @{ error = $($_.Exception.Message); status = "ERROR" } | ConvertTo-Json
    [Console]::Write($errorJson)
}
