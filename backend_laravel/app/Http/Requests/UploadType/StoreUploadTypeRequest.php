<?php

namespace App\Http\Requests\UploadType;

use Illuminate\Foundation\Http\FormRequest;

class StoreUploadTypeRequest extends FormRequest
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
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string',
            'extensions' => 'nullable|array',
            'max_file_size' => 'nullable|integer',
            'sort_order' => 'nullable|integer',
        ];
    }
}