$cmd = "npx vercel --prod --yes "
$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyCQpavsnI_RGer13JrkcMfBCXp6FFjI6bg"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "matematica-1f25e.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "matematica-1f25e"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "matematica-1f25e.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "605749634000"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:605749634000:web:07a44ab51ff70623470fd5"
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" = "G-NQ7P661J1R"
}

foreach ($key in $envVars.Keys) {
    $val = $envVars[$key]
    $cmd += "-b ${key}=${val} -e ${key}=${val} "
}

Write-Host "Executing Vercel Deploy..."
Invoke-Expression $cmd
