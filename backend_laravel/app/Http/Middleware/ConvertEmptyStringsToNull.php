<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull as Middleware;

class ConvertEmptyStringsToNull extends Middleware
{
    /**
     * All of the middleware should be skipped.
     *
     * @var array<int, string>
     */
    protected $skipWhen = [
        // 这里可以添加跳过中间件的条件
    ];
}