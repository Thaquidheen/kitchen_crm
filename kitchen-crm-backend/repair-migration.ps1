# PowerShell script to repair failed Flyway migration V35
# This script will delete the failed migration record so Flyway can retry it

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$database = "kitchen_crm"
$username = "kitchen_crm"

Write-Host "Repairing failed Flyway migration V35..." -ForegroundColor Yellow

# Prompt for password
$password = Read-Host "Enter MySQL password for user '$username'" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# SQL command to execute
$sql = "USE kitchen_crm; DELETE FROM flyway_schema_history WHERE version = '35' AND success = 0; SELECT 'Migration V35 repair completed' AS result;"

# Execute SQL
try {
    $result = & $mysqlPath -u $username -p$plainPassword $database -e $sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully repaired migration V35!" -ForegroundColor Green
        Write-Host "You can now restart your Spring Boot application." -ForegroundColor Green
    } else {
        Write-Host "Error executing SQL. Please check your credentials." -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Clear password from memory
$plainPassword = $null

