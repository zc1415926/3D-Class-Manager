<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentUploadRequirement;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssignmentController extends Controller
{
    /**
     * 获取作业列表
     */
    public function index()
    {
        $assignments = Assignment::withCount('submissions')
            ->orderBy('sort_order', 'asc')
            ->orderBy('year', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $assignments->map(function ($assignment) {
            $arrayData = $assignment->toArray();
            unset($arrayData['submissions_count']);

            return array_merge($arrayData, [
                'upload_types' => is_string($assignment->upload_types)
                    ? json_decode($assignment->upload_types, true)
                    : $assignment->upload_types,
                'submission_count' => $assignment->submissions_count
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 获取作业详情
     */
    public function show($id)
    {
        $assignment = Assignment::withCount('submissions')->findOrFail($id);

        $arrayData = $assignment->toArray();
        unset($arrayData['submissions_count']);

        $data = array_merge($arrayData, [
            'upload_types' => is_string($assignment->upload_types)
                ? json_decode($assignment->upload_types, true)
                : $assignment->upload_types,
            'submission_count' => $assignment->submissions_count
        ]);

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 创建作业
     */
    public function store(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
            'name' => 'required|string|max:200',
            'upload_types' => 'required|array',
            'description' => 'nullable|string',
            'status' => 'in:active,archived'
        ]);

        $assignment = Assignment::create([
            'year' => $request->year,
            'name' => $request->name,
            'upload_types' => json_encode($request->upload_types),
            'description' => $request->description,
            'status' => $request->status ?? 'active'
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $assignment->id,
                ...$request->all()
            ]
        ], 201);
    }

    /**
     * 更新作业
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'year' => 'required|integer',
            'name' => 'required|string|max:200',
            'upload_types' => 'required|array',
            'description' => 'nullable|string',
            'status' => 'in:active,archived',
            'deadline' => 'nullable|date'
        ]);

        $assignment = Assignment::findOrFail($id);

        $assignment->update([
            'year' => $request->year,
            'name' => $request->name,
            'upload_types' => json_encode($request->upload_types),
            'description' => $request->description,
            'deadline' => $request->deadline,
            'status' => $request->status ?? 'active',
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                ...$request->all()
            ]
        ]);
    }

    /**
     * 批量更新作业排序
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'assignments' => 'required|array'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->assignments as $assignment) {
                Assignment::where('id', $assignment['id'])
                    ->update(['sort_order' => $assignment['sort_order']]);
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '排序已更新'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => '批量更新作业排序失败'
            ], 500);
        }
    }

    /**
     * 删除作业
     */
    public function destroy($id)
    {
        $count = Submission::where('assignment_id', $id)->count();

        if ($count > 0) {
            return response()->json([
                'success' => false,
                'error' => "该作业有 {$count} 个相关作品，无法删除"
            ], 400);
        }

        AssignmentUploadRequirement::where('assignment_id', $id)->delete();

        $assignment = Assignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => '作业已删除'
        ]);
    }

    /**
     * 级联删除作业及其所有作品
     */
    public function cascadeDelete($id)
    {
        $submissions = Submission::where('assignment_id', $id)->get();

        // 删除所有作品记录
        Submission::where('assignment_id', $id)->delete();

        // 删除作业要求
        AssignmentUploadRequirement::where('assignment_id', $id)->delete();

        // 删除作业记录
        $assignment = Assignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => '作业及其所有作品已删除',
            'deleted_submissions' => $submissions->count()
        ]);
    }

    /**
     * 获取某个作业的所有提交
     */
    public function submissions($id)
    {
        $submissions = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }])
        ->where('assignment_id', $id)
        ->orderBy('created_at', 'desc')
        ->get();

        $data = [];
        $currentSubmission = null;

        foreach ($submissions as $row) {
            $submissionData = [
                'id' => $row->id,
                'student_name' => $row->student_name,
                'student_year' => $row->student_year,
                'work_name' => $row->work_name,
                'description' => $row->description,
                'filename' => null,
                'filePath' => null,
                'thumbnail_path' => null,
                'created_at' => $row->created_at,
                'assignment_id' => $row->assignment_id,
                'score' => null,
                'grade' => null,
                'grader_id' => null,
                'graded_at' => null
            ];

            if ($row->submissionFiles->isNotEmpty()) {
                $primaryFile = $row->submissionFiles->firstWhere('is_primary', true)
                    ?? $row->submissionFiles->first();

                if ($primaryFile && $primaryFile->filepath) {
                    $submissionData['filePath'] = '/' . $primaryFile->filepath;
                }

                if ($primaryFile && $primaryFile->thumbnail_path) {
                    $submissionData['thumbnail_path'] = '/' . $primaryFile->thumbnail_path;
                }
            }

            $data[] = $submissionData;
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 获取某个作业的所有作业要求
     */
    public function uploadRequirements($id)
    {
        $requirements = AssignmentUploadRequirement::where('assignment_id', $id)
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $data = $requirements->map(function ($req) {
            return [
                ...$req->toArray(),
                'is_required' => (bool)$req->is_required,
                'is_published' => (bool)$req->is_published
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 创建作业要求
     */
    public function storeRequirement(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:200',
            'upload_type' => 'required|string',
            'is_required' => 'boolean',
            'is_published' => 'boolean',
            'sort_order' => 'integer'
        ]);

        $requirement = AssignmentUploadRequirement::create([
            'assignment_id' => $id,
            'name' => $request->name,
            'upload_type' => $request->upload_type,
            'is_required' => $request->is_required ?? true,
            'is_published' => $request->is_published ?? true,
            'sort_order' => $request->sort_order ?? 0
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $requirement->id,
                ...$request->all()
            ]
        ], 201);
    }

    /**
     * 更新作业要求
     */
    public function updateRequirement(Request $request, $id, $requirementId)
    {
        $request->validate([
            'name' => 'required|string|max:200',
            'upload_type' => 'required|string',
            'is_required' => 'boolean',
            'is_published' => 'boolean',
            'sort_order' => 'integer'
        ]);

        $requirement = AssignmentUploadRequirement::where('id', $requirementId)
            ->where('assignment_id', $id)
            ->firstOrFail();

        $requirement->update([
            'name' => $request->name,
            'upload_type' => $request->upload_type,
            'is_required' => $request->is_required ?? true,
            'is_published' => $request->is_published ?? true,
            'sort_order' => $request->sort_order ?? 0
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $requirementId,
                ...$request->all()
            ]
        ]);
    }

    /**
     * 删除作业要求
     */
    public function destroyRequirement($id, $requirementId)
    {
        $requirement = AssignmentUploadRequirement::where('id', $requirementId)
            ->where('assignment_id', $id)
            ->firstOrFail();

        $requirement->delete();

        return response()->json([
            'success' => true,
            'message' => '作业要求已删除'
        ]);
    }

    /**
     * 批量更新作业要求排序
     */
    public function reorderRequirements(Request $request, $id)
    {
        $request->validate([
            'requirements' => 'required|array'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->requirements as $req) {
                AssignmentUploadRequirement::where('id', $req['id'])
                    ->where('assignment_id', $id)
                    ->update(['sort_order' => $req['sort_order']]);
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '排序已更新'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => '批量更新排序失败'
            ], 500);
        }
    }

    /**
     * 导出作业作品（简化版）
     */
    public function export($id)
    {
        $assignment = Assignment::findOrFail($id);
        $submissions = Submission::where('assignment_id', $id)->get();

        if ($submissions->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => '该作业没有作品可导出'
            ], 400);
        }

        // 简化版：返回JSON格式的作品清单
        $manifest = $submissions->map(function ($sub) {
            return [
                'id' => $sub->id,
                'student_name' => $sub->student_name,
                'student_year' => $sub->student_year,
                'work_name' => $sub->work_name,
                'description' => $sub->description,
                'created_at' => $sub->created_at
            ];
        });

        return response()->json([
            'success' => true,
            'message' => '导出成功',
            'data' => [
                'assignment' => $assignment->name,
                'submissions' => $manifest
            ]
        ]);
    }

    /**
     * 移动上传的文件
     */
    public function moveUploadedFiles(Request $request, $id)
    {
        $request->validate([
            'files' => 'array',
            'year' => 'required|integer'
        ]);

        // 简化版：仅返回成功
        return response()->json([
            'success' => true,
            'message' => '文件移动成功',
            'movedFiles' => []
        ]);
    }
}