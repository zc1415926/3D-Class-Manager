<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadType\StoreUploadTypeRequest;
use App\Http\Requests\UploadType\UpdateUploadTypeRequest;
use App\Models\UploadType;
use Illuminate\Http\Request;

class UploadTypeController extends Controller
{
    /**
     * 获取上传类型列表
     */
    public function index()
    {
        $uploadTypes = UploadType::orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $data = $uploadTypes->map(function ($type) {
            $arrayData = $type->toArray();
            return array_merge($arrayData, [
                'extensions' => is_array($type->extensions) ? $type->extensions : [],
                'max_file_size' => $type->max_file_size ?? 52428800
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 获取单个上传类型
     */
    public function show($id)
    {
        $uploadType = UploadType::findOrFail($id);
        
        $arrayData = $uploadType->toArray();
        $data = array_merge($arrayData, [
            'extensions' => is_array($uploadType->extensions) ? $uploadType->extensions : [],
            'max_file_size' => $uploadType->max_file_size ?? 52428800
        ]);

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 创建上传类型
     */
    public function store(StoreUploadTypeRequest $request)
    {
        // 检查编码是否已存在
        if (UploadType::where('code', $request->code)->exists()) {
            return response()->json([
                'success' => false,
                'error' => '上传类型编码已存在'
            ], 400);
        }

        $uploadType = UploadType::create([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description ?? '',
            'extensions' => is_array($request->extensions)
                ? implode(',', $request->extensions)
                : ($request->extensions ?? ''),
            'max_file_size' => $request->max_file_size ?? 52428800,
            'sort_order' => $request->sort_order ?? 0
        ]);

        return response()->json([
            'success' => true,
            'data' => array_merge(['id' => $uploadType->id], $request->all())
        ], 201);
    }

    /**
     * 更新上传类型
     */
    public function update(UpdateUploadTypeRequest $request, $id)
    {
        $uploadType = UploadType::findOrFail($id);

        // 如果修改了编码，检查新编码是否已被其他类型使用
        if ($request->code && $request->code !== $uploadType->code) {
            if (UploadType::where('code', $request->code)
                ->where('id', '!=', $id)
                ->exists()) {
                return response()->json([
                    'success' => false,
                    'error' => '上传类型编码已存在'
                ], 400);
            }
        }

        $uploadType->update([
            'name' => $request->name ?? $uploadType->name,
            'code' => $request->code ?? $uploadType->code,
            'description' => $request->description ?? $uploadType->description,
            'extensions' => is_array($request->extensions)
                ? implode(',', $request->extensions)
                : ($request->extensions ?? $uploadType->extensions),
            'max_file_size' => $request->max_file_size ?? $uploadType->max_file_size ?? 52428800,
            'sort_order' => $request->sort_order ?? $uploadType->sort_order ?? 0
        ]);

        return response()->json([
            'success' => true,
            'data' => array_merge(['id' => (int)$id], $request->all())
        ]);
    }

    /**
     * 删除上传类型
     */
    public function destroy($id)
    {
        $uploadType = UploadType::findOrFail($id);

        // 检查是否被使用
        $count = \App\Models\AssignmentUploadRequirement::where('upload_type', $uploadType->code)
            ->count();

        if ($count > 0) {
            return response()->json([
                'success' => false,
                'error' => "该上传类型被 {$count} 个作业要求使用，无法删除"
            ], 400);
        }

        $uploadType->delete();

        return response()->json([
            'success' => true,
            'message' => '上传类型已删除'
        ]);
    }

    /**
     * 批量更新排序
     */
    public function batchSort(Request $request)
    {
        $request->validate([
            'items' => 'required|array'
        ]);

        foreach ($request->items as $index => $item) {
            UploadType::where('id', $item['id'])
                ->update(['sort_order' => $index]);
        }

        return response()->json([
            'success' => true,
            'message' => '排序更新成功'
        ]);
    }
}
