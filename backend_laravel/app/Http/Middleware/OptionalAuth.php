<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OptionalAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if ($token) {
            try {
                Auth::setUser(
                    \Laravel\Sanctum\PersonalAccessToken::findToken($token)?->tokenable
                );
            } catch (\Exception $e) {
            }
        }

        return $next($request);
    }
}