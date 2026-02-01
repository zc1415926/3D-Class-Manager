<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Submission\StoreSubmissionRequest;
use App\Http\Requests\Submission\GradeFileRequest;
use App\Models\Submission;
use App\Models\SubmissionFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubmissionController extends Controller
{
    /**
     * 获取作品列表
     */
    public function index(Request $request)
    {
        $query = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }]);

        if ($request->has('studentYear')) {
            $query->where('student_year', $request->studentYear);
        }

        if ($request->has('studentName')) {
            $query->where('student_name', $request->studentName);
        }

        $submissions = $query->orderBy('created_at', 'desc')->get();

        $data = $submissions->map(function ($submission) {
            $primaryFile = $submission->submissionFiles->firstWhere('is_primary', true)
                ?? $submission->submissionFiles->first();

            return [
                'id' => $submission->id,
                'studentName' => $submission->student_name,
                'studentYear' => $submission->student_year,
                'workName' => $submission->work_name,
                'description' => $submission->description,
                'thumbnailPath' => $primaryFile && $primaryFile->thumbnail_path
                    ? '/' . $primaryFile->thumbnail_path
                    : null,
                'createdAt' => $submission->created_at
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 提交作品
     */
    public function store(StoreSubmissionRequest $request)
    {
        DB::beginTransaction();
        try {
            // 创建提交记录
            $submission = Submission::create([
                'student_name' => $request->studentName,
                'student_year' => $request->studentYear,
                'work_name' => $request->workName,
                'description' => $request->description,
                'assignment_id' => $request->assignmentId ? (int)$request->assignmentId : null
            ]);

            // 处理文件上传
            $files = [];

            // 检查是否是多文件模式
            if ($request->hasFile('files')) {
                // 多文件上传模式
                $uploadedFiles = $request->file('files');
                $thumbnails = $request->file('thumbnails') ?? [];
                $requirementIds = $request->get('requirementIds') ? json_decode($request->get('requirementIds'), true) : [];

                foreach ($uploadedFiles as $index => $file) {
                    $filename = $request->studentYear . '_' . ($request->assignmentId ?? 'temp') . '_' . time() . '_' . $index . '_' . $file->getClientOriginalName();
                    $filepath = $file->storeAs('uploads', $filename, 'local');
                    $thumbnailPath = null;

                    // 处理缩略图
                    if (isset($thumbnails[$index])) {
                        $thumbnail = $thumbnails[$index];
                        $thumbFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumbnail.jpg';
                        $thumbnailPath = $thumbnail->storeAs('thumbnails', $thumbFilename, 'local');
                    }

                    // 获取对应的requirementId
                    $requirementId = $requirementIds[$index] ?? null;

                    $submissionFile = SubmissionFile::create([
                        'submission_id' => $submission->id,
                        'requirement_id' => $requirementId,
                        'filename' => $filename,
                        'filepath' => $filepath,
                        'thumbnail_path' => $thumbnailPath,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                        'file_type' => $this->getFileType($file->getClientOriginalExtension())
                    ]);

                    $files[] = [
                        'id' => $submissionFile->id,
                        'filename' => $filename,
                        'filepath' => $filepath,
                        'thumbnail_path' => $thumbnailPath,
                        'is_primary' => $index === 0,
                        'requirement_id' => $requirementId
                    ];
                }
            } else {
                // 单文件上传模式（向后兼容）
                if ($request->hasFile('stlFile')) {
                    $file = $request->file('stlFile');
                    $filename = $request->studentYear . '_' . ($request->assignmentId ?? 'temp') . '_' . time() . '_' . $file->getClientOriginalName();
                    $filepath = $file->storeAs('uploads', $filename, 'local');
                    $thumbnailPath = null;

                    if ($request->hasFile('thumbnail')) {
                        $thumbnail = $request->file('thumbnail');
                        $thumbFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumbnail.jpg';
                        $thumbnailPath = $thumbnail->storeAs('thumbnails', $thumbFilename, 'local');
                    }

                    $submissionFile = SubmissionFile::create([
                        'submission_id' => $submission->id,
                        'filename' => $filename,
                        'filepath' => $filepath,
                        'thumbnail_path' => $thumbnailPath,
                        'is_primary' => true,
                        'file_type' => 'primary'
                    ]);

                    $files[] = [
                        'id' => $submissionFile->id,
                        'filename' => $filename,
                        'filepath' => $filepath,
                        'thumbnail_path' => $thumbnailPath,
                        'is_primary' => true
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '作品提交成功',
                'data' => [
                    'id' => $submission->id,
                    'studentName' => $submission->student_name,
                    'workName' => $submission->work_name,
                    'files' => $files
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 根据文件扩展名获取文件类型
     */
    private function getFileType($extension)
    {
        $extension = strtolower($extension);
        if (in_array($extension, ['stl', 'obj'])) {
            return 'model';
        } elseif (in_array($extension, ['png', 'jpg', 'jpeg', 'gif'])) {
            return 'image';
        } elseif (in_array($extension, ['pdf', 'doc', 'docx', 'txt'])) {
            return 'document';
        } elseif (in_array($extension, ['mp4', 'avi', 'mov'])) {
            return 'video';
        }
        return 'general';
    }

    /**
     * 获取作品详情
     */
    public function show($id)
    {
        $submission = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }])->findOrFail($id);

        $primaryFile = $submission->submissionFiles->firstWhere('is_primary', true)
            ?? $submission->submissionFiles->first();

        $data = [
            'id' => $submission->id,
            'studentName' => $submission->student_name,
            'studentYear' => $submission->student_year,
            'workName' => $submission->work_name,
            'description' => $submission->description,
            'filename' => $primaryFile ? $primaryFile->filename : null,
            'filePath' => $primaryFile && $primaryFile->filepath
                ? '/' . $primaryFile->filepath
                : null,
            'thumbnailPath' => $primaryFile && $primaryFile->thumbnail_path
                ? '/' . $primaryFile->thumbnail_path
                : null,
            'files' => $submission->submissionFiles->map(function ($file) {
                return [
                    'id' => $file->id,
                    'requirement_id' => $file->requirement_id,
                    'filename' => $file->filename,
                    'filepath' => $file->filepath ? '/' . $file->filepath : null,
                    'thumbnail_path' => $file->thumbnail_path ? '/' . $file->thumbnail_path : null,
                    'is_primary' => $file->is_primary,
                    'sort_order' => $file->sort_order,
                    'file_type' => $file->file_type,
                    'score' => $file->score,
                    'grade' => $file->grade,
                    'grader_id' => $file->grader_id,
                    'graded_at' => $file->graded_at
                ];
            }),
            'createdAt' => $submission->created_at
        ];

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 获取指定作业的所有提交
     */
    public function byAssignment($assignmentId)
    {
        $submissions = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }])
        ->where('assignment_id', $assignmentId)
        ->orderBy('created_at', 'desc')
        ->get();

        $data = $submissions->map(function ($submission) {
            return [
                ...$submission->toArray(),
                'files' => $submission->submissionFiles->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'requirement_id' => $file->requirement_id,
                        'filename' => $file->filename,
                        'filepath' => $file->filepath ? '/' . $file->filepath : null,
                        'thumbnail_path' => $file->thumbnail_path ? '/' . $file->thumbnail_path : null,
                        'is_primary' => $file->is_primary,
                        'sort_order' => $file->sort_order,
                        'file_type' => $file->file_type,
                        'score' => $file->score,
                        'grade' => $file->grade,
                        'grader_id' => $file->grader_id,
                        'graded_at' => $file->graded_at
                    ];
                })
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 文件级评分
     */
    public function gradeFile(GradeFileRequest $request, $fileId)
    {
        $submissionFile = SubmissionFile::findOrFail($fileId);

        $submissionFile->update([
            'score' => $request->score,
            'grade' => $request->grade,
            'grader_id' => auth()->id(),
            'graded_at' => $request->score === null && $request->grade === null ? null : now()
        ]);

        return response()->json([
            'success' => true,
            'data' => $submissionFile->fresh(),
            'message' => '评分成功'
        ]);
    }

    /**
     * 删除作品
     */
    public function destroy($id)
    {
        $submission = Submission::findOrFail($id);
        $submission->delete();

        return response()->json([
            'success' => true,
            'message' => '删除成功'
        ]);
    }
}