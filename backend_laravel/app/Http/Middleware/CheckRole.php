<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'error' => '未认证'
            ], 401);
        }

        if (!in_array($request->user()->role, $roles)) {
            return response()->json([
                'success' => false,
                'error' => '权限不足'
            ], 403);
        }

        return $next($request);
    }
}