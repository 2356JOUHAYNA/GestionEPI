<?php
return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Autorise ton front en dev
    'allowed_origins' => ['http://localhost:3000'],

    // ou bien pour tous (dev uniquement !) : 
    // 'allowed_origins' => ['*'],

    'allowed_methods' => ['*'],          // GET, POST, PUT, DELETE, OPTIONS...
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,     // passe à true si tu utilises des cookies/session
];
