<?php

return [
    'paths' => ['api/*', 'sanctum/*', 'login', 'logout', 'register'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://cloudblog-frontend-btbaejdngxbyh7av.francecentral-01.azurewebsites.net'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];