<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

class FileController extends Controller
{
    /**
     * 下载文件
     */
    public function download($filename)
    {
        // 安全检查：防止路径遍历攻击
        if (preg_match('/\.\./', $filename) || preg_match('/[\/\\\\]/', $filename)) {
            return response('Invalid filename', 400)
                ->header('Content-Type', 'text/html');
        }

        $filePath = storage_path('app/uploads/' . $filename);

        if (!file_exists($filePath)) {
            return response('File not found', 404)
                ->header('Content-Type', 'text/html');
        }

        $stats = stat($filePath);

        return Response::download($filePath, $filename, [
            'Content-Type' => 'application/octet-stream',
            'Content-Length' => $stats['size']
        ]);
    }
}