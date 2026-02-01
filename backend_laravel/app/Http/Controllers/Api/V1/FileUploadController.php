<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileUploadController extends Controller
{
    /**
     * 上传CKEditor图片
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'upload' => 'required|image|mimes:png,jpg,jpeg,gif,webp|max:5120'
        ]);

        $file = $request->file('upload');
        $assignmentId = $request->input('assignmentId', 'temp');
        $studentYear = $request->input('studentYear', date('Y'));

        $filename = $studentYear . '_' . $assignmentId . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $filepath = "uploads/{$studentYear}/{$assignmentId}/article/{$filename}";

        Storage::disk('local')->put($filepath, file_get_contents($file));

        $imageUrl = "/uploads/{$filepath}";

        return response()->json([
            'url' => $imageUrl,
            'default' => $imageUrl
        ]);
    }

    /**
     * 上传作业附件
     */
    public function uploadAttachment(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:52428800'
        ]);

        $file = $request->file('file');
        $assignmentId = $request->input('assignmentId', 'temp');
        $studentYear = $request->input('studentYear', date('Y'));

        $filename = $studentYear . '_' . $assignmentId . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $filepath = "uploads/{$studentYear}/{$assignmentId}/article/{$filename}";

        Storage::disk('local')->put($filepath, file_get_contents($file));

        $fileUrl = "/uploads/{$filepath}";

        return response()->json([
            'success' => true,
            'data' => [
                'filename' => $filename,
                'filepath' => $fileUrl,
                'originalname' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mimetype' => $file->getMimeType()
            ]
        ]);
    }
}