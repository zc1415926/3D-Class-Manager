<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class UploadTypesTest extends DuskTestCase
{
    /**
     * 测试查看上传类型列表
     */
    public function test_view_upload_types_list()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->assertSee('上传类型管理')
                ->assertSee('STL文件')
                ->assertSee('OBJ文件')
                ->assertSee('图片文件');
        });
    }

    /**
     * 测试创建上传类型
     */
    public function test_create_upload_type()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->click('button:contains("添加类型")')
                ->waitFor('.modal.show')
                ->type('input[name="name"]', '视频文件')
                ->type('input[name="code"]', 'video')
                ->type('input[name="extensions"]', 'mp4,avi,mov')
                ->press('button:contains("保存")')
                ->assertSee('上传类型创建成功')
                ->assertSee('视频文件');
        });
    }

    /**
     * 测试编辑上传类型
     */
    public function test_edit_upload_type()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->press('button:contains("编辑"):first')
                ->waitFor('.modal.show')
                ->clear('input[name="name"]')
                ->type('input[name="name"]', '修改后的类型名称')
                ->press('button:contains("保存")')
                ->assertSee('上传类型更新成功')
                ->assertSee('修改后的类型名称');
        });
    }

    /**
     * 测试删除上传类型
     */
    public function test_delete_upload_type()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->press('button:contains("删除"):last')
                ->acceptDialog()
                ->assertSee('删除成功');
        });
    }

    /**
     * 测试上传类型排序
     */
    public function test_upload_types_sorting()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->assertSee('排序功能');
        });
    }

    /**
     * 测试上传类型图标显示
     */
    public function test_upload_type_icons()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("上传类型")')
                ->waitForLocation('/upload-types')
                ->assertPresent('.type-icon');
        });
    }
}