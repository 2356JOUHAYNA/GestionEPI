<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserLog extends Model
{
    protected $table = 'user_logs';

    protected $fillable = [
        'user_id', 'email', 'action', 'success', 'ip', 'user_agent', 'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'success' => 'boolean',
    ];

    public static function log(array $data): self
    {
        return static::create([
            'user_id'    => $data['user_id']    ?? null,
            'email'      => $data['email']      ?? null,
            'action'     => $data['action'],             // login|logout|register
            'success'    => $data['success']    ?? true,
            'ip'         => $data['ip']         ?? request()->ip(),
            'user_agent' => $data['user_agent'] ?? request()->header('User-Agent'),
            'meta'       => $data['meta']       ?? null,
        ]);
    }
}