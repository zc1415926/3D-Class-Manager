<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * 获取学生列表
     */
    public function index()
    {
        $students = Student::orderBy('year', 'desc')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'year', 'grade', 'class_number', 'created_at']);

        $data = $students->map(function ($student) {
            return [
                'id' => $student->id,
                'name' => $student->name,
                'year' => $student->year,
                'grade' => $student->grade ?? '一',
                'class_number' => $student->class_number ?? 1,
                'createdAt' => $student->created_at
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * 添加学生
     */
    public function store(StoreStudentRequest $request)
    {
        $student = Student::create([
            'name' => $request->name,
            'year' => $request->year,
            'grade' => $request->grade ?? '一',
            'class_number' => $request->class_number ?? 1
        ]);

        return response()->json([
            'success' => true,
            'message' => '学生添加成功',
            'data' => [
                'id' => $student->id,
                'name' => $student->name,
                'year' => $student->year,
                'grade' => $student->grade ?? '一',
                'class_number' => $student->class_number ?? 1
            ]
        ], 201);
    }

    /**
     * 更新学生信息
     */
    public function update(UpdateStudentRequest $request, $id)
    {
        $student = Student::findOrFail($id);

        $student->update([
            'name' => $request->name,
            'year' => $request->year,
            'grade' => $request->grade ?? '一',
            'class_number' => $request->class_number ?? 1
        ]);

        return response()->json([
            'success' => true,
            'message' => '学生信息更新成功',
            'data' => [
                'id' => $student->id,
                'name' => $student->name,
                'year' => $student->year,
                'grade' => $student->grade ?? '一',
                'class_number' => $student->class_number ?? 1
            ]
        ]);
    }

    /**
     * 删除学生
     */
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => '删除成功'
        ]);
    }
}