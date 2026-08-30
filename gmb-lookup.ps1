param(
    [string]$CompanyName,
    [string]$City,
    [string]$Segment
)

$ErrorActionPreference = 'Stop'

$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Google Places API key (free tier: $200/month credit)
$API_KEY = "AIzaSyDUMMYKEYFORNOW"  # Substituir por chave real

# Search query
$query = "$CompanyName $City $Segment"
$encodedQuery = [System.Uri]::EscapeDataString($query)

# Find Place from Text (return all fields)
$url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=$encodedQuery&inputtype=textquery&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_rating_total,reviews,opening_hours,photos,types,url&key=$API_KEY"

try {
    $request = [System.Net.HttpWebRequest]::Create($url)
    $request.Method = "GET"
    $request.ContentType = 'application/json'
    $request.Accept = 'application/json'
    $request.Timeout = 60000

    $response = $request.GetResponse()
    $responseStream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream, [System.Text.Encoding]::UTF8)
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()

    # Output JSON
    [Console]::Write($responseBody)
}
catch {
    # Return error JSON
    $errorJson = @{ error = $($_.Exception.Message); status = "ERROR" } | ConvertTo-Json
    [Console]::Write($errorJson)
}
