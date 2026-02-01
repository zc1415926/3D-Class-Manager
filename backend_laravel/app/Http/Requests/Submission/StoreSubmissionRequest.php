<?php

namespace App\Http\Requests\Submission;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'studentName' => 'required|string|max:100',
            'studentYear' => 'required|integer',
            'workName' => 'required|string|max:200',
            'description' => 'nullable|string',
            'assignmentId' => 'nullable|integer',
            // 单文件模式（向后兼容）
            'stlFile' => 'nullable|file|max:52428800',
            'thumbnail' => 'nullable|image|max:5242880',
            // 多文件模式
            'files' => 'nullable|array',
            'files.*' => 'nullable|file|max:52428800',
            'thumbnails' => 'nullable|array',
            'thumbnails.*' => 'nullable|image|max:5242880',
            'requirementIds' => 'nullable|string',
        ];
    }

    /**
     * 配置验证器消息
     */
    public function messages(): array
    {
        return [
            'studentName.required' => '学生姓名不能为空',
            'studentYear.required' => '年份不能为空',
            'workName.required' => '作品名称不能为空',
            'files.*.file' => '上传的必须是有效的文件',
            'files.*.max' => '文件大小不能超过50MB',
            'thumbnails.*.image' => '缩略图必须是图片格式',
            'thumbnails.*.max' => '缩略图大小不能超过5MB',
        ];
    }

    /**
     * 验证后扩展验证逻辑
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->hasFile('files')) {
                $allowedExtensions = ['stl', 'obj', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'avi', 'mov'];
                $imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];

                foreach ($this->file('files') as $index => $file) {
                    $extension = strtolower($file->getClientOriginalExtension());

                    if (!in_array($extension, $allowedExtensions)) {
                        $validator->errors()->add("files.$index", "不支持的文件类型: $extension");
                    }
                }
            }

            if ($this->hasFile('thumbnails')) {
                $imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];

                foreach ($this->file('thumbnails') as $index => $file) {
                    $extension = strtolower($file->getClientOriginalExtension());

                    if (!in_array($extension, $imageExtensions)) {
                        $validator->errors()->add("thumbnails.$index", "缩略图必须是图片格式");
                    }
                }
            }

            // 验证单文件模式
            if ($this->hasFile('stlFile')) {
                $file = $this->file('stlFile');
                $extension = strtolower($file->getClientOriginalExtension());
                $allowedExtensions = ['stl', 'obj'];

                if (!in_array($extension, $allowedExtensions)) {
                    $validator->errors()->add('stlFile', "不支持的文件类型: $extension，只支持STL或OBJ格式");
                }
            }
        });
    }
}