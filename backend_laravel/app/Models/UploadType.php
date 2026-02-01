<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UploadType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'extensions',
        'max_file_size',
        'sort_order',
    ];

    protected $casts = [
        'max_file_size' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 获取扩展名数组
     */
    public function getExtensionsAttribute($value)
    {
        return $value ? explode(',', $value) : [];
    }

    /**
     * 设置扩展名
     */
    public function setExtensionsAttribute($value)
    {
        $this->attributes['extensions'] = is_array($value) ? implode(',', $value) : $value;
    }

    /**
     * 关联的作业要求
     */
    public function uploadRequirements()
    {
        return $this->hasMany(AssignmentUploadRequirement::class, 'upload_type', 'code');
    }
}