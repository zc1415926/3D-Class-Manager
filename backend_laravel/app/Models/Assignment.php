<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'name',
        'upload_types',
        'description',
        'deadline',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'year' => 'integer',
        'sort_order' => 'integer',
        'deadline' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 获取上传类型（解析JSON）
     */
    public function getUploadTypesAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    /**
     * 设置上传类型（转为JSON）
     */
    public function setUploadTypesAttribute($value)
    {
        $this->attributes['upload_types'] = is_array($value) ? json_encode($value) : $value;
    }

    /**
     * 提交的作品
     */
    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    /**
     * 上传要求
     */
    public function uploadRequirements()
    {
        return $this->hasMany(AssignmentUploadRequirement::class, 'assignment_id');
    }
}