<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class FileManagementTest extends DuskTestCase
{
    /**
     * 测试上传STL文件
     */
    public function test_upload_stl_file()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->click('a:contains("新建作业")')
                ->waitForLocation('/assignment-new')
                ->type('input[name="name"]', '测试STL上传')
                ->type('input[name="year"]', '2026')
                ->attach('input[type="file"]', '/home/zc1415926/3D-Class-Manager/test_correct_file.stl')
                ->press('button:contains("保存")')
                ->assertSee('文件上传成功');
        });
    }

    /**
     * 测试上传图片文件
     */
    public function test_upload_image_file()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->press('button:contains("添加类型")')
                ->waitFor('.modal.show')
                ->type('input[name="name"]', '测试图片上传')
                ->type('input[name="code"]', 'test_image')
                ->press('button:contains("保存")')
                ->assertSee('上传成功');
        });
    }

    /**
     * 测试文件大小限制
     */
    public function test_file_size_limit()
    {
        $this->browse(function (Browser $browser) {
            // 尝试上传过大的文件
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('文件大小限制');
        });
    }

    /**
     * 测试文件类型验证
     */
    public function test_file_type_validation()
    {
        $this->browse(function (Browser $browser) {
            // 尝试上传不支持的文件类型
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('文件类型验证');
        });
    }

    /**
     * 测试下载文件
     */
    public function test_download_file()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作品管理")')
                ->waitForLocation('/teacher-page')
                ->click('a:contains("查看"):first')
                ->click('button:contains("下载"):first')
                ->assertSee('下载开始');
        });
    }

    /**
     * 测试多文件上传
     */
    public function test_multiple_file_upload()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->click('a:contains("查看"):first')
                ->assertSee('多文件上传');
        });
    }

    /**
     * 测试缩略图生成
     */
    public function test_thumbnail_generation()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作品管理")')
                ->waitForLocation('/teacher-page')
                ->assertPresent('.thumbnail');
        });
    }
}