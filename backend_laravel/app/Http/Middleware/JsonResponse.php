<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class JsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (!$request->expectsJson() && method_exists($response, 'header')) {
            $response->header('Content-Type', 'application/json');
        }

        return $response;
    }
}